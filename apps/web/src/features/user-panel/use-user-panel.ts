import { useRequest } from 'alova/client'
import { storeToRefs } from 'pinia'
import { computed, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'

import type {
  MyNoteSummaryDto,
  MyNotesQueryDto,
  UserPanelTab
} from '@note/shared-types'

import { createGetMyNotesMethod } from '@/services/me-methods'
import { useAuthStore } from '@/stores/auth-store'

import {
  isMyNotesResponseDto,
  isUnauthorizedUserPanelError,
  resolveUserPanelErrorMessage
} from './user-panel'

const defaultMyNotesQuery = {
  page: 1,
  limit: 20
} satisfies Required<MyNotesQueryDto>

interface LoadCreatedNotesPayload {
  query?: MyNotesQueryDto
  cacheScope: string
}

type CreatedFetchMode = 'replace' | 'append'

export function useUserPanel() {
  const router = useRouter()
  const authStore = useAuthStore()
  const { status, user } = storeToRefs(authStore)
  const userCenterOpen = shallowRef(false)
  const activeTab = shallowRef<UserPanelTab>('created')
  const createdItems = shallowRef<MyNoteSummaryDto[]>([])
  const createdPage = shallowRef(defaultMyNotesQuery.page)
  const createdTotal = shallowRef(0)
  const createdHasMore = shallowRef(false)
  const createdLoadingMode = shallowRef<CreatedFetchMode | null>(null)
  const createdErrorMessage = shallowRef('')
  const createdRequestToken = shallowRef(0)
  const createdCacheScope = computed(() =>
    status.value === 'authenticated' && user.value?.id
      ? `user:${user.value.id}`
      : status.value
  )
  const createdRequest = useRequest(
    ({ query = defaultMyNotesQuery, cacheScope }: LoadCreatedNotesPayload) =>
      createGetMyNotesMethod(query, cacheScope),
    {
      immediate: false
    }
  )

  const createdNotes = computed(() => createdItems.value)
  const createdLoading = computed(() =>
    createdRequest.loading.value &&
    createdLoadingMode.value === 'replace' &&
    createdNotes.value.length === 0
  )
  const createdLoadingMore = computed(() =>
    createdRequest.loading.value &&
    createdLoadingMode.value === 'append' &&
    createdNotes.value.length > 0
  )

  function invalidateCreatedRequests() {
    createdRequestToken.value += 1
    createdLoadingMode.value = null
  }

  function closeCreatedRequest() {
    invalidateCreatedRequests()
    void Promise.resolve(createdRequest.abort()).catch(() => undefined)
  }

  function resetCreatedState() {
    createdItems.value = []
    createdPage.value = defaultMyNotesQuery.page
    createdTotal.value = 0
    createdHasMore.value = false
    createdErrorMessage.value = ''
    createdLoadingMode.value = null
  }

  function shouldApplyCreatedResponse(requestToken: number, requestScope: string) {
    return (
      requestToken === createdRequestToken.value &&
      requestScope === createdCacheScope.value &&
      userCenterOpen.value &&
      activeTab.value === 'created'
    )
  }

  async function loadCreatedNotes(
    page = defaultMyNotesQuery.page,
    mode: CreatedFetchMode = 'replace'
  ) {
    closeCreatedRequest()

    const requestScope = createdCacheScope.value
    const requestToken = createdRequestToken.value
    const previousItems = createdItems.value
    const previousPage = createdPage.value
    const previousTotal = createdTotal.value
    const previousHasMore = createdHasMore.value

    createdErrorMessage.value = ''
    createdLoadingMode.value = mode

    if (mode === 'replace') {
      createdPage.value = page
      createdHasMore.value = false
    }

    const response = await createdRequest.send({
      query: {
        ...defaultMyNotesQuery,
        page
      },
      cacheScope: requestScope
    }).catch((error: unknown) => {
      if (!shouldApplyCreatedResponse(requestToken, requestScope)) {
        return null
      }

      if (isUnauthorizedUserPanelError(error)) {
        authStore.setAnonymous()
        return null
      }

      if (mode === 'replace') {
        createdItems.value = []
        createdPage.value = defaultMyNotesQuery.page
        createdTotal.value = 0
        createdHasMore.value = false
      } else {
        createdItems.value = previousItems
        createdPage.value = previousPage
        createdTotal.value = previousTotal
        createdHasMore.value = previousHasMore
      }

      createdErrorMessage.value = resolveUserPanelErrorMessage(error)
      createdLoadingMode.value = null
      return null
    })

    if (!shouldApplyCreatedResponse(requestToken, requestScope)) {
      return
    }

    if (!isMyNotesResponseDto(response)) {
      if (mode === 'replace') {
        createdItems.value = []
        createdPage.value = defaultMyNotesQuery.page
        createdTotal.value = 0
        createdHasMore.value = false
      } else {
        createdItems.value = previousItems
        createdPage.value = previousPage
        createdTotal.value = previousTotal
        createdHasMore.value = previousHasMore
      }

      createdErrorMessage.value = '读取我的创建失败，请稍后重试。'
      createdLoadingMode.value = null
      return
    }

    createdItems.value =
      mode === 'append'
        ? [...previousItems, ...response.items]
        : response.items
    createdPage.value = response.page
    createdTotal.value = response.total
    createdHasMore.value = response.hasMore
    createdLoadingMode.value = null
  }

  function resetUserPanelState() {
    userCenterOpen.value = false
    activeTab.value = 'created'
    closeCreatedRequest()
    resetCreatedState()
  }

  function openUserCenter() {
    activeTab.value = 'created'
    userCenterOpen.value = true
    void loadCreatedNotes()
  }

  function closeUserCenter() {
    userCenterOpen.value = false
    closeCreatedRequest()
  }

  function selectTab(tab: UserPanelTab) {
    activeTab.value = tab

    if (tab === 'created' && userCenterOpen.value) {
      void loadCreatedNotes()
      return
    }

    closeCreatedRequest()
  }

  function loadMoreCreatedNotes() {
    if (
      !userCenterOpen.value ||
      activeTab.value !== 'created' ||
      createdLoading.value ||
      createdLoadingMore.value ||
      !createdHasMore.value
    ) {
      return
    }

    void loadCreatedNotes(createdPage.value + 1, 'append')
  }

  async function openCreatedNote(sid: string) {
    closeUserCenter()
    await router.push(`/note/o/${encodeURIComponent(sid)}`)
  }

  async function goCreateFirstNote() {
    closeUserCenter()
    await router.push('/')
  }

  watch(createdCacheScope, (nextScope, previousScope) => {
    if (nextScope !== previousScope) {
      resetUserPanelState()
    }
  })

  return {
    activeTab,
    createdErrorMessage,
    createdHasMore,
    createdLoading,
    createdLoadingMore,
    createdNotes,
    createdPage,
    createdTotal,
    closeUserCenter,
    goCreateFirstNote,
    loadMoreCreatedNotes,
    openCreatedNote,
    openUserCenter,
    selectTab,
    userCenterOpen
  }
}
