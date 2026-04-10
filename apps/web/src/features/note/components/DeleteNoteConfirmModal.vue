<script setup lang="ts">
import { computed } from 'vue'

import type { InteractionState } from '@note/shared-types'

import Button from '@/components/ui/Button.vue'
import Modal from '@/components/ui/Modal.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    busy?: boolean
  }>(),
  {
    busy: false
  }
)

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const actionState = computed<InteractionState>(() => (props.busy ? 'disabled' : 'default'))
</script>

<template>
  <Modal
    :open="open"
    title="删除当前在线便签"
    description="删除后不可恢复，原链接会立即失效；请确认你真的要结束这条内容的生命周期。"
    close-label="取消"
    dialog-test-id="delete-note-confirm-modal"
    initial-focus="first-focusable"
    state="error"
    @close="emit('close')"
  >
    <p class="m-0 text-sm leading-6 text-[color:var(--text-secondary)]">
      删除成功后，当前页面会立刻进入已删除终态，后续不能继续保存或恢复这条内容。
    </p>

    <template #actions>
      <Button
        data-testid="delete-note-confirm-cancel"
        :state="actionState"
        type="button"
        variant="secondary"
        @click="emit('close')"
      >
        取消
      </Button>
      <Button
        data-testid="delete-note-confirm-action"
        :state="actionState"
        type="button"
        variant="danger"
        @click="emit('confirm')"
      >
        确认删除
      </Button>
    </template>
  </Modal>
</template>
