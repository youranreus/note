<script setup lang="ts">
import { computed } from 'vue'

import type { InteractionState } from '@note/shared-types'

import Button from '@/components/ui/Button.vue'
import InlineFeedback from '@/components/ui/InlineFeedback.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import SurfaceCard from '@/components/ui/SurfaceCard.vue'
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

function handleSave() {
  void saveNote()
}
</script>

<template>
  <div class="grid gap-4">
    <SurfaceCard>
      <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">本地模式</p>
      <div class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="text-2xl font-semibold">SID: {{ viewModel.sid ?? 'invalid' }}</h2>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--text-secondary)]">
            {{ viewModel.description }}
          </p>
        </div>
        <StatusPill label="只保存在当前浏览器" tone="accent" />
      </div>
    </SurfaceCard>

    <SurfaceCard v-if="canEdit" state="focus">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">本地对象</p>
          <h3 class="mt-2 text-xl font-semibold">{{ viewModel.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
            本地便签用于当前浏览器里的轻量记录，不会进入在线分享、收藏、登录或远端数据库链路。
          </p>
        </div>
        <StatusPill label="本地模式" tone="accent" />
      </div>

      <div
        v-if="objectHeader"
        class="mt-5 rounded-[var(--radius-control)] border border-[color:var(--panel-border)] bg-white/70 p-4"
      >
        <div class="min-w-0">
          <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">本地对象头部</p>
          <h4 class="mt-2 break-all text-lg font-semibold">SID: {{ objectHeader.sid }}</h4>
          <p class="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
            {{ objectHeader.localStatusDescription }}
          </p>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-3">
          <div class="rounded-[var(--radius-control)] border border-[color:var(--panel-border)] bg-white/70 px-4 py-3">
            <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">保存状态</p>
            <div class="mt-2">
              <StatusPill :label="objectHeader.saveStatusLabel" :tone="objectHeader.saveStatusTone" />
            </div>
          </div>

          <div class="rounded-[var(--radius-control)] border border-[color:var(--panel-border)] bg-white/70 px-4 py-3">
            <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">本地状态</p>
            <div class="mt-2">
              <StatusPill :label="objectHeader.localStatusLabel" :tone="objectHeader.localStatusTone" />
            </div>
          </div>

          <div class="rounded-[var(--radius-control)] border border-[color:var(--panel-border)] bg-white/70 px-4 py-3">
            <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">在线边界</p>
            <div class="mt-2">
              <StatusPill
                :label="objectHeader.boundaryStatusLabel"
                :caption="objectHeader.boundaryStatusCaption"
                :tone="objectHeader.boundaryStatusTone"
              />
            </div>
          </div>
        </div>
      </div>

      <InlineFeedback
        v-if="primaryFeedback"
        class="mt-5"
        :title="primaryFeedback.title"
        :description="primaryFeedback.description"
        :tone="primaryFeedback.tone"
        :state="primaryFeedback.state"
      />

      <div class="mt-5 rounded-[var(--radius-control)] border border-[color:var(--panel-border)] bg-ink-50/60 p-4">
        <TextInput
          v-model="draftContent"
          label="正文"
          multiline
          :rows="14"
          :state="editorInputState"
          placeholder="在这里输入本地便签正文…"
          hint="只有点击“保存到本地”后，当前正文才会写入这个浏览器中以当前 sid 为键的本地存储。"
        />
      </div>

      <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="m-0 text-sm text-[color:var(--text-secondary)]">
          本地便签不会变成可分享的在线对象；如果你需要固定链接分享，请回到首页选择在线便签。
        </p>
        <Button :state="actionState" leading-label="local" variant="secondary" @click="handleSave">
          保存到本地
        </Button>
      </div>
    </SurfaceCard>

    <InlineFeedback
      v-else
      :title="primaryFeedback?.title ?? viewModel.title"
      :description="primaryFeedback?.description ?? viewModel.description"
      :tone="viewModel.status === 'invalid-sid' ? 'warning' : 'danger'"
      :state="viewModel.status === 'invalid-sid' ? 'default' : 'error'"
    />
  </div>
</template>
