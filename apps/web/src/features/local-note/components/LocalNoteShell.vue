<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import type { InteractionState } from '@note/shared-types'

import Button from '@/components/ui/Button.vue'
import InlineFeedback from '@/components/ui/InlineFeedback.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import TextInput from '@/components/ui/TextInput.vue'

import { useLocalNote } from '../use-local-note'

const props = defineProps<{
  sid: string | null
}>()
const router = useRouter()

const { viewModel, draftContent, saveState, primaryFeedback, objectHeader, saveNote } = useLocalNote(
  computed(() => props.sid)
)

const canEdit = computed(() => viewModel.value.status === 'ready')
const headerDescription = computed(
  () => objectHeader.value?.localStatusDescription ?? viewModel.value.description
)
const boundaryDescription = computed(() => {
  if (objectHeader.value) {
    return `${objectHeader.value.boundaryStatusLabel}，${objectHeader.value.boundaryStatusCaption}`
  }

  return '当前内容仅保存在这个浏览器中，不会自动同步到在线对象。'
})
const shouldShowErrorFeedback = computed(() => primaryFeedback.value?.state === 'error')

const editorInputState = computed<InteractionState>(() => {
  if (!canEdit.value || saveState.value === 'saving') {
    return 'disabled'
  }

  if (saveState.value === 'save-error') {
    return 'error'
  }

  return 'default'
})

const actionState = computed<InteractionState>(() => {
  if (!canEdit.value || saveState.value === 'saving') {
    return 'disabled'
  }

  return 'default'
})
const wordCount = computed(() => draftContent.value.length)
const noteTitle = computed(() => `# ${viewModel.value.sid ?? 'invalid'}`)

function handleGoBack() {
  void router.push({ name: 'home' })
}

function handleSave() {
  void saveNote()
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-[45rem] flex-col gap-4 pt-16">
    <div v-if="canEdit" class="grid gap-4">
      <div class="grid gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <Button
            aria-label="返回首页"
            data-testid="note-back-button"
            icon="back"
            size="compact"
            variant="subtle"
            @click="handleGoBack"
          >
            返回
          </Button>
          <h1 class="m-0 break-all text-[32px] font-bold leading-[1.1] text-[color:var(--text-primary)]">
            {{ noteTitle }}
          </h1>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <StatusPill
            v-if="objectHeader"
            :label="objectHeader.saveStatusLabel"
            :tone="objectHeader.saveStatusTone"
          />
          <StatusPill label="本地便签" tone="accent" />
          <span class="text-[12px] font-medium text-[color:var(--text-secondary)]">字数 {{ wordCount }}</span>
        </div>
        <p class="m-0 max-w-[42rem] text-sm leading-6 text-[color:var(--text-secondary)]">
          {{ headerDescription }}
        </p>
        <div class="sr-only">
          <span>本地模式</span>
          <span v-if="objectHeader">{{ objectHeader.boundaryStatusLabel }}</span>
          <span v-if="objectHeader">{{ objectHeader.boundaryStatusCaption }}</span>
        </div>
      </div>

      <InlineFeedback
        v-if="primaryFeedback && shouldShowErrorFeedback"
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

      <div class="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="m-0 text-[12px] font-medium text-[color:var(--text-secondary)]">
          {{ boundaryDescription }}
        </p>
        <Button :state="actionState" icon="save" size="compact" variant="primary" @click="handleSave">
          <span>保存</span>
          <span class="sr-only">保存到本地</span>
        </Button>
      </div>
    </div>

    <div
      v-else
      class="max-w-[36rem] rounded-[var(--radius-panel)] bg-[color:var(--panel-bg)] px-6 py-6 shadow-[var(--panel-shadow)]"
    >
      <p class="m-0 text-xl font-semibold text-[color:var(--text-primary)]">
        {{ primaryFeedback?.title ?? viewModel.title }}
      </p>
      <p class="mt-3 mb-0 text-sm leading-6 text-[color:var(--text-secondary)]">
        {{ primaryFeedback?.description ?? viewModel.description }}
      </p>
    </div>
  </div>
</template>
