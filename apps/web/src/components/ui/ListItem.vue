<script setup lang="ts">
import { computed } from 'vue'

import type { InteractionState } from '@note/shared-types'

import { surfaceStateClasses } from './state-presets'

const props = withDefaults(
  defineProps<{
    title: string
    description: string
    meta?: string
    state?: InteractionState
  }>(),
  {
    meta: '',
    state: 'default'
  }
)

const itemClassName = computed(() => [
  'flex items-start justify-between gap-3 rounded-[var(--radius-control)] border px-4 py-4 transition duration-[var(--duration-fast)]',
  surfaceStateClasses[props.state]
])
</script>

<template>
  <article :class="itemClassName">
    <div class="space-y-1">
      <h3 class="m-0 text-sm font-semibold">{{ title }}</h3>
      <p class="m-0 text-sm text-[color:var(--text-secondary)]">{{ description }}</p>
    </div>
    <span v-if="meta" class="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
      {{ meta }}
    </span>
  </article>
</template>
