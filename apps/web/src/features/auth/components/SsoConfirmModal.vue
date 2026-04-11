<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
import Modal from '@/components/ui/Modal.vue'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

function handleKeyboardConfirm() {
  emit('confirm')
}
</script>

<template>
  <Modal
    :open="open"
    close-label="取消"
    data-testid="sso-confirm-modal"
    description="将跳转到企业身份提供方完成认证。"
    size="sm"
    title="使用 SSO 登录"
    @close="emit('close')"
  >
    <p class="sr-only">登录是能力升级</p>
    <p class="sr-only">会回到当前上下文</p>
    <template #actions>
      <Button
        data-testid="sso-confirm-cancel"
        size="compact"
        variant="subtle"
        @click="emit('close')"
      >
        取消
      </Button>
      <Button
        data-testid="sso-confirm-action"
        size="compact"
        variant="subtle"
        @click="emit('confirm')"
        @keydown.enter.prevent="handleKeyboardConfirm"
        @keydown.space.prevent="handleKeyboardConfirm"
      >
        继续 SSO 登录
      </Button>
    </template>
  </Modal>
</template>
