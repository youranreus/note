// @vitest-environment jsdom

import { nextTick, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
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
  let favoriteController: RequestController | null = null

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

  function getController(kind: 'read' | 'save' | 'favorite') {
    const controller =
      kind === 'read' ? readController : kind === 'save' ? saveController : favoriteController

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
      favoriteController = null
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
        } else if (invocation === 1) {
          saveController = controller
        } else {
          favoriteController = controller
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
    },
    resolveFavorite(value: unknown) {
      const controller = getController('favorite')
      controller.loading.value = false
      controller.data.value = value
      controller.error.value = undefined
      controller.pending?.resolve(value)
      controller.pending = null
    },
    rejectFavorite(reason: unknown) {
      const controller = getController('favorite')
      controller.loading.value = false
      controller.error.value = reason
      controller.pending?.reject(reason)
      controller.pending = null
    },
    getFavoriteArg() {
      return getController('favorite').lastArg
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
    createSaveOnlineNoteMethod: (sid: string, payload: Record<string, unknown>) => ({
      kind: 'save',
      sid,
      payload
    })
  }
})

vi.mock('../src/services/favorite-methods', () => {
  return {
    createFavoriteNoteMethod: (payload: Record<string, unknown>) => ({
      kind: 'favorite',
      payload
    })
  }
})

import { useOnlineNote } from '../src/features/note/use-online-note'
import { useAuthStore } from '../src/stores/auth-store'

