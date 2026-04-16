// @vitest-environment jsdom

import 'fake-indexeddb/auto'

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import HomeEntry from '../src/features/home/HomeEntry.vue'
import {
  createEntryLocation,
  generateEntrySid,
  normalizeEntrySid,
  resolveEntrySid
} from '../src/features/home/entry-sid'
import {
  LOCAL_NOTE_DB_NAME,
  createLocalNoteRecord,
  resolveLocalNoteStorage
} from '../src/features/local-note/storage/local-note-storage'
import { createAppRouter } from '../src/router'

const deterministicSidBytes = [
  new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
  new Uint8Array([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]),
  new Uint8Array([20, 21, 22, 23, 24, 25, 26, 27, 28, 29])
]

function installDeterministicRandomBytes() {
  const queue = deterministicSidBytes.map((bytes) => new Uint8Array(bytes))

  return vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(
    ((array: Uint8Array) => {
      const nextBytes = queue.shift()

      if (!nextBytes) {
        throw new Error('Missing deterministic random bytes for test.')
      }

      array.set(nextBytes)
      return array
    }) as typeof globalThis.crypto.getRandomValues
  )
}

async function mountHomeEntry() {
  const router = createAppRouter({ history: createMemoryHistory() })
  await router.push('/')
  await router.isReady()

  const wrapper = mount(HomeEntry, {
    global: {
      plugins: [router]
    }
  })

  await flushPromises()

  return { router, wrapper }
}

async function flushUiState() {
  for (let index = 0; index < 3; index += 1) {
    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })
    await flushPromises()
  }
}

async function resetLocalNoteDatabase() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(LOCAL_NOTE_DB_NAME)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('delete database blocked'))
  })
}

function getLocalNoteStorage() {
  const storage = resolveLocalNoteStorage()

  if (!storage) {
    throw new Error('expected indexedDB local note storage to be available')
  }

  return storage
}

async function seedLocalNotes() {
  const storage = getLocalNoteStorage()

  await storage.writeRecord(
    createLocalNoteRecord('alpha-note', '这是第一条本地便签', '2026-04-04T09:00:00.000Z')
  )
  await storage.writeRecord(
    createLocalNoteRecord('beta-note', '用于搜索的第二条摘要', '2026-04-04T11:00:00.000Z')
  )
}

