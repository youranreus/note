<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'

import type { NoteMode } from '@note/shared-types'

import EntryShell from './components/EntryShell.vue'
import {
  createEntryLocation,
  generateEntrySid,
  normalizeEntrySid,
  resolveEntrySid
} from './entry-sid'

const router = useRouter()

const fallbackSid = shallowRef(generateEntrySid())
const sidDraft = shallowRef(fallbackSid.value)
const isDraftAutoPrepared = shallowRef(true)

const isUsingFallbackSid = computed(() => {
  if (isDraftAutoPrepared.value) {
    return true
  }

  return normalizeEntrySid(sidDraft.value) === ''
})
const visibleSid = computed(() =>
  isUsingFallbackSid.value ? fallbackSid.value : normalizeEntrySid(sidDraft.value)
)

const helperText = computed(() =>
  isUsingFallbackSid.value
    ? `当前已为你准备固定入口 ID：${fallbackSid.value}。直接进入时会使用它。`
    : `当前会进入固定入口 ID：${visibleSid.value}。你可以继续修改，也可以直接进入。`
)

const infoDescription = computed(() =>
  isUsingFallbackSid.value
    ? '你不需要先手动输入 ID。直接提交时，系统会使用当前准备好的固定入口。'
    : '已输入的 sid 会被直接沿用，后续在线读取、本地进入和分享都围绕这个标识展开。'
)

const infoTitle = computed(() =>
  isUsingFallbackSid.value ? '已自动准备好固定入口' : '将使用当前输入的固定入口'
)

function refreshFallbackSidIfNeeded(value: string) {
  if (normalizeEntrySid(value) !== '') {
    return
  }

  fallbackSid.value = generateEntrySid()
}

function handleDraftUpdate(value: string) {
  sidDraft.value = value
  isDraftAutoPrepared.value = normalizeEntrySid(value) === ''
  refreshFallbackSidIfNeeded(value)
}

async function navigateToMode(mode: NoteMode) {
  const { sid, nextFallbackSid } = resolveEntrySid(sidDraft.value, fallbackSid.value)

  sidDraft.value = sid
  fallbackSid.value = nextFallbackSid
  isDraftAutoPrepared.value = false

  await router.push(createEntryLocation(mode, sid))
}

function handleOnlineSubmit() {
  return navigateToMode('online')
}

function handleLocalStart() {
  return navigateToMode('local')
}
</script>

<template>
  <EntryShell
    :helper-text="helperText"
    :info-description="infoDescription"
    :info-title="infoTitle"
    :model-value="sidDraft"
    @start-local="handleLocalStart"
    @submit-online="handleOnlineSubmit"
    @update:model-value="handleDraftUpdate"
  />
</template>
