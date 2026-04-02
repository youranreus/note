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
  neutral: 'bg-ink-100 text-ink-700',
  accent: 'bg-accent-100 text-accent-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700'
} as const

const stateClassMap: Record<InteractionState, string> = {
  default: '',
  focus: 'ring-4 ring-accent-100',
  error: 'ring-4 ring-red-100',
  disabled: 'opacity-65'
}

const pillClassName = computed(() => [
  'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition duration-[var(--duration-fast)]',
  toneClassMap[props.tone],
  stateClassMap[props.state]
])
</script>

<template>
  <span :class="pillClassName">
    <span class="h-2.5 w-2.5 rounded-full bg-current opacity-60" />
    <span>{{ label }}</span>
    <span v-if="caption" class="text-xs opacity-70">{{ caption }}</span>
  </span>
</template>
