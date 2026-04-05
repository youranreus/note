<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
import InlineFeedback from '@/components/ui/InlineFeedback.vue'
import Modal from '@/components/ui/Modal.vue'
import StatusPill from '@/components/ui/StatusPill.vue'

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
    close-label="暂不登录"
    data-testid="sso-confirm-modal"
    description="登录后会建立受保护的账户会话，并在完成回跳后尽量把你带回刚才所在的上下文。"
    state="focus"
    title="登录是能力升级"
    @close="emit('close')"
  >
    <div class="grid gap-4" data-testid="sso-confirm-modal">
      <div class="flex flex-wrap items-center gap-3">
        <StatusPill caption="不会打断匿名阅读" label="能力升级" tone="accent" />
        <StatusPill caption="只恢复站内安全路径" label="会回到当前上下文" tone="success" />
      </div>
      <InlineFeedback
        description="这一步只说明登录升级、回跳恢复和继续进入 SSO，不会提前展开收藏、我的创建或后续权限模型。"
        title="确认后进入 SSO"
        tone="info"
      />
    </div>
    <template #actions>
      <Button
        data-testid="sso-confirm-cancel"
        variant="secondary"
        @click="emit('close')"
      >
        先保持当前状态
      </Button>
      <Button
        data-testid="sso-confirm-action"
        @click="emit('confirm')"
        @keydown.enter.prevent="handleKeyboardConfirm"
        @keydown.space.prevent="handleKeyboardConfirm"
      >
        继续 SSO 登录
      </Button>
    </template>
  </Modal>
</template>
