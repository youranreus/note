<script setup lang="ts">
import { shallowRef } from 'vue'
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
const sidDraft = shallowRef('')

function refreshFallbackSidIfNeeded(value: string) {
  if (normalizeEntrySid(value) !== '') {
    return
  }

  fallbackSid.value = generateEntrySid()
}

function handleDraftUpdate(value: string) {
  sidDraft.value = value
  refreshFallbackSidIfNeeded(value)
}

async function navigateToMode(mode: NoteMode) {
  const { sid, nextFallbackSid } = resolveEntrySid(sidDraft.value, fallbackSid.value)

  sidDraft.value = ''
  fallbackSid.value = nextFallbackSid

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
    :model-value="sidDraft"
    @start-local="handleLocalStart"
    @submit-online="handleOnlineSubmit"
    @update:model-value="handleDraftUpdate"
  />
</template>
