<script setup lang="ts">
import { computed, useSlots } from 'vue'

import type { InteractionState } from '@note/shared-types'

import { buttonStateClasses, buttonVariantClasses } from './state-presets'

const props = withDefaults(
  defineProps<{
    ariaLabel?: string
    icon?: 'star' | 'copy' | 'lock' | 'save' | 'trash'
    leadingLabel?: string
    size?: 'default' | 'compact' | 'icon'
    state?: InteractionState
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'secondary' | 'subtle' | 'danger'
  }>(),
  {
    ariaLabel: undefined,
    icon: undefined,
    state: 'default',
    leadingLabel: '',
    size: 'default',
    type: 'button',
    variant: 'primary'
  }
)

const slots = useSlots()
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isDisabled = computed(() => props.state === 'disabled')
const hasDefaultSlot = computed(() => Boolean(slots.default))
const sizeClassMap = {
  default: 'min-h-11 min-h-[52px] px-5 text-[17px]',
  compact: 'min-h-9 px-3 text-[13px]',
  icon: 'h-9 w-9 px-0 text-[13px]'
} as const
const iconSizeClassMap = {
  default: 'h-[14px] w-[14px]',
  compact: 'h-[14px] w-[14px]',
  icon: 'h-4 w-4'
} as const
const buttonClassName = computed(() => {
  const baseClasses = [
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border font-medium transition duration-[var(--duration-fast)]'
  ]

  if (props.state === 'disabled') {
    return [...baseClasses, sizeClassMap[props.size], buttonVariantClasses[props.variant], buttonStateClasses.disabled]
  }

  return [
    ...baseClasses,
    sizeClassMap[props.size],
    buttonVariantClasses[props.variant],
    buttonStateClasses[props.state]
  ]
})
const iconPaths = {
  star:
    'M7 1.4l1.7 3.4 3.8.6-2.7 2.7.7 3.9L7 10.2 3.5 12l.7-3.9L1.5 5.4l3.8-.6L7 1.4z',
  copy:
    'M5 2.5h5.5a2 2 0 012 2V10M5.5 5H11a2 2 0 012 2v5.5a1.5 1.5 0 01-1.5 1.5H5.5A1.5 1.5 0 014 12.5V6.5A1.5 1.5 0 015.5 5z',
  lock:
    'M4.5 6V4.8a2.5 2.5 0 115 0V6M4.8 6h4.4A1.8 1.8 0 0111 7.8v3.4A1.8 1.8 0 019.2 13H4.8A1.8 1.8 0 013 11.2V7.8A1.8 1.8 0 014.8 6z',
  save:
    'M3 2.5h7L12.5 5v7a1.5 1.5 0 01-1.5 1.5h-8A1.5 1.5 0 011.5 12V4A1.5 1.5 0 013 2.5zm1 .5v3h5V3H4zm0 6.5h5.5',
  trash:
    'M3.5 4.5h8M5.5 4.5V3.6c0-.3.3-.6.6-.6h2.8c.3 0 .6.3.6.6v.9M4.5 4.5l.6 7.1c0 .4.3.7.7.7h3.4c.4 0 .7-.3.7-.7l.6-7.1M6.4 6.5v3.8M8.6 6.5v3.8'
} as const
const iconPath = computed(() => (props.icon ? iconPaths[props.icon] : ''))

function handleClick(event: MouseEvent) {
  if (isDisabled.value) {
    return
  }

  emit('click', event)
}
</script>

<template>
  <button
    :aria-label="props.ariaLabel"
    :class="buttonClassName"
    :disabled="isDisabled"
    :type="props.type"
    @click="handleClick"
  >
    <svg
      v-if="icon"
      aria-hidden="true"
      class="shrink-0"
      :class="iconSizeClassMap[props.size]"
      fill="none"
      viewBox="0 0 14 14"
    >
      <path
        :d="iconPath"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.2"
      />
    </svg>
    <span v-if="leadingLabel" class="text-[11px] uppercase tracking-[0.18em] opacity-70">
      {{ leadingLabel }}
    </span>
    <span v-if="hasDefaultSlot">
      <slot />
    </span>
  </button>
</template>
