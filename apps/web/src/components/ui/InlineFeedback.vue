<script setup lang="ts">
import { computed } from 'vue'

import type { InteractionState } from '@note/shared-types'

const props = withDefaults(
  defineProps<{
    title: string
    description: string
    tone?: 'info' | 'success' | 'warning' | 'danger'
    state?: InteractionState
  }>(),
  {
    tone: 'info',
    state: 'default'
  }
)

const toneClassMap = {
  info: 'border-accent-100 bg-accent-50 text-accent-800',
  success: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-100 bg-amber-50 text-amber-800',
  danger: 'border-red-100 bg-red-50 text-red-800'
} as const

const stateClassName = computed(() => {
  const stateClassMap: Record<InteractionState, string> = {
    default: '',
    focus: 'ring-4 ring-accent-100',
    error: 'ring-4 ring-red-100',
    disabled: 'opacity-65'
  }

  return stateClassMap[props.state]
})
</script>

<template>
  <div :class="['rounded-[var(--radius-control)] border px-4 py-3 text-sm', toneClassMap[props.tone], stateClassName]">
    <p class="m-0 font-semibold">{{ title }}</p>
    <p class="mt-1 text-sm opacity-80">{{ description }}</p>
  </div>
</template>
