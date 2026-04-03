import { useRequest } from 'alova/client'
import { computed, shallowRef, toValue, watch } from 'vue'

import type { MaybeRefOrGetter } from 'vue'

import {
  createGetOnlineNoteDetailMethod,
  createSaveOnlineNoteMethod
} from '@/services/note-methods'

import {
  createOnlineNoteCopyFailureFeedback,
  createOnlineNoteCopySuccessFeedback,
  isOnlineNoteDetailDto,
  isOnlineNoteSaveResponseDto,
  resolveNoteReadErrorDto,
  resolveNoteWriteErrorDto,
  resolveOnlineNoteObjectHeader,
  resolveOnlineNoteSaveFeedback,
  resolveOnlineNoteViewModel,
  type OnlineNoteViewModel,
  type OnlineNoteSaveState
} from './online-note'
import { createOnlineNoteShareLink } from './share-link'

export function useOnlineNote(sid: MaybeRefOrGetter<string | null>) {
  const sidValue = computed(() => toValue(sid))
  const readRequest = useRequest((nextSid: string) => createGetOnlineNoteDetailMethod(nextSid), {
    immediate: false
  })
  const saveRequest = useRequest(
    (payload: { sid: string; content: string }) =>
      createSaveOnlineNoteMethod(payload.sid, {
        content: payload.content
      }),
    {
      immediate: false
    }
  )

  const draftContent = shallowRef('')
  const baselineContent = shallowRef('')
  const initializedSid = shallowRef<string | null>(null)
  const lastSubmittedContent = shallowRef<string | null>(null)
  const saveState = shallowRef<OnlineNoteSaveState>('unsaved')
  const saveErrorMessage = shallowRef<string | null>(null)
  const terminalViewModel = shallowRef<OnlineNoteViewModel | null>(null)
  const copyFeedback = shallowRef<ReturnType<typeof createOnlineNoteCopySuccessFeedback> | null>(null)

  const viewModel = computed(() => {
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

  const hasUnsavedChanges = computed(() => draftContent.value !== baselineContent.value)
  const saveFeedback = computed(() =>
    resolveOnlineNoteSaveFeedback({
      viewStatus: viewModel.value.status,
      saveState: saveState.value,
      hasUnsavedChanges: hasUnsavedChanges.value,
      errorMessage: saveErrorMessage.value
    })
  )
  const objectHeader = computed(() =>
    resolveOnlineNoteObjectHeader({
      sid: sidValue.value,
      viewStatus: viewModel.value.status,
      saveState: saveState.value
    })
  )
  const primaryFeedback = computed(() => copyFeedback.value ?? saveFeedback.value)

  function resetEditorState(nextSid: string | null) {
    draftContent.value = ''
    baselineContent.value = ''
    initializedSid.value = nextSid
    lastSubmittedContent.value = null
    saveState.value = 'unsaved'
    saveErrorMessage.value = null
    terminalViewModel.value = null
    copyFeedback.value = null
  }

  function setTerminalViewModel(nextSid: string, errorMessage: string, status: 'deleted' | 'error') {
    terminalViewModel.value = {
      status,
      sid: nextSid,
      content: null,
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

  async function saveNote() {
    const currentSid = sidValue.value
    const currentViewStatus = viewModel.value.status

    if (!currentSid || (currentViewStatus !== 'available' && currentViewStatus !== 'not-found')) {
      return
    }

    if (saveState.value === 'saving') {
      return
    }

    copyFeedback.value = null
    saveState.value = 'saving'
    saveErrorMessage.value = null
    lastSubmittedContent.value = draftContent.value

    try {
      const response = await saveRequest.send({
        sid: currentSid,
        content: draftContent.value
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
      readRequest.update({
        data: {
          sid: response.sid,
          content: response.content,
          status: 'available'
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
      saveErrorMessage.value = noteWriteError?.message ?? '保存当前在线对象时发生异常，请稍后重试。'

      if (noteWriteError?.code === 'NOTE_DELETED') {
        setTerminalViewModel(currentSid, noteWriteError.message, 'deleted')
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
    [() => draftContent.value, () => baselineContent.value, () => viewModel.value.status],
    ([draft, baseline, currentViewStatus]) => {
      if (saveState.value === 'saving') {
        return
      }

      if (copyFeedback.value && draft !== baseline) {
        copyFeedback.value = null
      }

      if (saveState.value === 'save-error') {
        if (draft !== lastSubmittedContent.value) {
          saveState.value = 'unsaved'
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
    saveFeedback,
    primaryFeedback,
    objectHeader,
    saveNote,
    copyShareLink
  }
}
