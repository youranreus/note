<script setup lang="ts">
import { computed } from 'vue'

import type { InteractionState } from '@note/shared-types'

import { buttonStateClasses, buttonVariantClasses } from './state-presets'

const props = withDefaults(
  defineProps<{
    state?: InteractionState
    leadingLabel?: string
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'secondary'
  }>(),
  {
    state: 'default',
    leadingLabel: '',
    type: 'button',
    variant: 'primary'
  }
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isDisabled = computed(() => props.state === 'disabled')
const buttonClassName = computed(() => {
  const baseClasses = [
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border px-4 py-2 text-sm font-semibold transition duration-[var(--duration-fast)]'
  ]

  if (props.state === 'disabled') {
    return [...baseClasses, buttonStateClasses.disabled]
  }

  return [
    ...baseClasses,
    buttonVariantClasses[props.variant],
    buttonStateClasses[props.state]
  ]
})

function handleClick(event: MouseEvent) {
  if (isDisabled.value) {
    return
  }

  emit('click', event)
}
</script>

<template>
  <button :class="buttonClassName" :disabled="isDisabled" :type="props.type" @click="handleClick">
    <span v-if="leadingLabel" class="text-xs uppercase tracking-[0.2em] opacity-70">
      {{ leadingLabel }}
    </span>
    <span>
      <slot />
    </span>
  </button>
</template>
