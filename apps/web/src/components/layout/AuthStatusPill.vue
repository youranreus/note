<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import SsoConfirmModal from '@/features/auth/components/SsoConfirmModal.vue'
import { useAuthFlow } from '@/features/auth/use-auth-flow'
import UserCenterModal from '@/features/user-panel/components/UserCenterModal.vue'
import { useUserPanel } from '@/features/user-panel/use-user-panel'
import { useAuthStore } from '@/stores/auth-store'

const authStore = useAuthStore()
const router = useRouter()
const { description, loginModalOpen, status, user } = storeToRefs(authStore)
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
const avatarLoadFailed = ref(false)

const authenticatedLabel = computed(() => {
  if (!user.value?.displayName || !user.value?.ssoId) {
    return '已登录'
  }

  return `${user.value.displayName}#${user.value.ssoId}`
})

const displayLabel = computed(() => {
  if (status.value === 'recovering') {
    return '登录中'
  }

  return status.value === 'authenticated' ? authenticatedLabel.value : '登录'
})

const avatarSrc = computed(() => {
  if (status.value !== 'authenticated') {
    return null
  }

  return user.value?.avatarUrl ?? null
})

const showAvatarImage = computed(() => Boolean(avatarSrc.value) && !avatarLoadFailed.value)

const avatarFallbackText = computed(() => {
  if (status.value !== 'authenticated') {
    return ''
  }

  const seed = user.value?.displayName?.trim() || user.value?.ssoId?.trim() || ''
  const initial = Array.from(seed)[0]

  return initial ? initial.toUpperCase() : ''
})
const triggerAriaLabel = computed(() => {
  if (status.value === 'authenticated') {
    return userCenterOpen.value ? '个人中心已打开' : '打开个人中心'
  }

  return description.value
})

onMounted(() => {
  void hydrateSession()
})

watch(
  () => user.value?.avatarUrl,
  () => {
    avatarLoadFailed.value = false
  }
)

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

function handleAvatarError() {
  avatarLoadFailed.value = true
}
</script>

<template>
  <div class="flex items-center">
    <button
      ref="trigger"
      :aria-label="triggerAriaLabel"
      :aria-expanded="loginModalOpen || userCenterOpen ? 'true' : 'false'"
      :aria-haspopup="status === 'recovering' ? undefined : 'dialog'"
      :disabled="status === 'recovering'"
      class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-soft)]"
      data-testid="auth-status-pill-trigger"
      type="button"
      @click="handleOpen"
    >
      <span
        :class="[
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium transition duration-[var(--duration-fast)]',
          userCenterOpen
            ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]'
            : 'border-transparent bg-[rgba(255,255,255,0.85)] text-[color:var(--text-primary)]'
        ]"
      >
        <span
          class="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--panel-border)] bg-[color:var(--subtle-fill)] text-[10px] font-semibold uppercase text-[color:var(--text-secondary)]"
        >
          <img
            v-if="showAvatarImage"
            :src="avatarSrc ?? undefined"
            :alt="`${displayLabel} 头像`"
            class="h-full w-full object-cover"
            data-testid="auth-status-pill-avatar-image"
            @error="handleAvatarError"
          />
          <span
            v-else
            data-testid="auth-status-pill-avatar-fallback"
          >
            {{ avatarFallbackText }}
          </span>
        </span>
        <span>{{ displayLabel }}</span>
      </span>
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
