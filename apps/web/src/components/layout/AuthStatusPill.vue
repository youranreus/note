<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
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
  closeUserCenter,
  goCreateFirstNote,
  loadMoreCreatedNotes,
  openCreatedNote,
  openUserCenter,
  selectTab,
  userCenterOpen
} = useUserPanel()
const triggerRef = ref<HTMLButtonElement | null>(null)

const triggerLabel = computed(() => {
  if (status.value === 'authenticated') {
    return label.value
  }

  return label.value
})

const triggerDescription = computed(() => {
  if (status.value === 'authenticated') {
    return userCenterOpen.value ? '个人中心已打开' : '打开个人中心查看我的创建'
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

async function handleOpenCreatedNote(sid: string) {
  const previousPath = router.currentRoute.value.fullPath
  await openCreatedNote(sid)
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
</script>

<template>
  <div class="flex items-center">
    <button
      ref="triggerRef"
      :aria-expanded="loginModalOpen || userCenterOpen ? 'true' : 'false'"
      :aria-haspopup="status === 'recovering' ? undefined : 'dialog'"
      :disabled="status === 'recovering'"
      class="rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-100"
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
      :open="userCenterOpen"
      @close="handleUserCenterClose"
      @create-first-note="handleCreateFirstNote"
      @load-more-created="loadMoreCreatedNotes"
      @open-note="handleOpenCreatedNote"
      @select-tab="selectTab"
    />
  </div>
</template>
