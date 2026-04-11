<script setup lang="ts">
import { computed, nextTick, shallowRef, useTemplateRef, watch } from 'vue'

import type { InteractionState } from '@note/shared-types'

import Button from './Button.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description: string
    closeLabel?: string
    dialogTestId?: string
    initialFocus?: 'dialog' | 'first-focusable' | 'active-tab'
    size?: 'sm' | 'md' | 'lg'
    state?: InteractionState
  }>(),
  {
    closeLabel: '关闭',
    dialogTestId: '',
    initialFocus: 'dialog',
    size: 'md',
    state: 'default'
  }
)

const emit = defineEmits<{
  close: []
}>()

const titleId = computed(() => `modal-title-${props.title.length}-${props.description.length}`)
const descriptionId = computed(() => `modal-description-${props.title.length}-${props.description.length}`)
const panelRef = useTemplateRef<HTMLElement>('panel')
const lastFocusedElement = shallowRef<HTMLElement | null>(null)
const sizeClassMap = {
  sm: 'max-w-[22.5rem]',
  md: 'max-w-[28rem]',
  lg: 'max-w-[38.75rem]'
} as const

function getFocusableElements() {
  if (!panelRef.value) {
    return []
  }

  return Array.from(
    panelRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true')
}

function getInitialFocusTarget() {
  const focusableElements = getFocusableElements()

  if (props.initialFocus === 'active-tab') {
    return (
      focusableElements.find(
        (element) =>
          element.getAttribute('role') === 'tab' &&
          element.getAttribute('aria-selected') === 'true'
      ) ??
      focusableElements[0] ??
      panelRef.value
    )
  }

  if (props.initialFocus === 'first-focusable') {
    return focusableElements[0] ?? panelRef.value
  }

  return panelRef.value
}

function restoreFocus() {
  lastFocusedElement.value?.focus()
}

function handleClose() {
  emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    handleClose()
    return
  }

  if (event.key !== 'Tab') {
    return
  }

  const focusableElements = getFocusableElements()

  if (focusableElements.length === 0) {
    event.preventDefault()
    panelRef.value?.focus()
    return
  }

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null

  if (event.shiftKey) {
    if (
      !activeElement ||
      activeElement === firstElement ||
      activeElement === panelRef.value ||
      !panelRef.value?.contains(activeElement)
    ) {
      event.preventDefault()
      lastElement.focus()
    }

    return
  }

  if (
    !activeElement ||
    activeElement === lastElement ||
    activeElement === panelRef.value ||
    !panelRef.value?.contains(activeElement)
  ) {
    event.preventDefault()
    firstElement.focus()
  }
}

watch(
  () => props.open,
  async (isOpen, wasOpen) => {
    if (isOpen) {
      lastFocusedElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
      await nextTick()
      getInitialFocusTarget()?.focus()
      return
    }

    if (wasOpen) {
      await nextTick()
      restoreFocus()
    }
  },
  {
    immediate: true
  }
)
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--overlay-bg)] px-4 py-8"
    data-testid="modal-overlay"
    @click.self="handleClose"
  >
    <section
      ref="panel"
      :aria-describedby="descriptionId"
      :aria-labelledby="titleId"
      :data-testid="dialogTestId || undefined"
      :class="[
        'w-full rounded-[var(--radius-panel)] bg-[color:var(--panel-bg)] p-6 shadow-[var(--panel-shadow)]',
        sizeClassMap[props.size],
        state === 'focus' ? 'ring-2 ring-[color:var(--accent-soft)]' : '',
        state === 'error' ? 'ring-2 ring-[#ffd9dd]' : '',
        state === 'disabled' ? 'opacity-70' : ''
      ]"
      aria-modal="true"
      role="dialog"
      tabindex="-1"
      @keydown="handleKeydown"
    >
      <h3 :id="titleId" class="m-0 text-[22px] font-semibold text-[color:var(--text-primary)]">{{ title }}</h3>
      <p :id="descriptionId" class="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
        {{ description }}
      </p>
      <div class="mt-4">
        <slot />
      </div>
      <div class="mt-5 flex justify-end gap-3">
        <slot name="actions">
          <Button type="button" variant="secondary" @click="handleClose">
            {{ closeLabel }}
          </Button>
        </slot>
      </div>
    </section>
  </div>
</template>
