<script setup lang="ts">
import { computed } from 'vue'

import type { InteractionState } from '@note/shared-types'

import { surfaceStateClasses } from './state-presets'

const props = withDefaults(
  defineProps<{
    state?: InteractionState
  }>(),
  {
    state: 'default'
  }
)

const cardClassName = computed(() => [
  'rounded-[var(--radius-panel)] border p-5 shadow-[var(--panel-shadow)] transition duration-[var(--duration-normal)]',
  surfaceStateClasses[props.state]
])
</script>

<template>
  <section :class="cardClassName">
    <slot />
  </section>
</template>
