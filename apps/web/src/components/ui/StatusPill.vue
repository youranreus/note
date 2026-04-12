<script setup lang="ts">
import { computed } from 'vue'

import type { InteractionState } from '@note/shared-types'

const props = withDefaults(
  defineProps<{
    label: string
    caption?: string
    tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
    state?: InteractionState
  }>(),
  {
    caption: '',
    tone: 'neutral',
    state: 'default'
  }
)

const toneClassMap = {
  neutral: 'border-[color:var(--panel-border)] bg-[color:var(--surface-white)] text-[color:var(--text-secondary)]',
  accent: 'border-[#dce4ff] bg-[color:var(--accent-soft)] text-[color:var(--accent)]',
  success: 'border-[#cdedd7] bg-[color:var(--success-soft)] text-[color:var(--success)]',
  warning: 'border-[#f0d5ad] bg-[color:var(--warning-soft)] text-[color:var(--warning)]',
  danger: 'border-[#ffd5d9] bg-[color:var(--danger-soft)] text-[color:var(--danger)]'
} as const

const stateClassMap: Record<InteractionState, string> = {
  default: '',
  focus: 'ring-4 ring-accent-100',
  error: 'ring-4 ring-red-100',
  disabled: 'opacity-65'
}

const pillClassName = computed(() => [
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] font-semibold transition duration-[var(--duration-fast)]',
  toneClassMap[props.tone],
  stateClassMap[props.state]
])
</script>

<template>
  <span :class="pillClassName">
    <span class="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
    <span>{{ label }}</span>
    <span v-if="caption" class="text-[11px] font-medium opacity-75">{{ caption }}</span>
  </span>
</template>
