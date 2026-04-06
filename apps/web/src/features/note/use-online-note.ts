import { useRequest } from 'alova/client'
import { computed, shallowRef, toValue, watch } from 'vue'

import type { MaybeRefOrGetter } from 'vue'
import type { NoteWriteErrorCode, OnlineNoteSaveRequestDto } from '@note/shared-types'

import {
  createGetOnlineNoteDetailMethod,
  createSaveOnlineNoteMethod
} from '@/services/note-methods'

import {
  canEditOnlineNote,
  createOnlineNoteCopyFailureFeedback,
  createOnlineNoteCopySuccessFeedback,
  downgradeOnlineNoteDetailToForbidden,
  isOnlineNoteDetailDto,
  isOnlineNoteSaveResponseDto,
  resolveNoteReadErrorDto,
  resolveNoteWriteErrorDto,
  resolveInteractiveEditAccess,
  resolveOnlineNoteObjectHeader,
  resolveOnlineNoteSaveFeedback,
  resolveOnlineNoteViewModel,
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

  const draftContent = shallowRef('')
  const baselineContent = shallowRef('')
  const editKey = shallowRef('')
  const initializedSid = shallowRef<string | null>(null)
  const lastSubmittedContent = shallowRef<string | null>(null)
  const saveState = shallowRef<OnlineNoteSaveState>('unsaved')
  const saveErrorCode = shallowRef<NoteWriteErrorCode | null>(null)
  const saveErrorMessage = shallowRef<string | null>(null)
  const terminalViewModel = shallowRef<OnlineNoteViewModel | null>(null)
  const copyFeedback = shallowRef<ReturnType<typeof createOnlineNoteCopySuccessFeedback> | null>(null)
  const hasEditKeyValue = computed(() => editKey.value.trim() !== '')

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
      hasUnsavedChanges: hasUnsavedChanges.value,
      errorCode: saveErrorCode.value,
      errorMessage: saveErrorMessage.value
    })
  )
  const objectHeader = computed(() =>
    resolveOnlineNoteObjectHeader({
      sid: sidValue.value,
      viewStatus: viewModel.value.status,
      editAccess: viewModel.value.editAccess,
      saveState: saveState.value
    })
  )
  const primaryFeedback = computed(() => copyFeedback.value ?? saveFeedback.value)
  const authSignature = computed(() => `${authStore.status}:${authStore.user?.id ?? ''}`)

  function resetEditorState(nextSid: string | null) {
    draftContent.value = ''
    baselineContent.value = ''
    editKey.value = ''
    initializedSid.value = nextSid
    lastSubmittedContent.value = null
    saveState.value = 'unsaved'
    saveErrorCode.value = null
    saveErrorMessage.value = null
    terminalViewModel.value = null
    copyFeedback.value = null
  }

  function setTerminalViewModel(nextSid: string, errorMessage: string, status: 'deleted' | 'error') {
    editKey.value = ''
    terminalViewModel.value = {
      status,
      sid: nextSid,
      content: null,
      editAccess: null,
      title: status === 'deleted' ? '该在线便签已删除' : '保存当前在线便签失败',
      description: errorMessage
    }
  }

  function syncDraftFromRemote(nextSid: string) {
    const note = readRequest.data.value

    if (isOnlineNoteDetailDto(note) && note.sid === nextSid) {
      terminalViewModel.value = null
      const shouldReplaceDraft = initializedSid.value !== nextSid || !hasUnsavedChanges.value

      baselineContent.value = note.content
      if (shouldReplaceDraft) {
        draftContent.value = note.content
      }
      initializedSid.value = nextSid
      return
    }

    const noteReadError = resolveNoteReadErrorDto(readRequest.error.value)

    if (noteReadError?.status === 'not-found') {
      terminalViewModel.value = null
      const shouldReplaceDraft = initializedSid.value !== nextSid || !hasUnsavedChanges.value

      baselineContent.value = ''
      if (shouldReplaceDraft) {
        draftContent.value = ''
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
      readRequest.update({
        data: {
          sid: response.sid,
          content: response.content,
          status: 'available',
          editAccess: response.editAccess
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

  async function copyShareLink() {
    const currentHeader = objectHeader.value
    const currentSid = sidValue.value

    if (!currentHeader?.canCopyShareLink || !currentSid) {
      return
    }

    try {
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
    sidValue,
    (nextSid, _previousSid, onCleanup) => {
      void readRequest.abort()
      void saveRequest.abort()
      readRequest.update({
        data: undefined,
        error: undefined
      })
      saveRequest.update({
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
    saveNote,
    copyShareLink
  }
}
