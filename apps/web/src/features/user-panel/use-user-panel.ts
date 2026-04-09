import { useRequest } from 'alova/client'
import { storeToRefs } from 'pinia'
import { computed, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'

import type {
  MyFavoriteSummaryDto,
  MyNoteSummaryDto,
  MyNotesQueryDto,
  UserPanelTab
} from '@note/shared-types'

import {
  createGetMyFavoritesMethod,
  createGetMyNotesMethod
} from '@/services/me-methods'
import { useAuthStore } from '@/stores/auth-store'

import {
  isMyFavoritesResponseDto,
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
type FavoriteFetchMode = 'replace' | 'append'

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
  const favoriteItems = shallowRef<MyFavoriteSummaryDto[]>([])
  const favoritePage = shallowRef(defaultMyNotesQuery.page)
  const favoriteTotal = shallowRef(0)
  const favoriteHasMore = shallowRef(false)
  const favoriteLoadingMode = shallowRef<FavoriteFetchMode | null>(null)
  const favoriteErrorMessage = shallowRef('')
  const favoriteRequestToken = shallowRef(0)
  const favoriteCacheScope = computed(() =>
    status.value === 'authenticated' && user.value?.id
      ? `user:${user.value.id}`
      : status.value
  )
  const favoriteRequest = useRequest(
    ({ query = defaultMyNotesQuery, cacheScope }: LoadCreatedNotesPayload) =>
      createGetMyFavoritesMethod(query, cacheScope),
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
  const favoriteNotes = computed(() => favoriteItems.value)
  const favoriteLoading = computed(() =>
    favoriteRequest.loading.value &&
    favoriteLoadingMode.value === 'replace' &&
    favoriteNotes.value.length === 0
  )
  const favoriteLoadingMore = computed(() =>
    favoriteRequest.loading.value &&
    favoriteLoadingMode.value === 'append' &&
    favoriteNotes.value.length > 0
  )

  function invalidateCreatedRequests() {
    createdRequestToken.value += 1
    createdLoadingMode.value = null
  }

  function closeCreatedRequest() {
    invalidateCreatedRequests()
    void Promise.resolve(createdRequest.abort()).catch(() => undefined)
  }

  function invalidateFavoriteRequests() {
    favoriteRequestToken.value += 1
    favoriteLoadingMode.value = null
  }

  function closeFavoriteRequest() {
    invalidateFavoriteRequests()
    void Promise.resolve(favoriteRequest.abort()).catch(() => undefined)
  }

  function resetCreatedState() {
    createdItems.value = []
    createdPage.value = defaultMyNotesQuery.page
    createdTotal.value = 0
    createdHasMore.value = false
    createdErrorMessage.value = ''
    createdLoadingMode.value = null
  }

  function resetFavoriteState() {
    favoriteItems.value = []
    favoritePage.value = defaultMyNotesQuery.page
    favoriteTotal.value = 0
    favoriteHasMore.value = false
    favoriteErrorMessage.value = ''
    favoriteLoadingMode.value = null
  }

  function shouldApplyCreatedResponse(requestToken: number, requestScope: string) {
    return (
      requestToken === createdRequestToken.value &&
      requestScope === createdCacheScope.value &&
      userCenterOpen.value &&
      activeTab.value === 'created'
    )
  }

  function shouldApplyFavoriteResponse(requestToken: number, requestScope: string) {
    return (
      requestToken === favoriteRequestToken.value &&
      requestScope === favoriteCacheScope.value &&
      userCenterOpen.value &&
      activeTab.value === 'favorites'
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

  async function loadFavoriteNotes(
    page = defaultMyNotesQuery.page,
    mode: FavoriteFetchMode = 'replace'
  ) {
    closeFavoriteRequest()

    const requestScope = favoriteCacheScope.value
    const requestToken = favoriteRequestToken.value
    const previousItems = favoriteItems.value
    const previousPage = favoritePage.value
    const previousTotal = favoriteTotal.value
    const previousHasMore = favoriteHasMore.value

    favoriteErrorMessage.value = ''
    favoriteLoadingMode.value = mode

    if (mode === 'replace') {
      favoritePage.value = page
      favoriteHasMore.value = false
    }

    const response = await favoriteRequest.send({
      query: {
        ...defaultMyNotesQuery,
        page
      },
      cacheScope: requestScope
    }).catch((error: unknown) => {
      if (!shouldApplyFavoriteResponse(requestToken, requestScope)) {
        return null
      }

      if (isUnauthorizedUserPanelError(error)) {
        authStore.setAnonymous()
        return null
      }

      if (mode === 'replace') {
        favoriteItems.value = []
        favoritePage.value = defaultMyNotesQuery.page
        favoriteTotal.value = 0
        favoriteHasMore.value = false
      } else {
        favoriteItems.value = previousItems
        favoritePage.value = previousPage
        favoriteTotal.value = previousTotal
        favoriteHasMore.value = previousHasMore
      }

      favoriteErrorMessage.value = resolveUserPanelErrorMessage(
        error,
        '读取我的收藏失败，请稍后重试。'
      )
      favoriteLoadingMode.value = null
      return null
    })

    if (!shouldApplyFavoriteResponse(requestToken, requestScope)) {
      return
    }

    if (!isMyFavoritesResponseDto(response)) {
      if (mode === 'replace') {
        favoriteItems.value = []
        favoritePage.value = defaultMyNotesQuery.page
        favoriteTotal.value = 0
        favoriteHasMore.value = false
      } else {
        favoriteItems.value = previousItems
        favoritePage.value = previousPage
        favoriteTotal.value = previousTotal
        favoriteHasMore.value = previousHasMore
      }

      favoriteErrorMessage.value = '读取我的收藏失败，请稍后重试。'
      favoriteLoadingMode.value = null
      return
    }

    favoriteItems.value =
      mode === 'append'
        ? [...previousItems, ...response.items]
        : response.items
    favoritePage.value = response.page
    favoriteTotal.value = response.total
    favoriteHasMore.value = response.hasMore
    favoriteLoadingMode.value = null
  }

  function resetUserPanelState() {
    userCenterOpen.value = false
    activeTab.value = 'created'
    closeCreatedRequest()
    closeFavoriteRequest()
    resetCreatedState()
    resetFavoriteState()
  }

  function openUserCenter() {
    activeTab.value = 'created'
    userCenterOpen.value = true
    void loadCreatedNotes()
  }

  function closeUserCenter() {
    resetUserPanelState()
  }

  function selectTab(tab: UserPanelTab) {
    activeTab.value = tab

    if (tab === 'created' && userCenterOpen.value) {
      void loadCreatedNotes()
      return
    }

    closeCreatedRequest()

    if (tab === 'favorites' && userCenterOpen.value) {
      void loadFavoriteNotes()
      return
    }

    closeFavoriteRequest()
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

  function loadMoreFavoriteNotes() {
    if (
      !userCenterOpen.value ||
      activeTab.value !== 'favorites' ||
      favoriteLoading.value ||
      favoriteLoadingMore.value ||
      !favoriteHasMore.value
    ) {
      return
    }

    void loadFavoriteNotes(favoritePage.value + 1, 'append')
  }

  async function openNote(sid: string) {
    closeUserCenter()
    await router.push(`/note/o/${encodeURIComponent(sid)}`)
  }

  async function goCreateFirstNote() {
    closeUserCenter()
    await router.push('/')
  }

  async function browseNotes() {
    closeUserCenter()
    await router.push('/')
  }

  watch(createdCacheScope, (nextScope, previousScope) => {
    if (nextScope !== previousScope) {
      resetUserPanelState()
    }
  })

  watch(favoriteCacheScope, (nextScope, previousScope) => {
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
    browseNotes,
    closeUserCenter,
    favoriteErrorMessage,
    favoriteHasMore,
    favoriteLoading,
    favoriteLoadingMore,
    favoriteNotes,
    favoritePage,
    favoriteTotal,
    goCreateFirstNote,
    loadMoreCreatedNotes,
    loadMoreFavoriteNotes,
    openNote,
    openUserCenter,
    selectTab,
    userCenterOpen
  }
}
