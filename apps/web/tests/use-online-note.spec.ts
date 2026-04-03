// @vitest-environment jsdom

import { nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestHarness = vi.hoisted(() => {
  type Deferred<T> = {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (reason?: unknown) => void
  }

  type RequestController = {
    data: { value: unknown }
    error: { value: unknown }
    loading: { value: boolean }
    pending: Deferred<unknown> | null
    lastArg: unknown
    send: (arg: unknown) => Promise<unknown>
    update: (patch: { data?: unknown; error?: unknown }) => void
    abort: () => Promise<void>
  }

  let invocation = 0
  let readController: RequestController | null = null
  let saveController: RequestController | null = null

  function createDeferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((nextResolve, nextReject) => {
      resolve = nextResolve
      reject = nextReject
    })

    return {
      promise,
      resolve,
      reject
    }
  }

  function getController(kind: 'read' | 'save') {
    const controller = kind === 'read' ? readController : saveController

    if (!controller) {
      throw new Error(`Missing ${kind} request controller`)
    }

    return controller
  }

  return {
    reset() {
      invocation = 0
      readController = null
      saveController = null
    },
    useRequestFactory(refFactory: typeof ref) {
      return () => {
        const data = refFactory<unknown>()
        const error = refFactory<unknown>()
        const loading = refFactory(false)

        const controller: RequestController = {
          data,
          error,
          loading,
          pending: null,
          lastArg: undefined,
          send(arg: unknown) {
            controller.lastArg = arg
            controller.loading.value = true
            controller.pending = createDeferred()

            return controller.pending.promise
          },
          update(patch) {
            if ('data' in patch) {
              controller.data.value = patch.data
            }

            if ('error' in patch) {
              controller.error.value = patch.error
            }
          },
          async abort() {}
        }

        if (invocation === 0) {
          readController = controller
        } else {
          saveController = controller
        }
        invocation += 1

        return controller
      }
    },
    resolveRead(value: unknown) {
      const controller = getController('read')
      controller.loading.value = false
      controller.data.value = value
      controller.error.value = undefined
      controller.pending?.resolve(value)
      controller.pending = null
    },
    rejectRead(reason: unknown) {
      const controller = getController('read')
      controller.loading.value = false
      controller.error.value = reason
      controller.pending?.reject(reason)
      controller.pending = null
    },
    resolveSave(value: unknown) {
      const controller = getController('save')
      controller.loading.value = false
      controller.data.value = value
      controller.error.value = undefined
      controller.pending?.resolve(value)
      controller.pending = null
    },
    rejectSave(reason: unknown) {
      const controller = getController('save')
      controller.loading.value = false
      controller.error.value = reason
      controller.pending?.reject(reason)
      controller.pending = null
    },
    getReadArg() {
      return getController('read').lastArg
    },
    getSaveArg() {
      return getController('save').lastArg
    }
  }
})

vi.mock('alova/client', async () => {
  const { ref } = await import('vue')

  return {
    useRequest: requestHarness.useRequestFactory(ref)
  }
})

vi.mock('../src/services/note-methods', () => {
  return {
    createGetOnlineNoteDetailMethod: (sid: string) => ({
      kind: 'read',
      sid
    }),
    createSaveOnlineNoteMethod: (sid: string, payload: { content: string }) => ({
      kind: 'save',
      sid,
      payload
    })
  }
})

import { useOnlineNote } from '../src/features/note/use-online-note'

async function flushState() {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

describe('useOnlineNote', () => {
  beforeEach(() => {
    requestHarness.reset()
  })

  it('falls back to a terminal deleted state when the save endpoint reports NOTE_DELETED', async () => {
    const sid = ref('gone123')
    const note = useOnlineNote(sid)

    expect(requestHarness.getReadArg()).toBe('gone123')

    requestHarness.rejectRead({
      response: {
        data: {
          sid: 'gone123',
          code: 'NOTE_NOT_FOUND',
          status: 'not-found',
          message: '未找到与当前 sid 对应的在线便签。'
        }
      }
    })
    await flushState()

    note.draftContent.value = '准备首次保存的正文。'
    const savePromise = note.saveNote()

    expect(requestHarness.getSaveArg()).toEqual({
      sid: 'gone123',
      content: '准备首次保存的正文。'
    })

    requestHarness.rejectSave({
      response: {
        data: {
          sid: 'gone123',
          code: 'NOTE_DELETED',
          status: 'deleted',
          message: '该在线便签已删除，当前链接不可继续写入。'
        }
      }
    })

    await savePromise
    await flushState()

    expect(note.viewModel.value).toMatchObject({
      status: 'deleted',
      sid: 'gone123',
      title: '该在线便签已删除'
    })
  })

  it('falls back to a terminal error state when the save endpoint reports NOTE_SID_CONFLICT', async () => {
    const sid = ref('conflict123')
    const note = useOnlineNote(sid)

    requestHarness.rejectRead({
      response: {
        data: {
          sid: 'conflict123',
          code: 'NOTE_NOT_FOUND',
          status: 'not-found',
          message: '未找到与当前 sid 对应的在线便签。'
        }
      }
    })
    await flushState()

    note.draftContent.value = '会命中冲突的内容。'
    const savePromise = note.saveNote()

    requestHarness.rejectSave({
      response: {
        data: {
          sid: 'conflict123',
          code: 'NOTE_SID_CONFLICT',
          status: 'error',
          message: '当前 sid 命中了多条记录，无法按唯一对象语义返回结果。'
        }
      }
    })

    await savePromise
    await flushState()

    expect(note.viewModel.value).toMatchObject({
      status: 'error',
      sid: 'conflict123',
      title: '保存当前在线便签失败'
    })
  })

  it('ignores an old save response after the user has switched to another sid', async () => {
    const sid = ref('alpha123')
    const note = useOnlineNote(sid)

    requestHarness.resolveRead({
      sid: 'alpha123',
      content: '旧正文。',
      status: 'available'
    })
    await flushState()

    note.draftContent.value = 'alpha 的新正文。'
    const savePromise = note.saveNote()

    sid.value = 'beta123'
    await flushState()

    expect(requestHarness.getReadArg()).toBe('beta123')

    requestHarness.rejectRead({
      response: {
        data: {
          sid: 'beta123',
          code: 'NOTE_NOT_FOUND',
          status: 'not-found',
          message: '未找到与当前 sid 对应的在线便签。'
        }
      }
    })
    await flushState()

    requestHarness.resolveSave({
      sid: 'alpha123',
      content: 'alpha 的新正文。',
      status: 'available',
      saveResult: 'updated'
    })

    await savePromise
    await flushState()

    expect(note.viewModel.value).toMatchObject({
      status: 'not-found',
      sid: 'beta123'
    })
    expect(note.draftContent.value).toBe('')
  })
})
