<script setup lang="ts">
import { computed } from 'vue'

import type { InteractionState } from '@note/shared-types'

import { textInputStateClasses } from './state-presets'

const props = withDefaults(
  defineProps<{
    label: string
    placeholder?: string
    state?: InteractionState
    hint?: string
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
    placeholder: '',
    state: 'default',
    hint: '',
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

    <span v-if="hint" class="text-xs text-[color:var(--text-muted)]">
      {{ hint }}
    </span>
  </label>
</template>
