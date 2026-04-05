<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import StatusPill from '@/components/ui/StatusPill.vue'
import SsoConfirmModal from '@/features/auth/components/SsoConfirmModal.vue'
import { useAuthFlow } from '@/features/auth/use-auth-flow'
import { useAuthStore } from '@/stores/auth-store'

const authStore = useAuthStore()
const { description, label, loginModalOpen, status, tone } = storeToRefs(authStore)
const { closeLoginModal, hydrateSession, openLoginModal, startLoginUpgrade } = useAuthFlow()
const triggerRef = ref<HTMLButtonElement | null>(null)

onMounted(() => {
  void hydrateSession()
})

function handleOpen() {
  if (status.value !== 'anonymous') {
    return
  }

  openLoginModal()
}

async function handleClose() {
  closeLoginModal()
  await nextTick()
  triggerRef.value?.focus()
}
</script>

<template>
  <div class="flex items-center">
    <button
      ref="triggerRef"
      :aria-expanded="loginModalOpen ? 'true' : 'false'"
      :aria-haspopup="status === 'anonymous' ? 'dialog' : undefined"
      :disabled="status === 'recovering'"
      class="rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-100"
      data-testid="auth-status-pill-trigger"
      type="button"
      @click="handleOpen"
    >
      <StatusPill :caption="description" :label="label" :state="status === 'recovering' ? 'focus' : 'default'" :tone="tone" />
    </button>

    <SsoConfirmModal
      :open="loginModalOpen"
      @close="handleClose"
      @confirm="startLoginUpgrade"
    />
  </div>
</template>
