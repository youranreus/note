<script setup lang="ts">
import { computed, nextTick, shallowRef, watchEffect } from 'vue'
import type { ComponentPublicInstance } from 'vue'

import type { InteractionState } from '@note/shared-types'

import { moveTabSelection } from './segmented-tabs'

const props = withDefaults(
  defineProps<{
    options: Array<{ label: string; value: string }>
    state?: InteractionState
    testIdPrefix?: string
  }>(),
  {
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
    default: 'border-[color:var(--panel-border)] bg-white/60',
    focus: 'border-accent-300 bg-white ring-4 ring-accent-100',
    error: 'border-red-200 bg-red-50',
    disabled: 'border-transparent bg-ink-100 opacity-70'
  }

  return [
    'flex flex-wrap gap-2 rounded-[var(--radius-control)] border p-2 transition duration-[var(--duration-fast)]',
    stateClassMap[props.state]
  ]
})

function selectOption(value: string) {
  if (props.state === 'disabled') {
    return
  }

  model.value = value
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

  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
    return
  }

  event.preventDefault()

  const currentIndex = props.options.findIndex((option) => option.value === activeValue.value)
  const direction = event.key === 'ArrowRight' ? 'next' : 'prev'
  const nextIndex = moveTabSelection(currentIndex, props.options.length, direction)
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
  <div :class="containerClassName" role="tablist" aria-label="模式切换">
    <button
      v-for="(option, index) in options"
      :key="option.value"
      :ref="(element) => setTabRef(element, index)"
      :aria-selected="activeValue === option.value"
      :data-testid="props.testIdPrefix ? `${props.testIdPrefix}-${option.value}` : undefined"
      :tabindex="activeValue === option.value ? 0 : -1"
      :class="[
        'rounded-[calc(var(--radius-control)-0.35rem)] px-4 py-2 text-sm font-medium transition duration-[var(--duration-fast)]',
        activeValue === option.value ? 'bg-ink-900 text-white shadow-sm' : 'text-[color:var(--text-secondary)] hover:bg-white'
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
