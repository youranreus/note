<script setup lang="ts">
import { computed, useId } from 'vue'

import type { InteractionState } from '@note/shared-types'

import { textInputStateClasses } from './state-presets'

const props = withDefaults(
  defineProps<{
    id?: string
    label: string
    placeholder?: string
    state?: InteractionState
    hint?: string
    describedBy?: string
    type?: string
    autoComplete?: string
    autoCapitalize?: string
    spellcheck?: boolean
    multiline?: boolean
    rows?: number
    inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
    enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send'
  }>(),
  {
    id: undefined,
    placeholder: '',
    state: 'default',
    hint: '',
    describedBy: '',
    type: 'text',
    autoComplete: 'off',
    autoCapitalize: 'none',
    spellcheck: false,
    multiline: false,
    rows: 10,
    inputMode: undefined,
    enterKeyHint: undefined
  }
)

const model = defineModel<string>({ default: '' })
const baseId = useId()

const inputId = computed(() => props.id ?? `text-input-${baseId}`)
const hintId = computed(() => (props.hint ? `${inputId.value}-hint` : null))
const describedByValue = computed(() => {
  const ids = [hintId.value, props.describedBy.trim() || null].filter(
    (value): value is string => Boolean(value)
  )

  return ids.length > 0 ? ids.join(' ') : undefined
})

const fieldClassName = computed(() => [
  'w-full rounded-[var(--radius-control)] border px-4 py-3 text-sm outline-none transition duration-[var(--duration-fast)]',
  props.multiline ? 'min-h-48 resize-y leading-7' : 'min-h-12',
  textInputStateClasses[props.state]
])
</script>

<template>
  <label class="flex w-full flex-col gap-2">
    <span class="text-sm font-medium text-[color:var(--text-secondary)]">
      {{ label }}
    </span>

    <textarea
      v-if="props.multiline"
      v-model="model"
      :id="inputId"
      :aria-describedby="describedByValue"
      :aria-invalid="props.state === 'error' ? 'true' : undefined"
      :autocapitalize="props.autoCapitalize"
      :autocomplete="props.autoComplete"
      :class="fieldClassName"
      :disabled="props.state === 'disabled'"
      :enterkeyhint="props.enterKeyHint"
      :placeholder="props.placeholder"
      :rows="props.rows"
      :spellcheck="props.spellcheck"
    />

    <input
      v-else
      v-model="model"
      :id="inputId"
      :aria-describedby="describedByValue"
      :aria-invalid="props.state === 'error' ? 'true' : undefined"
      :autocapitalize="props.autoCapitalize"
      :autocomplete="props.autoComplete"
      :class="fieldClassName"
      :disabled="props.state === 'disabled'"
      :enterkeyhint="props.enterKeyHint"
      :inputmode="props.inputMode"
      :placeholder="props.placeholder"
      :spellcheck="props.spellcheck"
      :type="props.type"
    />

    <span v-if="hint" :id="hintId ?? undefined" class="text-xs text-[color:var(--text-muted)]">
      {{ hint }}
    </span>
  </label>
</template>
