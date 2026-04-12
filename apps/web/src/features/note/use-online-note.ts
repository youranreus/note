import { useRequest } from 'alova/client'
import { computed, shallowRef, toValue, watch } from 'vue'

import type { MaybeRefOrGetter } from 'vue'
import type {
  NoteDeleteErrorCode,
  NoteWriteErrorCode,
  OnlineNoteSaveRequestDto
} from '@note/shared-types'

import { createFavoriteNoteMethod } from '@/services/favorite-methods'
import {
  invalidateMyFavoritesCacheForUser,
  invalidateMyNotesCacheForUser
} from '@/services/me-methods'
import {
  createGetOnlineNoteDetailMethod,
  createDeleteOnlineNoteMethod,
  createSaveOnlineNoteMethod
} from '@/services/note-methods'

import {
  canDeleteOnlineNote,
  canEditOnlineNote,
  createDeletedOnlineNoteViewModel,
  createOnlineNoteCopyFailureFeedback,
  createOnlineNoteCopySuccessFeedback,
  createOnlineNoteFavoriteSuccessFeedback,
  downgradeOnlineNoteDetailToForbidden,
  isFavoriteResponseDto,
  isOnlineNoteDeleteResponseDto,
  isOnlineNoteDetailDto,
  isOnlineNoteSaveResponseDto,
  resolveFavoriteErrorDto,
  resolveNoteDeleteErrorDto,
  resolveNoteReadErrorDto,
  resolveNoteWriteErrorDto,
  resolveInteractiveEditAccess,
  resolveOnlineNoteDeleteFeedback,
  resolveOnlineNoteFavoriteFeedback,
  resolveOnlineNoteObjectHeader,
  resolveOnlineNoteSaveFeedback,
  resolveOnlineNoteViewModel,
  type OnlineNoteSaveFeedback,
  type OnlineNoteViewModel,
  type OnlineNoteSaveState
} from './online-note'
import { createOnlineNoteShareLink } from './share-link'
import { useAuthStore } from '@/stores/auth-store'

