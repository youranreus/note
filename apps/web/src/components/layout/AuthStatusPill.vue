<script setup lang="ts">
import { computed, nextTick, onMounted, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import StatusPill from '@/components/ui/StatusPill.vue'
import SsoConfirmModal from '@/features/auth/components/SsoConfirmModal.vue'
import { useAuthFlow } from '@/features/auth/use-auth-flow'
import UserCenterModal from '@/features/user-panel/components/UserCenterModal.vue'
import { useUserPanel } from '@/features/user-panel/use-user-panel'
import { useAuthStore } from '@/stores/auth-store'

const authStore = useAuthStore()
const router = useRouter()
const { description, label, loginModalOpen, status, tone } = storeToRefs(authStore)
const { closeLoginModal, hydrateSession, openLoginModal, startLoginUpgrade } = useAuthFlow()
const {
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
} = useUserPanel()
const triggerRef = useTemplateRef<HTMLButtonElement>('trigger')

const triggerLabel = computed(() => {
  if (status.value === 'authenticated') {
    return label.value
  }

  return label.value
})

const triggerDescription = computed(() => {
  if (status.value === 'authenticated') {
    return userCenterOpen.value ? '个人中心已打开' : '打开个人中心查看我的创建与收藏'
  }

  return description.value
})

const triggerTone = computed(() => {
  if (status.value === 'authenticated' && userCenterOpen.value) {
    return 'accent'
  }

  return tone.value
})

const triggerState = computed(() => {
  if (status.value === 'recovering' || userCenterOpen.value) {
    return 'focus'
  }

  return 'default'
})

onMounted(() => {
  void hydrateSession()
})

function handleOpen() {
  if (status.value === 'recovering') {
    return
  }

  if (status.value === 'anonymous') {
    openLoginModal()
    return
  }

  openUserCenter()
}

async function handleClose() {
  closeLoginModal()
  await nextTick()
  triggerRef.value?.focus()
}

async function handleUserCenterClose() {
  closeUserCenter()
  await nextTick()
  await nextTick()
  triggerRef.value?.focus()
}

async function handleOpenNote(sid: string) {
  const previousPath = router.currentRoute.value.fullPath
  await openNote(sid)
  await nextTick()

  if (router.currentRoute.value.fullPath === previousPath) {
    triggerRef.value?.focus()
  }
}

async function handleCreateFirstNote() {
  const previousPath = router.currentRoute.value.fullPath
  await goCreateFirstNote()
  await nextTick()

  if (router.currentRoute.value.fullPath === previousPath) {
    triggerRef.value?.focus()
  }
}

async function handleBrowseNotes() {
  const previousPath = router.currentRoute.value.fullPath
  await browseNotes()
  await nextTick()

  if (router.currentRoute.value.fullPath === previousPath) {
    triggerRef.value?.focus()
  }
}
</script>

<template>
  <div class="flex items-center">
    <button
      ref="trigger"
      :aria-expanded="loginModalOpen || userCenterOpen ? 'true' : 'false'"
      :aria-haspopup="status === 'recovering' ? undefined : 'dialog'"
      :disabled="status === 'recovering'"
      class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-100"
      data-testid="auth-status-pill-trigger"
      type="button"
      @click="handleOpen"
    >
      <StatusPill
        :caption="triggerDescription"
        :label="triggerLabel"
        :state="triggerState"
        :tone="triggerTone"
      />
    </button>

    <SsoConfirmModal
      :open="loginModalOpen"
      @close="handleClose"
      @confirm="startLoginUpgrade"
    />

    <UserCenterModal
      :active-tab="activeTab"
      :created-error-message="createdErrorMessage"
      :created-has-more="createdHasMore"
      :created-loading="createdLoading"
      :created-loading-more="createdLoadingMore"
      :created-notes="createdNotes"
      :created-page="createdPage"
      :created-total="createdTotal"
      :favorite-error-message="favoriteErrorMessage"
      :favorite-has-more="favoriteHasMore"
      :favorite-loading="favoriteLoading"
      :favorite-loading-more="favoriteLoadingMore"
      :favorite-notes="favoriteNotes"
      :favorite-page="favoritePage"
      :favorite-total="favoriteTotal"
      :open="userCenterOpen"
      @browse-notes="handleBrowseNotes"
      @close="handleUserCenterClose"
      @create-first-note="handleCreateFirstNote"
      @load-more-created="loadMoreCreatedNotes"
      @load-more-favorites="loadMoreFavoriteNotes"
      @open-note="handleOpenNote"
      @select-tab="selectTab"
    />
  </div>
</template>