async function flushState() {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

describe('useOnlineNote', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    requestHarness.reset()
    vi.restoreAllMocks()
  })

  it('ignores stale copy feedback after the user has switched to another sid', async () => {
    const sid = ref('note-a')
    const note = useOnlineNote(sid)
    const writeTextDeferred = (() => {
      let resolve!: () => void
      const promise = new Promise<void>((nextResolve) => {
        resolve = nextResolve
      })

      return {
        promise,
        resolve
      }
    })()

    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn(() => writeTextDeferred.promise)
      }
    })

    requestHarness.resolveRead({
      sid: 'note-a',
      status: 'available',
      content: 'note a',
      editAccess: 'anonymous-editable',
      favoriteState: 'not-favorited'
    })
    await flushState()

    const copyPromise = note.copyShareLink()

    sid.value = 'note-b'
    await flushState()

    requestHarness.resolveRead({
      sid: 'note-b',
      status: 'available',
      content: 'note b',
      editAccess: 'anonymous-editable',
      favoriteState: 'not-favorited'
    })
    await flushState()

    writeTextDeferred.resolve()
    await copyPromise
    await flushState()

    expect(note.primaryFeedback.value?.title).not.toBe('已复制当前在线便签链接')
    expect(note.primaryFeedback.value?.title).toBe('已保存')
    expect(note.objectHeader.value).toMatchObject({
      sid: 'note-b'
    })
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

    note.editKey.value = 'shared-secret'
    note.draftContent.value = '准备首次保存的正文。'
    const savePromise = note.saveNote()

    expect(requestHarness.getSaveArg()).toEqual({
      sid: 'gone123',
      content: '准备首次保存的正文。',
      editKey: 'shared-secret',
      editKeyAction: 'set'
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
    expect(note.editKey.value).toBe('')
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
      status: 'available',
      editAccess: 'anonymous-editable'
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
      editAccess: 'anonymous-editable',
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

  it('copies the stable online note link and exposes a success feedback message', async () => {
    window.history.replaceState({}, '', '/note/o/share123')
    const clipboardWriteText = vi.fn(async () => undefined)
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: clipboardWriteText
      }
    })

    const sid = ref('share123')
    const note = useOnlineNote(sid) as ReturnType<typeof useOnlineNote> & {
      copyShareLink: () => Promise<void>
      primaryFeedback: { value: { title: string; description: string } | null }
      objectHeader: {
        value: {
          shareStatusLabel: string
          canCopyShareLink: boolean
        } | null
      }
    }

    requestHarness.resolveRead({
      sid: 'share123',
      content: '已保存内容',
      status: 'available',
      editAccess: 'anonymous-editable'
    })
    await flushState()

    await note.copyShareLink()
    await flushState()

    expect(clipboardWriteText).toHaveBeenCalledWith(`${window.location.origin}/note/o/share123`)
    expect(note.objectHeader.value).toMatchObject({
      shareStatusLabel: '可分享',
      canCopyShareLink: true
    })
    expect(note.primaryFeedback.value?.title).toBe('已复制当前在线便签链接')
  })

  it('surfaces a clear failure feedback when the clipboard API rejects the copy action', async () => {
    window.history.replaceState({}, '', '/note/o/share123')
    const clipboardWriteText = vi.fn(async () => {
      throw new Error('clipboard denied')
    })
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: clipboardWriteText
      }
    })

    const sid = ref('share123')
    const note = useOnlineNote(sid) as ReturnType<typeof useOnlineNote> & {
      copyShareLink: () => Promise<void>
      primaryFeedback: { value: { title: string; description: string; tone: string } | null }
    }

    requestHarness.resolveRead({
      sid: 'share123',
      content: '已保存内容',
      status: 'available',
      editAccess: 'anonymous-editable'
    })
    await flushState()

    await note.copyShareLink()
    await flushState()

    expect(clipboardWriteText).toHaveBeenCalledWith(`${window.location.origin}/note/o/share123`)
    expect(note.primaryFeedback.value).toMatchObject({
      tone: 'danger',
      title: '复制当前在线便签链接失败'
    })
  })

  it('keeps owner-bound notes readable but prevents save requests for non-owner sessions', async () => {
    const sid = ref('owner123')
    const note = useOnlineNote(sid)

    requestHarness.resolveRead({
      sid: 'owner123',
      content: '创建者正文。',
      status: 'available',
      editAccess: 'forbidden'
    })
    await flushState()

    note.draftContent.value = '用户试图修改的草稿。'
    await note.saveNote()
    await flushState()

    expect(requestHarness.getSaveArg()).toBeUndefined()
    expect(note.objectHeader.value).toMatchObject({
      editStatusLabel: '当前账户不可编辑',
      editStatusTone: 'danger'
    })
    expect(note.primaryFeedback.value).toMatchObject({
      tone: 'warning',
      title: '当前账户只能查看'
    })
  })

  it('downgrades an owner session to read-only when the save endpoint returns NOTE_FORBIDDEN', async () => {
    const sid = ref('owner123')
    const note = useOnlineNote(sid)

    requestHarness.resolveRead({
      sid: 'owner123',
      content: '创建者正文。',
      status: 'available',
      editAccess: 'owner-editable'
    })
    await flushState()

    note.draftContent.value = '会话失效后的本地草稿。'
    const savePromise = note.saveNote()

    expect(requestHarness.getSaveArg()).toEqual({
      sid: 'owner123',
      content: '会话失效后的本地草稿。'
    })

    requestHarness.rejectSave({
      response: {
        data: {
          sid: 'owner123',
          code: 'NOTE_FORBIDDEN',
          status: 'forbidden',
          message: '当前账户没有权限更新该在线便签。'
        }
      }
    })

    await savePromise
    await flushState()

    expect(note.viewModel.value).toMatchObject({
      status: 'available',
      sid: 'owner123',
      editAccess: 'forbidden',
      content: '创建者正文。'
    })
    expect(note.draftContent.value).toBe('会话失效后的本地草稿。')
    expect(note.objectHeader.value).toMatchObject({
      editStatusLabel: '当前账户不可编辑',
      editStatusTone: 'danger'
    })
    expect(note.primaryFeedback.value).toMatchObject({
      tone: 'warning',
      title: '当前账户只能查看',
      description: '当前账户没有权限更新该在线便签。'
    })
  })

  it('re-reads the current note when auth state changes so authorization can refresh in place', async () => {
    const sid = ref('owner123')
    const note = useOnlineNote(sid)
    const authStore = useAuthStore()

    requestHarness.resolveRead({
      sid: 'owner123',
      content: '创建者正文。',
      status: 'available',
      editAccess: 'forbidden'
    })
    await flushState()

    authStore.setAuthenticated({
      status: 'authenticated',
      user: {
        id: '1001',
        displayName: 'Owner'
      }
    })
    await flushState()

    expect(requestHarness.getReadArg()).toBe('owner123')

    requestHarness.resolveRead({
      sid: 'owner123',
      content: '创建者正文。',
      status: 'available',
      editAccess: 'owner-editable'
    })
    await flushState()

    expect(note.viewModel.value).toMatchObject({
      status: 'available',
      sid: 'owner123',
      editAccess: 'owner-editable'
    })
  })

  it('sends edit key payload when a new note is first saved in shared-edit mode', async () => {
    const sid = ref('shared123')
    const note = useOnlineNote(sid)

    requestHarness.rejectRead({
      response: {
        data: {
          sid: 'shared123',
          code: 'NOTE_NOT_FOUND',
          status: 'not-found',
          message: '未找到与当前 sid 对应的在线便签。'
        }
      }
    })
    await flushState()

    note.draftContent.value = '带密钥的正文。'
    note.editKey.value = 'shared-secret'

    const savePromise = note.saveNote()

    expect(requestHarness.getSaveArg()).toEqual({
      sid: 'shared123',
      content: '带密钥的正文。',
      editKey: 'shared-secret',
      editKeyAction: 'set'
    })

    requestHarness.resolveSave({
      sid: 'shared123',
      content: '带密钥的正文。',
      status: 'available',
      editAccess: 'key-editable',
      saveResult: 'created'
    })

    await savePromise
    await flushState()

    expect(note.viewModel.value).toMatchObject({
      status: 'available',
      sid: 'shared123',
      editAccess: 'key-editable'
    })
  })

  it('keeps edit key in memory for keyed saves and clears it after sid switches', async () => {
    const sid = ref('shared123')
    const note = useOnlineNote(sid)

    requestHarness.resolveRead({
      sid: 'shared123',
      content: '需要密钥的正文。',
      status: 'available',
      editAccess: 'key-required'
    })
    await flushState()

    note.editKey.value = 'shared-secret'
    note.draftContent.value = '更新后的正文。'
    const savePromise = note.saveNote()

    expect(requestHarness.getSaveArg()).toEqual({
      sid: 'shared123',
      content: '更新后的正文。',
      editKey: 'shared-secret',
      editKeyAction: 'use'
    })

    requestHarness.resolveSave({
      sid: 'shared123',
      content: '更新后的正文。',
      status: 'available',
      editAccess: 'key-editable',
      saveResult: 'updated'
    })

    await savePromise
    await flushState()

    expect(note.editKey.value).toBe('shared-secret')

    sid.value = 'other123'
    await flushState()

    expect(note.editKey.value).toBe('')
  })

  it('only treats key-editable as active while the current page still holds the key', async () => {
    const sid = ref('shared123')
    const note = useOnlineNote(sid)

    requestHarness.resolveRead({
      sid: 'shared123',
      content: '需要密钥的正文。',
      status: 'available',
      editAccess: 'key-editable'
    })
    await flushState()

    expect(note.viewModel.value.editAccess).toBe('key-required')

    note.editKey.value = 'shared-secret'
    await flushState()

    expect(note.viewModel.value.editAccess).toBe('key-editable')

    note.editKey.value = ''
    await flushState()

    expect(note.viewModel.value.editAccess).toBe('key-required')
  })

  it('surfaces distinct feedback when a keyed note is missing an edit key', async () => {
    const sid = ref('shared123')
    const note = useOnlineNote(sid)

    requestHarness.resolveRead({
      sid: 'shared123',
      content: '需要密钥的正文。',
      status: 'available',
      editAccess: 'key-required'
    })
    await flushState()

    note.draftContent.value = '用户草稿。'
    const savePromise = note.saveNote()

    requestHarness.rejectSave({
      response: {
        data: {
          sid: 'shared123',
          code: 'NOTE_EDIT_KEY_REQUIRED',
          status: 'forbidden',
          message: '当前对象需要输入编辑密钥后才能保存更新。'
        }
      }
    })

    await savePromise
    await flushState()

    expect(note.primaryFeedback.value).toMatchObject({
      tone: 'warning',
      title: '需要编辑密钥',
      description: '当前对象需要输入编辑密钥后才能保存更新。'
    })
    expect(note.draftContent.value).toBe('用户草稿。')
  })

  it('surfaces distinct feedback when the entered edit key is invalid', async () => {
    const sid = ref('shared123')
    const note = useOnlineNote(sid)

    requestHarness.resolveRead({
      sid: 'shared123',
      content: '需要密钥的正文。',
      status: 'available',
      editAccess: 'key-required'
    })
    await flushState()

    note.editKey.value = 'wrong-secret'
    note.draftContent.value = '用户草稿。'
    const savePromise = note.saveNote()

    requestHarness.rejectSave({
      response: {
        data: {
          sid: 'shared123',
          code: 'NOTE_EDIT_KEY_INVALID',
          status: 'forbidden',
          message: '当前编辑密钥不正确，请确认后重试。'
        }
      }
    })

    await savePromise
    await flushState()

    expect(note.primaryFeedback.value).toMatchObject({
      tone: 'danger',
      title: '编辑密钥不正确',
      description: '当前编辑密钥不正确，请确认后重试。'
    })
    expect(note.editKey.value).toBe('wrong-secret')
    expect(note.draftContent.value).toBe('用户草稿。')
  })

  it('clears stale key-related save errors as soon as the user changes the edit key', async () => {
    const sid = ref('shared123')
    const note = useOnlineNote(sid)

    requestHarness.resolveRead({
      sid: 'shared123',
      content: '需要密钥的正文。',
      status: 'available',
      editAccess: 'key-required'
    })
    await flushState()

    note.editKey.value = 'wrong-secret'
    note.draftContent.value = '用户草稿。'
    const savePromise = note.saveNote()

    requestHarness.rejectSave({
      response: {
        data: {
          sid: 'shared123',
          code: 'NOTE_EDIT_KEY_INVALID',
          status: 'forbidden',
          message: '当前编辑密钥不正确，请确认后重试。'
        }
      }
    })

    await savePromise
    await flushState()

    expect(note.saveState.value).toBe('save-error')

    note.editKey.value = 'shared-secret'
    await flushState()

    expect(note.saveState.value).toBe('unsaved')
    expect(note.primaryFeedback.value).toMatchObject({
      tone: 'warning',
      title: '需要编辑密钥'
    })
  })

  it('opens the existing login modal instead of firing a favorite request for anonymous users', async () => {
    const sid = ref('shared123')
    const note = useOnlineNote(sid)
    const authStore = useAuthStore()

    requestHarness.resolveRead({
      sid: 'shared123',
      content: '可收藏的正文。',
      status: 'available',
      editAccess: 'forbidden',
      favoriteState: 'not-favorited'
    })
    await flushState()

    await note.favoriteNote()
    await flushState()

    expect(authStore.loginModalOpen).toBe(true)
    expect(requestHarness.getFavoriteArg()).toBeUndefined()
  })

  it('resumes a pending favorite intent once after login and updates the current note state to favorited', async () => {
    const sid = ref('shared123')
    const note = useOnlineNote(sid)
    const authStore = useAuthStore()

    requestHarness.resolveRead({
      sid: 'shared123',
      content: '可收藏的正文。',
      status: 'available',
      editAccess: 'forbidden',
      favoriteState: 'not-favorited'
    })
    await flushState()

    authStore.setAuthenticated(
      {
        status: 'authenticated',
        user: {
          id: '1001',
          displayName: 'Receiver'
        }
      },
      {
        type: 'favorite-note',
        sid: 'shared123'
      }
    )
    await flushState()

    expect(requestHarness.getFavoriteArg()).toEqual({
      sid: 'shared123'
    })

    requestHarness.resolveFavorite({
      sid: 'shared123',
      favoriteState: 'favorited'
    })
    await flushState()

    expect(note.viewModel.value).toMatchObject({
      sid: 'shared123',
      favoriteState: 'favorited'
    })
    expect(note.primaryFeedback.value?.title).toBe('已收藏当前在线便签')
  })
})
