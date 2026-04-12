// @vitest-environment jsdom

import { nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useLocalNote } from '../src/features/local-note/use-local-note'
import { createLocalNoteStorageKey } from '../src/features/local-note/storage/local-note-storage'

async function flushState() {
  await Promise.resolve()
  await nextTick()
}

describe('useLocalNote', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('restores existing content for the current sid from a stable localStorage namespace', async () => {
    window.localStorage.setItem(
      createLocalNoteStorageKey('local-a'),
      JSON.stringify({
        sid: 'local-a',
        content: '之前已经保存的本地正文',
        updatedAt: '2026-04-04T00:00:00.000Z'
      })
    )

    const sid = ref('local-a')
    const note = useLocalNote(sid)

    await flushState()

    expect(note.draftContent.value).toBe('之前已经保存的本地正文')
    expect(note.objectHeader.value).toMatchObject({
      sid: 'local-a',
      localStatusLabel: '已恢复本地内容'
    })
    expect(note.primaryFeedback.value?.title).toBe('已恢复本地内容')
  })

  it('saves to the namespaced localStorage key and keeps different sid values isolated', async () => {
    const sid = ref('local-a')
    const note = useLocalNote(sid, {
      now: () => '2026-04-04T12:00:00.000Z'
    })

    await flushState()

    note.draftContent.value = '只属于 A 的本地正文'
    await note.saveNote()
    await flushState()

    expect(window.localStorage.getItem(createLocalNoteStorageKey('local-a'))).toContain(
      '只属于 A 的本地正文'
    )

    sid.value = 'local-b'
    await flushState()

    expect(note.draftContent.value).toBe('')
    expect(note.primaryFeedback.value?.title).toBe('当前 sid 还没有本地内容')

    sid.value = 'local-a'
    await flushState()

    expect(note.draftContent.value).toBe('只属于 A 的本地正文')
    expect(window.localStorage.getItem(createLocalNoteStorageKey('local-b'))).toBeNull()
  })

  it('returns an invalid-sid view model when the route param cannot be resolved', async () => {
    const sid = ref<string | null>(null)
    const note = useLocalNote(sid)

    await flushState()

    expect(note.viewModel.value).toMatchObject({
      status: 'invalid-sid',
      sid: null
    })
    expect(note.objectHeader.value).toBeNull()
  })

  it('reports storage-unavailable instead of silently falling back to memory only mode', async () => {
    const sid = ref('blocked-note')
    const note = useLocalNote(sid, {
      getStorage: () => null
    })

    await flushState()

    expect(note.viewModel.value).toMatchObject({
      status: 'storage-unavailable',
      sid: 'blocked-note'
    })
    expect(note.primaryFeedback.value?.title).toBe('无法使用本地便签')
  })

  it('preserves the current draft when saving to local storage fails', async () => {
    const sid = ref('broken-save')
    const note = useLocalNote(sid, {
      getStorage: () => ({
        getItem: () => null,
        setItem: () => {
          throw new Error('quota exceeded')
        }
      })
    })

    await flushState()

    note.draftContent.value = '失败后也不能丢失的草稿'
    await note.saveNote()
    await flushState()

    expect(note.saveState.value).toBe('save-error')
    expect(note.draftContent.value).toBe('失败后也不能丢失的草稿')
    expect(note.primaryFeedback.value?.title).toBe('保存到本地失败')
  })

  it('returns to an unsaved state after the user edits a previously saved note', async () => {
    const sid = ref('local-a')
    const note = useLocalNote(sid, {
      now: () => '2026-04-04T12:00:00.000Z'
    })

    await flushState()

    note.draftContent.value = '第一版本地正文'
    await note.saveNote()
    await flushState()

    expect(note.saveState.value).toBe('saved')
    expect(note.primaryFeedback.value?.title).toBe('已保存到本地')

    note.draftContent.value = '第一版本地正文，追加未保存修改'
    await flushState()

    expect(note.saveState.value).toBe('unsaved')
    expect(note.objectHeader.value).toMatchObject({
      saveStatusLabel: '未保存到本地'
    })
    expect(note.primaryFeedback.value?.title).toBe('未保存到本地')
  })
})
