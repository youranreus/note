<script setup lang="ts">
import { computed } from 'vue'

import type { InteractionState } from '@note/shared-types'

import Button from '@/components/ui/Button.vue'
import InlineFeedback from '@/components/ui/InlineFeedback.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import TextInput from '@/components/ui/TextInput.vue'

import { useLocalNote } from '../use-local-note'

const props = defineProps<{
  sid: string | null
}>()

const { viewModel, draftContent, saveState, primaryFeedback, objectHeader, saveNote } = useLocalNote(
  computed(() => props.sid)
)

const canEdit = computed(() => viewModel.value.status === 'ready')

const editorInputState = computed<InteractionState>(() => {
  if (!canEdit.value || saveState.value === 'saving') {
    return 'disabled'
  }

  if (saveState.value === 'save-error') {
    return 'error'
  }

  return 'focus'
})

const actionState = computed<InteractionState>(() => {
  if (!canEdit.value || saveState.value === 'saving') {
    return 'disabled'
  }

  return 'default'
})
const wordCount = computed(() => draftContent.value.length)
const noteTitle = computed(() => `# ${viewModel.value.sid ?? 'invalid'}`)

function handleSave() {
  void saveNote()
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-[45rem] flex-col gap-4 pt-16">
    <div v-if="canEdit" class="grid gap-4">
      <div class="grid gap-3">
        <h1 class="m-0 break-all text-[32px] font-bold leading-[1.1] text-[color:var(--text-primary)]">
          {{ noteTitle }}
        </h1>
        <div class="flex flex-wrap items-center gap-2">
          <StatusPill
            v-if="objectHeader"
            :label="objectHeader.saveStatusLabel"
            :tone="objectHeader.saveStatusTone"
          />
          <StatusPill label="本地便签" tone="accent" />
          <span class="text-[12px] font-medium text-[color:var(--text-secondary)]">字数 {{ wordCount }}</span>
        </div>
        <div class="sr-only">
          <span>本地模式</span>
          <span v-if="objectHeader">{{ objectHeader.boundaryStatusLabel }}</span>
        </div>
      </div>

      <InlineFeedback
        v-if="primaryFeedback"
        :class="primaryFeedback.tone === 'success' ? 'max-w-fit' : ''"
        :title="primaryFeedback.title"
        :description="primaryFeedback.description"
        :tone="primaryFeedback.tone"
        :state="primaryFeedback.state"
      />

      <TextInput
        v-model="draftContent"
        hide-label
        label="正文"
        multiline
        :rows="14"
        :state="editorInputState"
        placeholder="在这里开始记录你的想法..."
      />

      <div class="flex flex-wrap items-center justify-end gap-2 border-t border-[color:var(--panel-border)] pt-3">
        <Button :state="actionState" icon="save" size="compact" variant="primary" @click="handleSave">
          <span>保存</span>
          <span class="sr-only">保存到本地</span>
        </Button>
      </div>
    </div>

    <InlineFeedback
      v-else
      :title="primaryFeedback?.title ?? viewModel.title"
      :description="primaryFeedback?.description ?? viewModel.description"
      :tone="viewModel.status === 'invalid-sid' ? 'warning' : 'danger'"
      :state="viewModel.status === 'invalid-sid' ? 'default' : 'error'"
    />
  </div>
</template>
