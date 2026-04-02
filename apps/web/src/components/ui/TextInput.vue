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
  }>(),
  {
    placeholder: '',
    state: 'default',
    hint: ''
  }
)

const model = defineModel<string>({ default: '' })

const inputClassName = computed(() => [
  'min-h-12 w-full rounded-[var(--radius-control)] border px-4 py-3 text-sm outline-none transition duration-[var(--duration-fast)]',
  textInputStateClasses[props.state]
])
</script>

<template>
  <label class="flex w-full flex-col gap-2">
    <span class="text-sm font-medium text-[color:var(--text-secondary)]">
      {{ label }}
    </span>
    <input
      v-model="model"
      :class="inputClassName"
      :disabled="props.state === 'disabled'"
      :placeholder="placeholder"
      type="text"
    />
    <span v-if="hint" class="text-xs text-[color:var(--text-muted)]">
      {{ hint }}
    </span>
  </label>
</template>
