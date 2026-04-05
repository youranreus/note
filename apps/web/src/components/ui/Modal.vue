<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import type { InteractionState } from '@note/shared-types'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description: string
    closeLabel?: string
    state?: InteractionState
  }>(),
  {
    closeLabel: '关闭',
    state: 'default'
  }
)

const emit = defineEmits<{
  close: []
}>()

const titleId = computed(() => `modal-title-${props.title.length}-${props.description.length}`)
const descriptionId = computed(() => `modal-description-${props.title.length}-${props.description.length}`)
const panelRef = ref<HTMLElement | null>(null)
const lastFocusedElement = ref<HTMLElement | null>(null)

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
      panelRef.value?.focus()
      return
    }

    if (wasOpen) {
      await nextTick()
      restoreFocus()
    }
  }
)
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/45 px-4 py-8 backdrop-blur-sm"
    data-testid="modal-overlay"
    @click.self="handleClose"
  >
    <section
      ref="panelRef"
      :aria-describedby="descriptionId"
      :aria-labelledby="titleId"
      :class="[
        'w-full max-w-lg rounded-[var(--radius-panel)] border bg-white p-6 shadow-[var(--panel-shadow)]',
        state === 'focus' ? 'border-accent-300 ring-4 ring-accent-100' : '',
        state === 'error' ? 'border-red-200 bg-red-50' : '',
        state === 'disabled' ? 'opacity-70' : 'border-[color:var(--panel-border)]'
      ]"
      aria-modal="true"
      role="dialog"
      tabindex="-1"
      @keydown="handleKeydown"
    >
      <p class="m-0 text-sm uppercase tracking-[0.2em] text-[color:var(--text-muted)]">Modal</p>
      <h3 :id="titleId" class="mt-3 text-xl font-semibold">{{ title }}</h3>
      <p :id="descriptionId" class="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
        {{ description }}
      </p>
      <div class="mt-4">
        <slot />
      </div>
      <div class="mt-5 flex justify-end gap-3">
        <slot name="actions">
          <button
            class="rounded-[var(--radius-control)] bg-ink-900 px-4 py-2 text-sm font-semibold text-white"
            type="button"
            @click="handleClose"
          >
            {{ closeLabel }}
          </button>
        </slot>
      </div>
    </section>
  </div>
</template>
