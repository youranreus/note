<script setup lang="ts">
import { computed } from 'vue'

import type { InteractionState } from '@note/shared-types'

import Button from '@/components/ui/Button.vue'
import InlineFeedback from '@/components/ui/InlineFeedback.vue'
import LoadingCard from '@/components/ui/LoadingCard.vue'
import SurfaceCard from '@/components/ui/SurfaceCard.vue'
import TextInput from '@/components/ui/TextInput.vue'

import { useOnlineNote } from '../use-online-note'

const props = defineProps<{
  sid: string | null
}>()

const { viewModel, draftContent, saveState, saveFeedback, saveNote } = useOnlineNote(
  computed(() => props.sid)
)

const canEdit = computed(() => {
  return viewModel.value.status === 'available' || viewModel.value.status === 'not-found'
})

const shellDescription = computed(() => {
  switch (viewModel.value.status) {
    case 'available':
      return '当前固定链接已经绑定到真实在线对象，后续保存会持续更新同一 sid 下的最新正文。'
    case 'loading':
      return '正在根据当前 sid 读取在线便签的最新已保存内容。'
    case 'not-found':
      return '当前链接已经成立，但还没有保存过正文。你可以直接开始输入并首次保存。'
    case 'deleted':
      return '当前链接曾关联在线便签，但该对象已经被删除。'
    case 'invalid-sid':
      return '路由缺少有效 sid，页面不会把空值或异常参数默默转成伪造对象。'
    default:
      return '读取当前在线对象时发生异常，请稍后刷新重试。'
  }
})

const modeBadgeLabel = computed(() => {
  if (viewModel.value.status === 'not-found') {
    return '待首次保存'
  }

  if (viewModel.value.status === 'available') {
    return '可持续更新'
  }

  if (viewModel.value.status === 'loading') {
    return '读取中'
  }

  return '异常态'
})

const objectStateLabel = computed(() => {
  switch (viewModel.value.status) {
    case 'available':
      return '已存在对象'
    case 'not-found':
      return '尚未创建'
    case 'loading':
      return '正在读取'
    case 'deleted':
      return '已删除'
    case 'invalid-sid':
      return 'sid 无效'
    default:
      return '读取失败'
  }
})

const saveStateLabel = computed(() => {
  switch (saveState.value) {
    case 'saving':
      return '保存中'
    case 'saved':
      return '已保存'
    case 'save-error':
      return '保存失败'
    default:
      return '尚未保存'
  }
})

const actionLabel = computed(() => {
  return viewModel.value.status === 'not-found' ? '首次保存' : '保存更新'
})

const editorInputState = computed<InteractionState>(() => {
  if (saveState.value === 'saving') {
    return 'disabled'
  }

  if (saveState.value === 'save-error') {
    return 'error'
  }

  return 'focus'
})

const actionState = computed<InteractionState>(() => {
  return saveState.value === 'saving' ? 'disabled' : 'default'
})

const feedbackTone = computed(() => {
  return viewModel.value.status === 'deleted' || viewModel.value.status === 'error'
    ? 'danger'
    : 'warning'
})

const feedbackState = computed(() => {
  return viewModel.value.status === 'error' ? 'error' : 'default'
})

const editorHint = computed(() => {
  if (viewModel.value.status === 'not-found') {
    return '首次保存会在当前 sid 下创建在线便签对象，后续继续沿用同一链接更新。'
  }

  return '当前正文始终以这个 sid 为边界；点击保存后会更新该固定链接下的最新版本。'
})

const editorPlaceholder = computed(() => {
  if (viewModel.value.status === 'not-found') {
    return '在这里输入第一版在线便签正文…'
  }

  return '继续编辑当前在线便签正文…'
})

function handleSave() {
  void saveNote()
}
</script>

<template>
  <div class="grid gap-4">
    <SurfaceCard>
      <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">在线模式</p>
      <div class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="text-2xl font-semibold">SID: {{ viewModel.sid ?? 'invalid' }}</h2>
          <p class="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--text-secondary)]">
            {{ shellDescription }}
          </p>
        </div>
        <div class="rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700">
          {{ modeBadgeLabel }}
        </div>
      </div>
    </SurfaceCard>

    <div v-if="viewModel.status === 'loading'" class="grid gap-3">
      <InlineFeedback
        title="正在读取在线便签"
        description="我们正在根据当前 sid 拉取该在线便签的最新已保存内容。"
        tone="info"
        state="focus"
      />
      <LoadingCard state="focus" />
    </div>

    <SurfaceCard v-else-if="canEdit" state="focus">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">对象内容</p>
          <h3 class="mt-2 text-xl font-semibold">{{ viewModel.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
            {{ viewModel.description }}
          </p>
        </div>
        <div class="rounded-full border border-[color:var(--panel-border)] bg-white/80 px-3 py-1 text-xs text-[color:var(--text-secondary)]">
          {{ saveStateLabel }}
        </div>
      </div>

      <div class="mt-5 grid gap-3 sm:grid-cols-3">
        <div class="rounded-[var(--radius-control)] border border-[color:var(--panel-border)] bg-white/70 px-4 py-3">
          <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">当前对象</p>
          <p class="mt-2 text-sm font-medium text-[color:var(--text-primary)]">{{ viewModel.sid }}</p>
        </div>
        <div class="rounded-[var(--radius-control)] border border-[color:var(--panel-border)] bg-white/70 px-4 py-3">
          <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">对象状态</p>
          <p class="mt-2 text-sm font-medium text-[color:var(--text-primary)]">{{ objectStateLabel }}</p>
        </div>
        <div class="rounded-[var(--radius-control)] border border-[color:var(--panel-border)] bg-white/70 px-4 py-3">
          <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">保存状态</p>
          <p class="mt-2 text-sm font-medium text-[color:var(--text-primary)]">{{ saveStateLabel }}</p>
        </div>
      </div>

      <InlineFeedback
        v-if="saveFeedback"
        class="mt-5"
        :title="saveFeedback.title"
        :description="saveFeedback.description"
        :tone="saveFeedback.tone"
        :state="saveFeedback.state"
      />

      <div class="mt-5 rounded-[var(--radius-control)] border border-[color:var(--panel-border)] bg-ink-50/60 p-4">
        <TextInput
          v-model="draftContent"
          label="正文"
          multiline
          :rows="14"
          :state="editorInputState"
          :placeholder="editorPlaceholder"
          :hint="editorHint"
        />
      </div>

      <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="m-0 text-sm text-[color:var(--text-secondary)]">
          保存不会改变当前链接；后续再次打开同一 `sid` 时会读取这里最后一次成功保存的内容。
        </p>
        <Button :state="actionState" leading-label="online" @click="handleSave">
          {{ actionLabel }}
        </Button>
      </div>
    </SurfaceCard>

    <InlineFeedback
      v-else
      :title="viewModel.title"
      :description="viewModel.description"
      :tone="feedbackTone"
      :state="feedbackState"
    />
  </div>
</template>
