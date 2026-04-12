<script setup lang="ts">
import { computed } from 'vue'

import type { InteractionState } from '@note/shared-types'

import Button from '@/components/ui/Button.vue'
import Modal from '@/components/ui/Modal.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    sid?: string | null
    busy?: boolean
  }>(),
  {
    sid: null,
    busy: false
  }
)

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const actionState = computed<InteractionState>(() => (props.busy ? 'disabled' : 'default'))
const modalDescription = computed(() =>
  props.busy
    ? '正在永久删除这条在线便签。删除完成后，原链接会立即失效，当前页面也会切换到已删除终态。'
    : '删除后不可恢复，原链接会立即失效；请确认你真的要结束这条内容的生命周期。'
)
const confirmLabel = computed(() => (props.busy ? '正在删除…' : '确认删除'))
const targetLabel = computed(() => (props.sid ? `# ${props.sid}` : '当前在线便签'))
</script>

<template>
  <Modal
    :open="open"
    title="删除当前在线便签"
    :description="modalDescription"
    close-label="取消"
    dialog-test-id="delete-note-confirm-modal"
    initial-focus="first-focusable"
    state="error"
    @close="emit('close')"
  >
    <div class="grid gap-4">
      <div
        class="rounded-[var(--radius-control)] border border-[color:var(--danger)]/12 bg-[color:var(--danger-soft)] px-4 py-4"
      >
        <div class="flex items-start gap-3">
          <div
            aria-hidden="true"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--surface-white)] text-sm font-bold text-[color:var(--danger)] shadow-sm"
          >
            !
          </div>
          <div class="grid gap-1">
            <p class="m-0 text-sm font-semibold text-[color:var(--text-primary)]">即将永久删除</p>
            <p class="m-0 break-all text-sm leading-6 text-[color:var(--text-secondary)]">
              {{ targetLabel }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="rounded-[var(--radius-control)] border border-[color:var(--control-border)] bg-[color:var(--panel-bg)]/88 px-4 py-4"
      >
        <p class="m-0 text-sm font-semibold text-[color:var(--text-primary)]">删除后会发生什么</p>
        <ul
          class="mt-3 mb-0 grid list-disc gap-2 pl-5 text-sm leading-6 text-[color:var(--text-secondary)] marker:text-[color:var(--danger)]"
        >
          <li>原分享链接会立即失效，其他人无法继续打开这条内容。</li>
          <li>当前页面会立刻进入已删除终态，后续不能继续保存或恢复。</li>
          <li>如果还需要保留内容，请先取消并复制正文或另存一份。</li>
        </ul>
      </div>

      <p
        v-if="busy"
        aria-live="polite"
        class="m-0 rounded-[var(--radius-control)] bg-[color:var(--panel-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
        role="status"
      >
        正在处理删除请求，请稍候，不要关闭当前页面。
      </p>
    </div>

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
        {{ confirmLabel }}
      </Button>
    </template>
  </Modal>
</template>