describe('home entry utilities', () => {
  let getRandomValuesSpy: ReturnType<typeof installDeterministicRandomBytes>

  beforeEach(async () => {
    getRandomValuesSpy = installDeterministicRandomBytes()
    await resetLocalNoteDatabase()
    window.localStorage.clear()
  })

  afterEach(() => {
    getRandomValuesSpy.mockRestore()
  })

  it('normalizes user-provided sid values conservatively', () => {
    expect(normalizeEntrySid('  note-123  ')).toBe('note-123')
    expect(normalizeEntrySid('   ')).toBe('')
  })

  it('generates a 10-character sid from deterministic random bytes', () => {
    const sid = generateEntrySid(() => new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]))

    expect(sid).toHaveLength(10)
    expect(sid).toBe('abcdefghjk')
  })

  it('reuses trimmed user input instead of replacing it with a generated fallback', () => {
    const result = resolveEntrySid('  keep-me  ', 'fallbacksid', () => 'newvalue123')

    expect(result).toEqual({
      sid: 'keep-me',
      nextFallbackSid: 'fallbacksid',
      usedFallback: false
    })
  })

  it('uses the prepared fallback sid when the draft is empty', () => {
    const result = resolveEntrySid('   ', 'draftsid10', () => 'freshsid99')

    expect(result).toEqual({
      sid: 'draftsid10',
      nextFallbackSid: 'freshsid99',
      usedFallback: true
    })
  })

  it('builds online and local navigation targets with named routes instead of missing-sid shells', () => {
    const router = createAppRouter({ history: createMemoryHistory() })

    const onlineTarget = createEntryLocation('online', 'note123abc4')
    const localTarget = createEntryLocation('local', 'local123ab9')

    expect(router.resolve(onlineTarget).name).toBe('online-note')
    expect(router.resolve(onlineTarget).fullPath).toContain('/o/note123abc4')
    expect(router.resolve(localTarget).name).toBe('local-note')
    expect(router.resolve(localTarget).fullPath).toContain('/l/local123ab9')
  })

  it('keeps the homepage input visually empty while still disabling autocapitalize', async () => {
    const { wrapper } = await mountHomeEntry()

    const input = wrapper.get('input')

    expect((input.element as HTMLInputElement).value).toBe('')
    expect(input.attributes('auto-capitalize')).toBeUndefined()
    expect(input.attributes('autocapitalize')).toBe('off')
    expect(input.attributes('placeholder')).toBe('输入 ID')
    expect(wrapper.text()).toContain('留空时会自动生成一个新 ID')
  })

  it('keeps the homepage single-screen and the local note panel collapsed by default', async () => {
    const { wrapper } = await mountHomeEntry()

    expect(wrapper.get('[data-testid="home-entry-layout"]').classes()).toContain('overflow-hidden')
    expect(wrapper.get('[data-testid="local-notes-toggle"]').attributes('aria-expanded')).toBe('false')
    expect(wrapper.get('[data-testid="local-notes-panel"]').text()).toContain('本地便签')
  })

  it('submits the prepared fallback sid when the draft stays empty', async () => {
    const { router, wrapper } = await mountHomeEntry()

    const input = wrapper.get('input')
    await input.setValue('')
    await flushPromises()

    expect((input.element as HTMLInputElement).value).toBe('')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('online-note')
    expect(router.currentRoute.value.params.sid).toBe('abcdefghjk')
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('')
  })

  it('keeps the online path as the default form submit route', async () => {
    const { router, wrapper } = await mountHomeEntry()

    const buttons = wrapper.findAll('button')
    expect(buttons[0]?.attributes('type')).toBe('submit')
    expect(buttons[1]?.attributes('type')).toBe('button')

    await wrapper.get('input').setValue('keep-me')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('online-note')
    expect(router.currentRoute.value.params.sid).toBe('keep-me')
  })

  it('expands the local note panel, filters summaries, and opens the selected local note', async () => {
    await seedLocalNotes()

    const { router, wrapper } = await mountHomeEntry()

    await wrapper.get('[data-testid="local-notes-toggle"]').trigger('click')
    await flushUiState()

    expect(wrapper.get('[data-testid="local-notes-toggle"]').attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('[data-testid="local-notes-list"]').classes()).toContain('overflow-y-auto')
    expect(wrapper.findAll('[data-testid="local-note-item"]')).toHaveLength(2)

    const searchInput = wrapper.get('[data-testid="local-notes-search"] input')
    await searchInput.setValue('beta')
    await flushUiState()

    const filteredItems = wrapper.findAll('[data-testid="local-note-item"]')
    expect(filteredItems).toHaveLength(1)
    expect(filteredItems[0]?.text()).toContain('beta-note')

    await filteredItems[0]!.trigger('click')
    await flushUiState()

    expect(router.currentRoute.value.name).toBe('local-note')
    expect(router.currentRoute.value.params.sid).toBe('beta-note')
  })

  it('remembers the local note panel expanded preference across remounts', async () => {
    const firstMount = await mountHomeEntry()

    await firstMount.wrapper.get('[data-testid="local-notes-toggle"]').trigger('click')
    await flushUiState()

    expect(window.localStorage.getItem('note:home:local-notes-expanded')).toBe('true')

    firstMount.wrapper.unmount()

    const secondMount = await mountHomeEntry()

    await flushUiState()

    expect(secondMount.wrapper.get('[data-testid="local-notes-toggle"]').attributes('aria-expanded')).toBe(
      'true'
    )
  })

  it('shows an empty state when there are no saved local notes', async () => {
    const { wrapper } = await mountHomeEntry()

    await wrapper.get('[data-testid="local-notes-toggle"]').trigger('click')
    await flushUiState()

    expect(wrapper.get('[data-testid="local-notes-empty"]').text()).toContain('还没有本地便签')
  })
})
