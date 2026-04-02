<script setup lang="ts">
import { computed } from 'vue'

import type { InteractionState } from '@note/shared-types'

const props = withDefaults(
  defineProps<{
    state?: InteractionState
  }>(),
  {
    state: 'default'
  }
)

const containerClassName = computed(() => {
  const stateClassMap: Record<InteractionState, string> = {
    default: 'border-[color:var(--panel-border)] bg-white/70',
    focus: 'border-accent-300 bg-white ring-4 ring-accent-100',
    error: 'border-red-200 bg-red-50',
    disabled: 'border-transparent bg-ink-100 opacity-70'
  }

  return [
    'rounded-[var(--radius-panel)] border p-5 shadow-[var(--panel-shadow)]',
    stateClassMap[props.state]
  ]
})
</script>

<template>
  <div :class="containerClassName">
    <div class="animate-pulse space-y-4">
      <div class="h-3 w-24 rounded-full bg-ink-100" />
      <div class="h-8 rounded-full bg-ink-100" />
      <div class="h-8 rounded-full bg-ink-100" />
      <div class="h-20 rounded-[var(--radius-control)] bg-ink-100" />
    </div>
  </div>
</template>
