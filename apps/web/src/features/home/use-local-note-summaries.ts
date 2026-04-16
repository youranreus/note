import { computed, shallowRef } from 'vue'

import {
  isLocalNoteStorageError,
  resolveLocalNoteStorage,
  type LocalNoteStorageLike,
  type LocalNoteSummary
} from '@/features/local-note/storage/local-note-storage'

interface UseLocalNoteSummariesOptions {
  getStorage?: () => LocalNoteStorageLike | null
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase()
}

function createSummarySearchValue(summary: LocalNoteSummary) {
  return normalizeSearchValue(`${summary.sid} ${summary.excerpt}`)
}

export function useLocalNoteSummaries(options: UseLocalNoteSummariesOptions = {}) {
  const getStorage = options.getStorage ?? resolveLocalNoteStorage

  const searchQuery = shallowRef('')
  const loading = shallowRef(false)
  const hasLoaded = shallowRef(false)
  const storageAvailable = shallowRef(true)
  const errorMessage = shallowRef<string | null>(null)
  const items = shallowRef<LocalNoteSummary[]>([])

  const normalizedSearchQuery = computed(() => normalizeSearchValue(searchQuery.value))
  const filteredItems = computed(() => {
    if (normalizedSearchQuery.value === '') {
      return items.value
    }

    return items.value.filter((summary) =>
      createSummarySearchValue(summary).includes(normalizedSearchQuery.value)
    )
  })

  async function loadSummaries() {
    const storage = getStorage()

    hasLoaded.value = true

    if (!storage) {
      storageAvailable.value = false
      errorMessage.value =
        '当前浏览器环境不支持本地便签存储，无法在首页展示本地便签列表。'
      items.value = []
      return
    }

    loading.value = true
    storageAvailable.value = true
    errorMessage.value = null

    try {
      items.value = await storage.listSummaries()
    } catch (error) {
      items.value = []
      errorMessage.value = isLocalNoteStorageError(error)
        ? error.message
        : '读取本地便签列表失败，请稍后重试。'
    } finally {
      loading.value = false
    }
  }

  function clearSearch() {
    searchQuery.value = ''
  }

  return {
    clearSearch,
    errorMessage,
    filteredItems,
    hasLoaded,
    items,
    loadSummaries,
    loading,
    searchQuery,
    storageAvailable
  }
}
