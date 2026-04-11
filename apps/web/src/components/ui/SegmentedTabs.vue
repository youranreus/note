<script setup lang="ts">
import { computed, nextTick, shallowRef, watchEffect } from 'vue'
import type { ComponentPublicInstance } from 'vue'

import type { InteractionState } from '@note/shared-types'

import { moveTabSelection } from './segmented-tabs'

const props = withDefaults(
  defineProps<{
    options: Array<{ label: string; value: string }>
    ariaLabel?: string
    idPrefix?: string
    state?: InteractionState
    testIdPrefix?: string
  }>(),
  {
    ariaLabel: '模式切换',
    idPrefix: '',
    state: 'default',
    testIdPrefix: ''
  }
)

const model = defineModel<string>({ required: true })
const tabRefs = shallowRef<HTMLButtonElement[]>([])

const activeValue = computed(() => {
  if (props.options.some((option) => option.value === model.value)) {
    return model.value
  }

  return props.options[0]?.value ?? ''
})

watchEffect(() => {
  if (props.options.length > 0 && model.value !== activeValue.value) {
    model.value = activeValue.value
  }
})

const containerClassName = computed(() => {
  const stateClassMap: Record<InteractionState, string> = {
    default: 'border-transparent bg-[color:var(--subtle-fill-strong)]',
    focus: 'border-[color:var(--accent)] bg-[color:var(--subtle-fill-strong)] ring-2 ring-[color:var(--accent-soft)]',
    error: 'border-[#ffd9dd] bg-[#fff7f8]',
    disabled: 'border-transparent bg-[#f2f2f7] opacity-70'
  }

  return [
    'flex flex-wrap gap-2 rounded-[var(--radius-control)] border p-1 transition duration-[var(--duration-fast)]',
    stateClassMap[props.state]
  ]
})

function selectOption(value: string) {
  if (props.state === 'disabled') {
    return
  }

  model.value = value
}

function resolveTabId(value: string) {
  return props.idPrefix ? `${props.idPrefix}-tab-${value}` : undefined
}

function resolvePanelId(value: string) {
  return props.idPrefix ? `${props.idPrefix}-panel-${value}` : undefined
}

function setTabRef(
  element: Element | ComponentPublicInstance | null,
  index: number
) {
  if (element instanceof HTMLButtonElement) {
    tabRefs.value[index] = element
  }
}

async function handleKeydown(event: KeyboardEvent) {
  if (props.state === 'disabled') {
    return
  }

  if (
    event.key !== 'ArrowRight' &&
    event.key !== 'ArrowLeft' &&
    event.key !== 'Home' &&
    event.key !== 'End'
  ) {
    return
  }

  event.preventDefault()

  const currentIndex = props.options.findIndex((option) => option.value === activeValue.value)
  const nextIndex =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? props.options.length - 1
        : moveTabSelection(currentIndex, props.options.length, event.key === 'ArrowRight' ? 'next' : 'prev')
  const nextOption = props.options[nextIndex]

  if (!nextOption) {
    return
  }

  selectOption(nextOption.value)
  await nextTick()
  tabRefs.value[nextIndex]?.focus()
}
</script>

<template>
  <div
    :aria-label="props.ariaLabel"
    :class="containerClassName"
    aria-orientation="horizontal"
    role="tablist"
  >
    <button
      v-for="(option, index) in options"
      :key="option.value"
      :ref="(element) => setTabRef(element, index)"
      :aria-controls="resolvePanelId(option.value)"
      :aria-selected="activeValue === option.value"
      :data-testid="props.testIdPrefix ? `${props.testIdPrefix}-${option.value}` : undefined"
      :id="resolveTabId(option.value)"
      :tabindex="activeValue === option.value ? 0 : -1"
      :class="[
        'inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] px-4 py-2 text-[14px] transition duration-[var(--duration-fast)]',
        activeValue === option.value
          ? 'bg-[color:var(--surface-white)] font-semibold text-[color:var(--text-primary)] shadow-sm'
          : 'font-medium text-[color:var(--text-secondary)]'
      ]"
      :disabled="props.state === 'disabled'"
      role="tab"
      type="button"
      @click="selectOption(option.value)"
      @keydown="handleKeydown"
    >
      {{ option.label }}
    </button>
  </div>
</template>
