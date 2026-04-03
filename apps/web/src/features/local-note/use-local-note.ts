import { computed, shallowRef, toValue, watch } from 'vue'

import type { MaybeRefOrGetter } from 'vue'

import {
  createLocalNoteRecord,
  readLocalNoteRecord,
  resolveLocalNoteStorage,
  writeLocalNoteRecord,
  type LocalNoteStorageLike
} from './storage/local-note-storage'
import {
  resolveLocalNoteFeedback,
  resolveLocalNoteObjectHeader,
  resolveLocalNoteStorageMessage,
  resolveLocalNoteViewModel,
  type LocalNoteRestorationState,
  type LocalNoteSaveState
} from './local-note'

interface LocalNoteRuntimeOptions {
  getStorage?: () => LocalNoteStorageLike | null
  now?: () => string
}

export function useLocalNote(
  sid: MaybeRefOrGetter<string | null>,
  options: LocalNoteRuntimeOptions = {}
) {
  const sidValue = computed(() => toValue(sid))
  const getStorage = options.getStorage ?? resolveLocalNoteStorage
  const now = options.now ?? (() => new Date().toISOString())

  const draftContent = shallowRef('')
  const baselineContent = shallowRef('')
  const saveState = shallowRef<LocalNoteSaveState>('unsaved')
  const restorationState = shallowRef<LocalNoteRestorationState>('idle')
  const storageAvailable = shallowRef(true)
  const saveErrorMessage = shallowRef<string | null>(null)
  const restoreErrorMessage = shallowRef<string | null>(null)

  const viewModel = computed(() =>
    resolveLocalNoteViewModel({
      sid: sidValue.value,
      storageAvailable: storageAvailable.value
    })
  )
  const hasUnsavedChanges = computed(() => draftContent.value !== baselineContent.value)
  const objectHeader = computed(() =>
    resolveLocalNoteObjectHeader({
      sid: sidValue.value,
      viewStatus: viewModel.value.status,
      saveState: saveState.value,
      restorationState: restorationState.value,
      hasUnsavedChanges: hasUnsavedChanges.value
    })
  )
  const primaryFeedback = computed(() =>
    resolveLocalNoteFeedback({
      viewStatus: viewModel.value.status,
      saveState: saveState.value,
      hasUnsavedChanges: hasUnsavedChanges.value,
      restorationState: restorationState.value,
      saveErrorMessage: saveErrorMessage.value,
      restoreErrorMessage: restoreErrorMessage.value
    })
  )

  function resetEditorState() {
    draftContent.value = ''
    baselineContent.value = ''
    saveState.value = 'unsaved'
    restorationState.value = 'idle'
    storageAvailable.value = true
    saveErrorMessage.value = null
    restoreErrorMessage.value = null
  }

  function loadLocalNote(nextSid: string) {
    const storage = getStorage()

    if (!storage) {
      storageAvailable.value = false
      restoreErrorMessage.value =
        '当前浏览器环境不支持本地便签存储，无法在此模式下保存或恢复内容。'
      return
    }

    try {
      const record = readLocalNoteRecord(storage, nextSid)

      storageAvailable.value = true
      saveErrorMessage.value = null

      if (record) {
        draftContent.value = record.content
        baselineContent.value = record.content
        restorationState.value = 'restored'
        restoreErrorMessage.value = null
        return
      }

      draftContent.value = ''
      baselineContent.value = ''
      restorationState.value = 'empty'
      restoreErrorMessage.value = null
    } catch (error) {
      storageAvailable.value = true
      draftContent.value = ''
      baselineContent.value = ''
      restorationState.value = 'restore-error'
      restoreErrorMessage.value = resolveLocalNoteStorageMessage(error, 'read')
    }
  }

  async function saveNote() {
    const currentSid = sidValue.value

    if (!currentSid || viewModel.value.status !== 'ready') {
      return
    }

    const storage = getStorage()

    if (!storage) {
      storageAvailable.value = false
      saveState.value = 'save-error'
      saveErrorMessage.value = resolveLocalNoteStorageMessage(null, 'access')
      return
    }

    if (saveState.value === 'saving') {
      return
    }

    saveState.value = 'saving'
    saveErrorMessage.value = null

    try {
      const record = writeLocalNoteRecord(
        storage,
        createLocalNoteRecord(currentSid, draftContent.value, now())
      )

      if (sidValue.value !== currentSid) {
        return
      }

      storageAvailable.value = true
      baselineContent.value = record.content
      draftContent.value = record.content
      restorationState.value = 'restored'
      restoreErrorMessage.value = null
      saveState.value = 'saved'
    } catch (error) {
      if (sidValue.value !== currentSid) {
        return
      }

      saveState.value = 'save-error'
      saveErrorMessage.value = resolveLocalNoteStorageMessage(error, 'write')
    }
  }

  watch(
    sidValue,
    (nextSid) => {
      resetEditorState()

      if (!nextSid) {
        return
      }

      loadLocalNote(nextSid)
    },
    {
      immediate: true
    }
  )

  watch(hasUnsavedChanges, (nextHasUnsavedChanges) => {
    if (nextHasUnsavedChanges && saveState.value === 'saved') {
      saveState.value = 'unsaved'
    }
  })

  return {
    viewModel,
    draftContent,
    saveState,
    primaryFeedback,
    objectHeader,
    saveNote
  }
}
