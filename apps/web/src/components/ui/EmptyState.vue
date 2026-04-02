<script setup lang="ts">
import { computed } from 'vue'

import type { InteractionState } from '@note/shared-types'

const props = withDefaults(
  defineProps<{
    title: string
    description: string
    state?: InteractionState
  }>(),
  {
    state: 'default'
  }
)

const containerClassName = computed(() => {
  const stateClassMap: Record<InteractionState, string> = {
    default: 'border-[color:var(--panel-border)] bg-white/60',
    focus: 'border-accent-300 bg-white ring-4 ring-accent-100',
    error: 'border-red-200 bg-red-50',
    disabled: 'border-transparent bg-ink-100 opacity-70'
  }

  return [
    'rounded-[var(--radius-panel)] border border-dashed px-6 py-10 text-center',
    stateClassMap[props.state]
  ]
})
</script>

<template>
  <div :class="containerClassName">
    <p class="m-0 text-base font-semibold">{{ props.title }}</p>
    <p class="mx-auto mt-2 max-w-xl text-sm text-[color:var(--text-secondary)]">
      {{ props.description }}
    </p>
  </div>
</template>
