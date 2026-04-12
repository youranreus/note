<script setup lang="ts">
import { computed, nextTick, shallowRef, useId, useTemplateRef, watch } from 'vue'

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

const modalId = useId()
const titleId = computed(() => `modal-title-${modalId}`)
const descriptionId = computed(() => `modal-description-${modalId}`)
const panelRef = useTemplateRef<HTMLElement>('panel')
const lastFocusedElement = shallowRef<HTMLElement | null>(null)
const sizeClassMap = {
  sm: 'max-w-[24rem]',
  md: 'max-w-[30rem]',
  lg: 'max-w-[40rem]'
} as const

function getFocusableElements() {
  if (!panelRef.value) {
    return []
  }

  return Array.from(
    panelRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.getAttribute('data-modal-close-icon') !== 'true'
  )
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
  <Transition name="modal">
    <div
      v-if="open"
      class="modal-shell fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6 supports-[backdrop-filter]:backdrop-blur-[10px] sm:px-6 sm:py-8"
      data-testid="modal-overlay"
      @click.self="handleClose"
    >
      <section
        ref="panel"
        :aria-describedby="descriptionId"
        :aria-labelledby="titleId"
        :data-testid="dialogTestId || undefined"
        :class="[
          'modal-panel relative w-full max-h-[calc(100vh-3rem)] overflow-y-auto rounded-[calc(var(--radius-panel)+4px)] border border-[color:var(--control-border)] bg-[color:var(--surface-white)] p-5 shadow-[var(--modal-shadow)] outline-none sm:max-h-[calc(100vh-4rem)] sm:p-6',
          sizeClassMap[props.size],
          state === 'focus' ? 'ring-2 ring-[color:var(--accent-soft)]' : '',
          state === 'error' ? 'ring-2 ring-[#ffe2e6]' : '',
          state === 'disabled' ? 'opacity-70' : ''
        ]"
        aria-modal="true"
        role="dialog"
        tabindex="-1"
        @keydown="handleKeydown"
      >
        <Button
          :aria-label="closeLabel"
          class="absolute right-3 top-3"
          data-modal-close-icon="true"
          icon="close"
          size="icon"
          tabindex="-1"
          type="button"
          variant="subtle"
          @click="handleClose"
        />

        <div class="pr-12">
          <h3 :id="titleId" class="m-0 text-[22px] font-semibold tracking-[-0.02em] text-[color:var(--text-primary)]">
            {{ title }}
          </h3>
          <p :id="descriptionId" class="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
            {{ description }}
          </p>
        </div>

        <div class="mt-5">
          <slot />
        </div>

        <div class="mt-5 flex flex-wrap justify-end gap-2 border-t border-[color:var(--control-border)] pt-4">
          <slot name="actions">
            <Button type="button" variant="secondary" @click="handleClose">
              {{ closeLabel }}
            </Button>
          </slot>
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.modal-shell {
  background: var(--overlay-bg);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--duration-normal) cubic-bezier(0.22, 1, 0.36, 1);
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition:
    transform var(--duration-normal) cubic-bezier(0.22, 1, 0.36, 1),
    opacity var(--duration-normal) cubic-bezier(0.22, 1, 0.36, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  opacity: 0;
  transform: translateY(8px) scale(0.985);
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .modal-panel,
  .modal-leave-active .modal-panel {
    transition: none;
  }
}
</style>
