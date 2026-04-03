// @vitest-environment jsdom

import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import {
  resolveOnlineNoteViewModel,
  type OnlineNoteSaveFeedback,
  type OnlineNoteSaveState,
  type OnlineNoteViewModel
} from '../src/features/note/online-note'
import OnlineNoteShell from '../src/features/note/components/OnlineNoteShell.vue'

const mockedViewModel = vi.hoisted(
  (): {
    value: OnlineNoteViewModel
  } => ({
    value: {
      status: 'loading',
      sid: 'note123abc4',
      content: null,
      title: '正在读取在线便签',
      description: '我们正在根据当前 sid 拉取该在线便签的最新已保存内容。'
    }
  })
)

const mockedDraftContent = vi.hoisted(() => ({ value: '' }))
const mockedSaveState = vi.hoisted((): { value: OnlineNoteSaveState } => ({ value: 'unsaved' }))
const mockedSaveFeedback = vi.hoisted((): { value: OnlineNoteSaveFeedback | null } => ({ value: null }))
const mockedSaveNote = vi.hoisted(() => vi.fn(async () => undefined))

vi.mock('../src/features/note/use-online-note', async () => {
  return {
    useOnlineNote: () => ({
      viewModel: computed(() => mockedViewModel.value),
      draftContent: computed({
        get: () => mockedDraftContent.value,
        set: (value: string) => {
          mockedDraftContent.value = value
        }
      }),
      saveState: computed(() => mockedSaveState.value),
      saveFeedback: computed(() => mockedSaveFeedback.value),
      saveNote: mockedSaveNote
    })
  }
})

function createViewModel(overrides: Partial<OnlineNoteViewModel>): OnlineNoteViewModel {
  return {
    status: 'loading',
    sid: 'note123abc4',
    content: null,
    title: '正在读取在线便签',
    description: '我们正在根据当前 sid 拉取该在线便签的最新已保存内容。',
    ...overrides
  }
}

function mountShell() {
  return mount(OnlineNoteShell, {
    props: {
      sid: mockedViewModel.value.sid
    }
  })
}

describe('online note shell', () => {
  it('renders a clear loading state while the note detail is being fetched', () => {
    mockedViewModel.value = createViewModel({
      status: 'loading'
    })
    mockedDraftContent.value = ''
    mockedSaveState.value = 'unsaved'
    mockedSaveFeedback.value = null

    const wrapper = mountShell()

    expect(wrapper.text()).toContain('正在读取在线便签')
    expect(wrapper.text()).toContain('note123abc4')
  })

  it('turns not-found into an editable first-save state', () => {
    mockedViewModel.value = createViewModel({
      status: 'not-found',
      title: '这个 sid 还没有保存内容',
      description: '你可以直接开始输入正文，并在当前固定链接下首次保存。'
    })
    mockedDraftContent.value = ''
    mockedSaveState.value = 'unsaved'
    mockedSaveFeedback.value = {
      tone: 'warning',
      state: 'default',
      title: '尚未保存',
      description: '当前 sid 还没有远端对象，点击保存后会创建第一版内容。'
    }

    const wrapper = mountShell()

    expect(wrapper.text()).toContain('这个 sid 还没有保存内容')
    expect(wrapper.text()).toContain('尚未保存')
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.text()).toContain('首次保存')
  })

  it('renders the loaded content inside an editable area for existing notes', () => {
    mockedViewModel.value = createViewModel({
      status: 'available',
      title: '在线便签内容',
      description: '当前对象已经存在，可以继续编辑并保存更新。',
      content: '这是最新已保存内容。'
    })
    mockedDraftContent.value = '这是最新已保存内容。'
    mockedSaveState.value = 'saved'
    mockedSaveFeedback.value = {
      tone: 'success',
      state: 'default',
      title: '已保存',
      description: '最新修改已经写回当前 sid。'
    }

    const wrapper = mountShell()
    const textarea = wrapper.find('textarea')

    expect(textarea.exists()).toBe(true)
    expect((textarea.element as HTMLTextAreaElement).value).toBe('这是最新已保存内容。')
    expect(wrapper.text()).toContain('保存更新')
    expect(wrapper.text()).toContain('已保存')
  })

  it('shows a saving indicator while the save request is in flight', () => {
    mockedViewModel.value = createViewModel({
      status: 'available',
      content: '草稿内容。'
    })
    mockedDraftContent.value = '草稿内容。'
    mockedSaveState.value = 'saving'
    mockedSaveFeedback.value = {
      tone: 'info',
      state: 'focus',
      title: '保存中',
      description: '正在将当前正文写入该 sid 对应的在线便签。'
    }

    const wrapper = mountShell()

    expect(wrapper.text()).toContain('保存中')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('shows a clear failure message while preserving the local draft after save errors', () => {
    mockedViewModel.value = createViewModel({
      status: 'available',
      content: '旧内容。'
    })
    mockedDraftContent.value = '用户尚未保存的新草稿。'
    mockedSaveState.value = 'save-error'
    mockedSaveFeedback.value = {
      tone: 'danger',
      state: 'error',
      title: '保存失败',
      description: '服务端拒绝了当前写入，请稍后重试。'
    }

    const wrapper = mountShell()
    const textarea = wrapper.find('textarea')

    expect(wrapper.text()).toContain('保存失败')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('用户尚未保存的新草稿。')
  })

  it('keeps deleted notes in a non-editable error state', () => {
    mockedViewModel.value = createViewModel({
      status: 'deleted',
      title: '该在线便签已删除',
      description: '该在线便签已删除，当前链接不可继续读取。'
    })
    mockedDraftContent.value = ''
    mockedSaveState.value = 'unsaved'
    mockedSaveFeedback.value = null

    const wrapper = mountShell()

    expect(wrapper.text()).toContain('该在线便签已删除')
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('首次保存')
  })
})

describe('resolveOnlineNoteViewModel', () => {
  it('falls back to an error state when a 200 payload is not a valid note detail dto', () => {
    const viewModel = resolveOnlineNoteViewModel({
      sid: 'shell-status',
      loading: false,
      note: {
        module: 'notes',
        scope: 'notes module shell is reserved for future stories.'
      }
    })

    expect(viewModel).toMatchObject({
      status: 'error',
      sid: 'shell-status',
      title: '读取在线便签失败'
    })
    expect(viewModel.description).toContain('无法识别的响应格式')
  })

  it('marks a missing sid as creatable not-found state instead of a terminal error', () => {
    const viewModel = resolveOnlineNoteViewModel({
      sid: 'fresh123',
      loading: false,
      error: {
        response: {
          data: {
            sid: 'fresh123',
            code: 'NOTE_NOT_FOUND',
            status: 'not-found',
            message: '未找到与当前 sid 对应的在线便签。'
          }
        }
      }
    })

    expect(viewModel).toMatchObject({
      status: 'not-found',
      sid: 'fresh123'
    })
    expect(viewModel.description).toContain('首次保存')
  })
})
