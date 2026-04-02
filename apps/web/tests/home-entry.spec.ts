// @vitest-environment jsdom

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

describe('home entry utilities', () => {
  let getRandomValuesSpy: ReturnType<typeof installDeterministicRandomBytes>

  beforeEach(() => {
    getRandomValuesSpy = installDeterministicRandomBytes()
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
    expect(router.resolve(onlineTarget).fullPath).toContain('/note/o/note123abc4')
    expect(router.resolve(localTarget).name).toBe('local-note')
    expect(router.resolve(localTarget).fullPath).toContain('/note/l/local123ab9')
  })

  it('shows the prepared sid in the homepage input and disables autocapitalize', async () => {
    const { wrapper } = await mountHomeEntry()

    const input = wrapper.get('input')

    expect((input.element as HTMLInputElement).value).toBe('abcdefghjk')
    expect(input.attributes('auto-capitalize')).toBeUndefined()
    expect(input.attributes('autocapitalize')).toBe('off')
    expect(wrapper.text()).toContain('已自动准备好固定入口')
    expect(wrapper.text()).toContain('abcdefghjk')
  })

  it('regenerates a fallback sid after the draft is cleared and submitted', async () => {
    const { router, wrapper } = await mountHomeEntry()

    const input = wrapper.get('input')
    await input.setValue('')
    await flushPromises()

    expect(wrapper.text()).toContain('mnpqrstuvw')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('online-note')
    expect(router.currentRoute.value.params.sid).toBe('mnpqrstuvw')
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('mnpqrstuvw')
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
})