export function useOnlineNote(sid: MaybeRefOrGetter<string | null>) {
  const authStore = useAuthStore()
  const sidValue = computed(() => toValue(sid))
  const readRequest = useRequest(
    (nextSid: string) =>
      createGetOnlineNoteDetailMethod(nextSid, {
        editKey: editKey.value.trim() || undefined
      }),
    {
      immediate: false
    }
  )
  const saveRequest = useRequest(
    (payload: {
      sid: string
      content: string
      editKey?: string
      editKeyAction?: 'none' | 'set' | 'use'
    }) =>
      createSaveOnlineNoteMethod(payload.sid, {
        content: payload.content,
        editKey: payload.editKey,
        editKeyAction: payload.editKeyAction
      }),
    {
      immediate: false
    }
  )
  const favoriteRequest = useRequest(
    (payload: { sid: string }) => createFavoriteNoteMethod(payload),
    {
      immediate: false
    }
  )
  const deleteRequest = useRequest(
    (payload: { sid: string; editKey?: string }) =>
      createDeleteOnlineNoteMethod(payload.sid, {
        editKey: payload.editKey
      }),
    {
      immediate: false
    }
  )

  const draftContent = shallowRef('')
  const baselineContent = shallowRef('')
  const editKey = shallowRef('')
  const initializedSid = shallowRef<string | null>(null)
  const lastSubmittedContent = shallowRef<string | null>(null)
  const saveState = shallowRef<OnlineNoteSaveState>('unsaved')
  const saveErrorCode = shallowRef<NoteWriteErrorCode | null>(null)
  const saveErrorMessage = shallowRef<string | null>(null)
  const isDeleteConfirmOpen = shallowRef(false)
  const deleteErrorCode = shallowRef<NoteDeleteErrorCode | null>(null)
  const deleteErrorMessage = shallowRef<string | null>(null)
  const terminalViewModel = shallowRef<OnlineNoteViewModel | null>(null)
  const copyFeedback = shallowRef<OnlineNoteSaveFeedback | null>(null)
  const favoriteFeedback = shallowRef<OnlineNoteSaveFeedback | null>(null)
  const hasEditKeyValue = computed(() => editKey.value.trim() !== '')
  const favoriteActionState = computed(() =>
    favoriteRequest.loading.value ? 'disabled' : 'default'
  )
  const deleteActionState = computed(() =>
    deleteRequest.loading.value ? 'disabled' : 'default'
  )

  const rawViewModel = computed(() => {
    const activeTerminalViewModel = terminalViewModel.value

    if (activeTerminalViewModel && activeTerminalViewModel.sid === sidValue.value) {
      return activeTerminalViewModel
    }

    return resolveOnlineNoteViewModel({
      sid: sidValue.value,
      loading: readRequest.loading.value,
      note: readRequest.data.value,
      error: readRequest.error.value
    })
  })
  const viewModel = computed(() => {
    const activeViewModel = rawViewModel.value

    if (activeViewModel.status !== 'available') {
      return activeViewModel
    }

    const effectiveEditAccess = resolveInteractiveEditAccess(
      activeViewModel.editAccess,
      hasEditKeyValue.value
    )

    if (effectiveEditAccess === activeViewModel.editAccess) {
      return activeViewModel
    }

    return {
      ...activeViewModel,
      editAccess: effectiveEditAccess,
      description:
        effectiveEditAccess === 'key-required'
          ? '当前对象可以正常查看，但需要输入编辑密钥后才能继续保存更新。'
          : activeViewModel.description
    }
  })

  const hasUnsavedChanges = computed(() => draftContent.value !== baselineContent.value)
  const saveFeedback = computed(() =>
    resolveOnlineNoteSaveFeedback({
      viewStatus: viewModel.value.status,
      editAccess: viewModel.value.editAccess,
      saveState: saveState.value,
      errorCode: saveErrorCode.value,
      errorMessage: saveErrorMessage.value
    })
  )
  const deleteFeedback = computed(() => {
    if (!deleteErrorCode.value && !deleteErrorMessage.value) {
      return null
    }

    return resolveOnlineNoteDeleteFeedback(deleteErrorCode.value, deleteErrorMessage.value)
  })
  const objectHeader = computed(() =>
    resolveOnlineNoteObjectHeader({
      sid: sidValue.value,
      viewStatus: viewModel.value.status,
      editAccess: viewModel.value.editAccess,
      favoriteState: viewModel.value.favoriteState,
      authStatus: authStore.status,
      saveState: saveState.value,
      favoriteActionState: favoriteActionState.value,
      deleteActionState: deleteActionState.value
    })
  )
  const primaryFeedback = computed(
    () => deleteFeedback.value ?? favoriteFeedback.value ?? copyFeedback.value ?? saveFeedback.value
  )
  const authSignature = computed(() => `${authStore.status}:${authStore.user?.id ?? ''}`)

  function resolveCurrentReadableNote(currentSid: string) {
    if (
      readRequest.loading.value ||
      viewModel.value.status !== 'available' ||
      viewModel.value.sid !== currentSid
    ) {
      return null
    }

    const currentNote = readRequest.data.value

    if (isOnlineNoteDetailDto(currentNote) && currentNote.sid === currentSid) {
      return currentNote
    }

    return null
  }

  function clearDeleteFeedback() {
    deleteErrorCode.value = null
    deleteErrorMessage.value = null
  }

  function resetEditorState(nextSid: string | null) {
    draftContent.value = ''
    baselineContent.value = ''
    editKey.value = ''
    initializedSid.value = nextSid
    lastSubmittedContent.value = null
    saveState.value = 'unsaved'
    saveErrorCode.value = null
    saveErrorMessage.value = null
    isDeleteConfirmOpen.value = false
    clearDeleteFeedback()
    terminalViewModel.value = null
    copyFeedback.value = null
    favoriteFeedback.value = null
  }

  function applyDeletedTerminalState(nextSid: string, errorMessage: string) {
    readRequest.update({
      data: undefined
    })
    draftContent.value = ''
    baselineContent.value = ''
    editKey.value = ''
    initializedSid.value = nextSid
    lastSubmittedContent.value = null
    saveState.value = 'unsaved'
    saveErrorCode.value = null
    saveErrorMessage.value = null
    isDeleteConfirmOpen.value = false
    clearDeleteFeedback()
    copyFeedback.value = null
    favoriteFeedback.value = null
    terminalViewModel.value = createDeletedOnlineNoteViewModel(nextSid, errorMessage)
  }

  function setTerminalViewModel(
    nextSid: string,
    errorMessage: string,
    status: 'deleted' | 'error',
    titleOverride?: string
  ) {
    if (status === 'deleted') {
      applyDeletedTerminalState(nextSid, errorMessage)
      return
    }

    editKey.value = ''
    terminalViewModel.value = {
      status,
      sid: nextSid,
      content: null,
      editAccess: null,
      favoriteState: null,
      title: titleOverride ?? '保存当前在线便签失败',
      description: errorMessage
    }
  }

  function syncDraftFromRemote(nextSid: string) {
    const noteReadError = resolveNoteReadErrorDto(readRequest.error.value)

    if (noteReadError?.status === 'deleted') {
      applyDeletedTerminalState(nextSid, noteReadError.message)
      return
    }

    if (noteReadError?.status === 'not-found') {
      readRequest.update({
        data: undefined
      })
      terminalViewModel.value = null
      const shouldReplaceDraft = initializedSid.value !== nextSid || !hasUnsavedChanges.value

      baselineContent.value = ''
      if (shouldReplaceDraft) {
        draftContent.value = ''
      }
      initializedSid.value = nextSid
      return
    }

    const note = readRequest.data.value

    if (isOnlineNoteDetailDto(note) && note.sid === nextSid) {
      terminalViewModel.value = null
      const shouldReplaceDraft = initializedSid.value !== nextSid || !hasUnsavedChanges.value

      baselineContent.value = note.content
      if (shouldReplaceDraft) {
        draftContent.value = note.content
      }
      initializedSid.value = nextSid
    }
  }

  function createSavePayload(
    currentViewStatus: 'available' | 'not-found'
  ): OnlineNoteSaveRequestDto {
    const normalizedEditKey = editKey.value.trim()

    if (normalizedEditKey === '') {
      return {
        content: draftContent.value
      }
    }

    if (currentViewStatus === 'not-found') {
      return {
        content: draftContent.value,
        editKey: normalizedEditKey,
        editKeyAction: 'set'
      }
    }

    if (
      viewModel.value.editAccess === 'key-required' ||
      viewModel.value.editAccess === 'key-editable'
    ) {
      return {
        content: draftContent.value,
        editKey: normalizedEditKey,
        editKeyAction: 'use'
      }
    }

    return {
      content: draftContent.value,
      editKey: normalizedEditKey,
      editKeyAction: 'set'
    }
  }

  function openDeleteConfirm() {
    if (
      viewModel.value.status !== 'available' ||
      !canDeleteOnlineNote(viewModel.value.editAccess) ||
      deleteRequest.loading.value
    ) {
      return
    }

    clearDeleteFeedback()
    copyFeedback.value = null
    favoriteFeedback.value = null
    isDeleteConfirmOpen.value = true
  }

  function closeDeleteConfirm() {
    if (deleteRequest.loading.value) {
      return
    }

    isDeleteConfirmOpen.value = false
  }

  async function saveNote() {
    const currentSid = sidValue.value
    const currentViewStatus = viewModel.value.status

    if (!currentSid || (currentViewStatus !== 'available' && currentViewStatus !== 'not-found')) {
      return
    }

    if (currentViewStatus === 'available' && !canEditOnlineNote(viewModel.value.editAccess)) {
      return
    }

    if (saveState.value === 'saving') {
      return
    }

    clearDeleteFeedback()
    copyFeedback.value = null
    saveState.value = 'saving'
    saveErrorCode.value = null
    saveErrorMessage.value = null
    lastSubmittedContent.value = draftContent.value
    const payload = createSavePayload(currentViewStatus)

    try {
      const response = await saveRequest.send({
        sid: currentSid,
        ...payload
      })

      if (sidValue.value !== currentSid) {
        return
      }

      if (!isOnlineNoteSaveResponseDto(response) || response.sid !== currentSid) {
        saveState.value = 'save-error'
        saveErrorMessage.value = '当前在线对象返回了无法识别的保存结果，请稍后重试。'
        return
      }

      terminalViewModel.value = null
      baselineContent.value = response.content
      draftContent.value = response.content
      initializedSid.value = currentSid
      saveState.value = 'saved'
      saveErrorCode.value = null

      if (authStore.status === 'authenticated') {
        invalidateMyNotesCacheForUser(authStore.user?.id)
      }

      readRequest.update({
        data: {
          sid: response.sid,
          content: response.content,
          status: 'available',
          editAccess: response.editAccess,
          favoriteState: response.favoriteState
        },
        error: undefined
      })
      saveRequest.update({
        data: response,
        error: undefined
      })
    } catch (error) {
      if (sidValue.value !== currentSid) {
        return
      }

      const noteWriteError = resolveNoteWriteErrorDto(error)

      saveState.value = 'save-error'
      saveErrorCode.value = noteWriteError?.code ?? null
      saveErrorMessage.value = noteWriteError?.message ?? '保存当前在线对象时发生异常，请稍后重试。'

      if (noteWriteError?.code === 'NOTE_DELETED') {
        setTerminalViewModel(currentSid, noteWriteError.message, 'deleted')
        return
      }

      if (noteWriteError?.code === 'NOTE_FORBIDDEN') {
        const forbiddenNote = downgradeOnlineNoteDetailToForbidden(
          readRequest.data.value,
          currentSid
        )

        if (forbiddenNote) {
          readRequest.update({
            data: forbiddenNote,
            error: undefined
          })
        }

        return
      }

      if (noteWriteError?.code === 'NOTE_SID_CONFLICT') {
        setTerminalViewModel(currentSid, noteWriteError.message, 'error')
      }
    }
  }

  async function confirmDelete() {
    const currentSid = sidValue.value

    if (
      !currentSid ||
      viewModel.value.status !== 'available' ||
      !canDeleteOnlineNote(viewModel.value.editAccess) ||
      deleteRequest.loading.value
    ) {
      return
    }

    clearDeleteFeedback()
    copyFeedback.value = null
    favoriteFeedback.value = null

    try {
      const response = await deleteRequest.send({
        sid: currentSid,
        editKey: editKey.value.trim() || undefined
      })

      if (sidValue.value !== currentSid) {
        return
      }

      if (!isOnlineNoteDeleteResponseDto(response) || response.sid !== currentSid) {
        isDeleteConfirmOpen.value = false
        deleteErrorMessage.value = '当前在线对象返回了无法识别的删除结果，请稍后重试。'
        return
      }

      isDeleteConfirmOpen.value = false
      editKey.value = ''
      baselineContent.value = ''
      draftContent.value = ''
      saveState.value = 'unsaved'
      saveErrorCode.value = null
      saveErrorMessage.value = null
      lastSubmittedContent.value = null
      setTerminalViewModel(currentSid, response.message, 'deleted')

      if (authStore.status === 'authenticated') {
        invalidateMyNotesCacheForUser(authStore.user?.id)
        invalidateMyFavoritesCacheForUser(authStore.user?.id)
      }

      deleteRequest.update({
        data: response,
        error: undefined
      })
    } catch (error) {
      if (sidValue.value !== currentSid) {
        return
      }

      const noteDeleteError = resolveNoteDeleteErrorDto(error)

      isDeleteConfirmOpen.value = false
      deleteErrorCode.value = noteDeleteError?.code ?? null
      deleteErrorMessage.value = noteDeleteError?.message ?? '删除当前在线对象时发生异常，请稍后重试。'

      if (noteDeleteError?.code === 'NOTE_DELETED') {
        setTerminalViewModel(currentSid, noteDeleteError.message, 'deleted')
        return
      }

      if (noteDeleteError?.code === 'NOTE_SID_CONFLICT') {
        setTerminalViewModel(currentSid, noteDeleteError.message, 'error', '删除当前在线便签失败')
      }
    }
  }

  async function favoriteNote() {
    const currentSid = sidValue.value
    const currentNote = currentSid ? resolveCurrentReadableNote(currentSid) : null

    if (!currentSid || !currentNote || currentNote.favoriteState === 'self-owned') {
      return
    }

    if (currentNote.favoriteState === 'favorited' || favoriteRequest.loading.value) {
      return
    }

    if (authStore.status !== 'authenticated') {
      authStore.openLoginModal({
        type: 'favorite-note',
        sid: currentSid
      })
      return
    }

    clearDeleteFeedback()
    copyFeedback.value = null

    try {
      const response = await favoriteRequest.send({
        sid: currentSid
      })

      if (sidValue.value !== currentSid || !isFavoriteResponseDto(response)) {
        return
      }

      favoriteFeedback.value = createOnlineNoteFavoriteSuccessFeedback()

      if (authStore.status === 'authenticated') {
        invalidateMyFavoritesCacheForUser(authStore.user?.id)
      }

      const latestNote = resolveCurrentReadableNote(currentSid)

      if (latestNote) {
        readRequest.update({
          data: {
            ...latestNote,
            favoriteState: response.favoriteState
          },
          error: undefined
        })
      }
    } catch (error) {
      if (sidValue.value !== currentSid) {
        return
      }

      const favoriteError = resolveFavoriteErrorDto(error)

      if (favoriteError?.code === 'FAVORITE_AUTH_REQUIRED') {
        authStore.openLoginModal({
          type: 'favorite-note',
          sid: currentSid
        })
        return
      }

      favoriteFeedback.value = resolveOnlineNoteFavoriteFeedback(error)
    }
  }

  async function copyShareLink() {
    const currentHeader = objectHeader.value
    const currentSid = sidValue.value

    if (!currentHeader?.canCopyShareLink || !currentSid) {
      return
    }

    try {
      clearDeleteFeedback()
      const clipboard = navigator.clipboard

      if (!clipboard?.writeText) {
        throw new Error('clipboard unavailable')
      }

      await clipboard.writeText(createOnlineNoteShareLink(currentSid))

      if (sidValue.value !== currentSid) {
        return
      }

      copyFeedback.value = createOnlineNoteCopySuccessFeedback()
    } catch {
      if (sidValue.value !== currentSid) {
        return
      }

      copyFeedback.value = createOnlineNoteCopyFailureFeedback()
    }
  }

  watch(
    () => editKey.value,
    (nextEditKey, previousEditKey) => {
      if (
        nextEditKey !== previousEditKey &&
        (deleteErrorCode.value === 'NOTE_EDIT_KEY_REQUIRED' ||
          deleteErrorCode.value === 'NOTE_EDIT_KEY_INVALID')
      ) {
        clearDeleteFeedback()
      }
    }
  )

  watch(
    sidValue,
    (nextSid, _previousSid, onCleanup) => {
      void readRequest.abort()
      void saveRequest.abort()
      void favoriteRequest.abort()
      void deleteRequest.abort()
      readRequest.update({
        data: undefined,
        error: undefined
      })
      saveRequest.update({
        data: undefined,
        error: undefined
      })
      favoriteRequest.update({
        data: undefined,
        error: undefined
      })
      deleteRequest.update({
        data: undefined,
        error: undefined
      })
      resetEditorState(nextSid)

      if (!nextSid) {
        return
      }

      void readRequest.send(nextSid).catch(() => undefined)
      onCleanup(() => {
        void readRequest.abort()
        void saveRequest.abort()
        void favoriteRequest.abort()
        void deleteRequest.abort()
      })
    },
    {
      immediate: true
    }
  )

  watch(authSignature, () => {
    const currentSid = sidValue.value

    if (!currentSid) {
      return
    }

    void readRequest.abort()
    void readRequest.send(currentSid).catch(() => undefined)
  })

  watch(
    [
      sidValue,
      () => authStore.status,
      () => authStore.pendingPostLoginAction,
      () => readRequest.loading.value,
      () => viewModel.value.status,
      () => viewModel.value.sid,
      () => viewModel.value.favoriteState,
      () => favoriteRequest.loading.value
    ],
    ([currentSid, authStatus, pendingAction, readLoading, viewStatus, viewSid, _favoriteState, favoriteLoading]) => {
      const readableNote =
        !readLoading && viewStatus === 'available' && viewSid === currentSid && currentSid
          ? resolveCurrentReadableNote(currentSid)
          : null

      if (
        !currentSid ||
        authStatus !== 'authenticated' ||
        !pendingAction ||
        pendingAction.type !== 'favorite-note' ||
        pendingAction.sid !== currentSid ||
        !readableNote ||
        readableNote.favoriteState === 'favorited' ||
        readableNote.favoriteState === 'self-owned' ||
        favoriteLoading
      ) {
        return
      }

      authStore.clearPendingPostLoginAction()
      void favoriteNote()
    },
    {
      immediate: true
    }
  )

  watch(
    [sidValue, () => readRequest.loading.value, () => readRequest.data.value, () => readRequest.error.value],
    ([currentSid, loading]) => {
      if (!currentSid || loading) {
        return
      }

      syncDraftFromRemote(currentSid)
    },
    {
      immediate: true
    }
  )

  watch(
    [
      () => draftContent.value,
      () => baselineContent.value,
      () => viewModel.value.status,
      () => editKey.value
    ],
    ([draft, baseline, currentViewStatus]) => {
      if (saveState.value === 'saving') {
        return
      }

      if (copyFeedback.value && draft !== baseline) {
        copyFeedback.value = null
      }

      if (saveState.value === 'save-error') {
        if (
          saveErrorCode.value === 'NOTE_EDIT_KEY_REQUIRED' ||
          saveErrorCode.value === 'NOTE_EDIT_KEY_INVALID' ||
          saveErrorCode.value === 'NOTE_EDIT_KEY_ACTION_INVALID'
        ) {
          saveState.value = 'unsaved'
          saveErrorCode.value = null
          saveErrorMessage.value = null
          return
        }

        if (draft !== lastSubmittedContent.value) {
          saveState.value = 'unsaved'
          saveErrorCode.value = null
          saveErrorMessage.value = null
        }
        return
      }

      if (currentViewStatus === 'not-found') {
        saveState.value = 'unsaved'
        return
      }

      if (currentViewStatus !== 'available') {
        return
      }

      saveState.value = draft === baseline ? 'saved' : 'unsaved'
    },
    {
      immediate: true
    }
  )

  return {
    ...readRequest,
    viewModel,
    draftContent,
    hasUnsavedChanges,
    saveState,
    editKey,
    saveFeedback,
    primaryFeedback,
    objectHeader,
    isDeleteConfirmOpen,
    saveNote,
    copyShareLink,
    favoriteNote,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete
  }
}
