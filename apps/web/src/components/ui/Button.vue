<script setup lang="ts">
import { computed, useSlots } from 'vue'

import type { InteractionState } from '@note/shared-types'

import { buttonStateClasses, buttonVariantClasses } from './state-presets'

const props = withDefaults(
  defineProps<{
    ariaLabel?: string
    icon?: 'star' | 'copy' | 'lock' | 'save' | 'trash' | 'close' | 'back'
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
  default: 'min-h-11 px-5 text-[15px]',
  compact: 'min-h-11 px-3.5 text-[14px]',
  icon: 'h-11 w-11 px-0 text-[14px]'
} as const
const iconSizeClassMap = {
  default: 'h-[1em] w-[1em] text-[15px]',
  compact: 'h-[1em] w-[1em] text-[15px]',
  icon: 'h-[1em] w-[1em] text-[18px]'
} as const
const buttonClassName = computed(() => {
  const baseClasses = [
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] border text-center font-semibold leading-none tracking-[-0.01em] transition-[background-color,border-color,color,opacity,box-shadow] duration-[var(--duration-fast)] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-soft)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--shell-bg)] motion-reduce:transition-none'
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
const iconNameMap = {
  star: 'star-outline',
  copy: 'copy-outline',
  lock: 'lock-closed-outline',
  save: 'save-outline',
  trash: 'trash-outline',
  close: 'close-outline',
  back: 'arrow-back-outline'
} as const
const iconName = computed(() => (props.icon ? iconNameMap[props.icon] : ''))

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
    <ion-icon
      v-if="icon"
      aria-hidden="true"
      class="block shrink-0 leading-none"
      :class="iconSizeClassMap[props.size]"
      :name="iconName"
    />
    <span v-if="leadingLabel" class="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-55">
      {{ leadingLabel }}
    </span>
    <template v-if="hasDefaultSlot">
      <slot v-if="props.size === 'icon'" />
      <span v-else class="block">
        <slot />
      </span>
    </template>
  </button>
</template>
