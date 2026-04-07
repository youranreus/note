import { useRequest } from 'alova/client'
import { storeToRefs } from 'pinia'
import { computed, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'

import type {
  MyNotesQueryDto,
  MyNotesResponseDto,
  UserPanelTab
} from '@note/shared-types'

import { createGetMyNotesMethod } from '@/services/me-methods'
import { useAuthStore } from '@/stores/auth-store'

import { isMyNotesResponseDto, resolveUserPanelErrorMessage } from './user-panel'

const defaultMyNotesQuery = {
  page: 1,
  limit: 20
} as const satisfies Required<MyNotesQueryDto>

interface LoadCreatedNotesPayload {
  query?: MyNotesQueryDto
  cacheScope: string
}

export function useUserPanel() {
  const router = useRouter()
  const authStore = useAuthStore()
  const { status, user } = storeToRefs(authStore)
  const userCenterOpen = shallowRef(false)
  const activeTab = shallowRef<UserPanelTab>('created')
  const createdResponse = shallowRef<MyNotesResponseDto | null>(null)
  const createdErrorMessage = shallowRef('')
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

  const createdNotes = computed(() => createdResponse.value?.items ?? [])
  const createdLoading = computed(
    () => createdRequest.loading.value && createdNotes.value.length === 0
  )

  function resetCreatedState() {
    createdResponse.value = null
    createdErrorMessage.value = ''
  }

  async function loadCreatedNotes() {
    const requestScope = createdCacheScope.value

    createdErrorMessage.value = ''

    const response = await createdRequest.send({
      query: {
        ...defaultMyNotesQuery
      },
      cacheScope: requestScope
    }).catch((error: unknown) => {
      if (requestScope === createdCacheScope.value) {
        createdResponse.value = null
        createdErrorMessage.value = resolveUserPanelErrorMessage(error)
      }

      return null
    })

    if (requestScope !== createdCacheScope.value) {
      return
    }

    createdResponse.value = isMyNotesResponseDto(response) ? response : null
  }

  function resetUserPanelState() {
    userCenterOpen.value = false
    activeTab.value = 'created'
    resetCreatedState()
    void Promise.resolve(createdRequest.abort()).catch(() => undefined)
  }

  function openUserCenter() {
    activeTab.value = 'created'
    userCenterOpen.value = true
    void loadCreatedNotes()
  }

  function closeUserCenter() {
    userCenterOpen.value = false
  }

  function selectTab(tab: UserPanelTab) {
    activeTab.value = tab

    if (tab === 'created' && userCenterOpen.value) {
      void loadCreatedNotes()
    }
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
    createdLoading,
    createdNotes,
    closeUserCenter,
    goCreateFirstNote,
    openCreatedNote,
    openUserCenter,
    selectTab,
    userCenterOpen
  }
}
