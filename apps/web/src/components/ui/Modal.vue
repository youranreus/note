<script setup lang="ts">
import type { InteractionState } from '@note/shared-types'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    description: string
    state?: InteractionState
  }>(),
  {
    state: 'default'
  }
)

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/45 px-4 py-8 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <section
      :class="[
        'w-full max-w-lg rounded-[var(--radius-panel)] border bg-white p-6 shadow-[var(--panel-shadow)]',
        state === 'focus' ? 'border-accent-300 ring-4 ring-accent-100' : '',
        state === 'error' ? 'border-red-200 bg-red-50' : '',
        state === 'disabled' ? 'opacity-70' : 'border-[color:var(--panel-border)]'
      ]"
    >
      <p class="m-0 text-sm uppercase tracking-[0.2em] text-[color:var(--text-muted)]">Modal</p>
      <h3 class="mt-3 text-xl font-semibold">{{ title }}</h3>
      <p class="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
        {{ description }}
      </p>
      <div class="mt-5 flex justify-end">
        <button
          class="rounded-[var(--radius-control)] bg-ink-900 px-4 py-2 text-sm font-semibold text-white"
          type="button"
          @click="emit('close')"
        >
          关闭占位
        </button>
      </div>
    </section>
  </div>
</template>
