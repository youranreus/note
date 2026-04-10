<script setup lang="ts">
import { computed, useId } from 'vue'

import type { InteractionState } from '@note/shared-types'

import Button from '@/components/ui/Button.vue'
import InlineFeedback from '@/components/ui/InlineFeedback.vue'
import LoadingCard from '@/components/ui/LoadingCard.vue'
import SurfaceCard from '@/components/ui/SurfaceCard.vue'
import TextInput from '@/components/ui/TextInput.vue'
import { politeInlineFeedbackA11y } from '@/components/ui/inline-feedback'
import { useAuthStore } from '@/stores/auth-store'

import NoteObjectHeader from './NoteObjectHeader.vue'
import DeleteNoteConfirmModal from './DeleteNoteConfirmModal.vue'
import { resolveOnlineNoteAuthorizationUiModel } from '../online-note'
import { useOnlineNote } from '../use-online-note'

const props = defineProps<{
  sid: string | null
}>()

const authStore = useAuthStore()
const feedbackBaseId = useId()
const primaryFeedbackId = `${feedbackBaseId}-primary-feedback`
const {
  viewModel,
  draftContent,
  editKey,
  saveState,
  primaryFeedback,
  objectHeader,
  isDeleteConfirmOpen,
  saveNote,
  copyShareLink,
  favoriteNote,
  openDeleteConfirm,
  closeDeleteConfirm,
  confirmDelete
} = useOnlineNote(computed(() => props.sid))

const authorizationUi = computed(() =>
  resolveOnlineNoteAuthorizationUiModel({
    viewStatus: viewModel.value.status,
    editAccess: viewModel.value.editAccess,
    authStatus: authStore.status,
    hasEditKeyValue: editKey.value.trim() !== ''
  })
)

const editorInputState = computed<InteractionState>(() => {
  if (!authorizationUi.value.canSave) {
    return 'disabled'
  }

  if (saveState.value === 'saving') {
    return 'disabled'
  }

  if (saveState.value === 'save-error') {
    return 'error'
  }

  return 'focus'
})

const actionState = computed<InteractionState>(() => {
  return saveState.value === 'saving' || !authorizationUi.value.canSave ? 'disabled' : 'default'
})

const feedbackTone = computed(() => {
  return viewModel.value.status === 'deleted' || viewModel.value.status === 'error'
    ? 'danger'
    : 'warning'
})

const feedbackState = computed(() => {
  return viewModel.value.status === 'error' ? 'error' : 'default'
})

const editKeyInputState = computed<InteractionState>(() => {
  if (viewModel.value.editAccess === 'forbidden' || saveState.value === 'saving') {
    return 'disabled'
  }

  if (saveState.value === 'save-error') {
    return 'error'
  }

  return 'focus'
})

const editKeyDescribedBy = computed(() =>
  primaryFeedback.value?.describedField === 'editKey' ? primaryFeedbackId : undefined
)

function handleSave() {
  void saveNote()
}

function handleCopyShareLink() {
  void copyShareLink()
}

function handleFavoriteNote() {
  void favoriteNote()
}

function handleOpenDeleteConfirm() {
  openDeleteConfirm()
}

function handleCloseDeleteConfirm() {
  closeDeleteConfirm()
}

function handleConfirmDelete() {
  void confirmDelete()
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
            {{ authorizationUi.shellDescription }}
          </p>
        </div>
        <div class="rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700">
          {{ authorizationUi.modeBadgeLabel }}
        </div>
      </div>
    </SurfaceCard>

    <div v-if="viewModel.status === 'loading'" class="grid gap-3">
      <InlineFeedback
        title="正在读取在线便签"
        description="我们正在根据当前 sid 拉取该在线便签的最新已保存内容。"
        tone="info"
        state="focus"
        v-bind="politeInlineFeedbackA11y"
      />
      <LoadingCard state="focus" />
    </div>

    <SurfaceCard v-else-if="authorizationUi.canShowEditor" state="focus">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">对象内容</p>
          <h3 class="mt-2 text-xl font-semibold">{{ viewModel.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
            {{ viewModel.description }}
          </p>
        </div>
        <div
          class="rounded-full border border-[color:var(--panel-border)] bg-white/80 px-3 py-1 text-xs text-[color:var(--text-secondary)]"
        >
          {{ saveState === 'saving' ? '保存中' : saveState === 'saved' ? '已保存' : saveState === 'save-error' ? '保存失败' : '编辑中' }}
        </div>
      </div>

      <NoteObjectHeader
        v-if="objectHeader"
        class="mt-5"
        :model="objectHeader"
        @copy="handleCopyShareLink"
        @favorite="handleFavoriteNote"
        @delete="handleOpenDeleteConfirm"
      />

      <DeleteNoteConfirmModal
        :open="isDeleteConfirmOpen"
        :busy="objectHeader?.deleteButtonState === 'disabled'"
        @close="handleCloseDeleteConfirm"
        @confirm="handleConfirmDelete"
      />

      <InlineFeedback
        v-if="primaryFeedback"
        class="mt-5"
        :id="primaryFeedbackId"
        :title="primaryFeedback.title"
        :description="primaryFeedback.description"
        :tone="primaryFeedback.tone"
        :state="primaryFeedback.state"
        :role="primaryFeedback.role ?? politeInlineFeedbackA11y.role"
        :aria-live="primaryFeedback.ariaLive ?? politeInlineFeedbackA11y.ariaLive"
        :aria-atomic="primaryFeedback.ariaAtomic ?? politeInlineFeedbackA11y.ariaAtomic"
      />

      <InlineFeedback
        v-if="authorizationUi.shouldShowEditKeyRisk"
        class="mt-5"
        title="遗失编辑密钥后将无法恢复编辑权"
        description="当前这次首次保存会把对象创建成共享编辑模式；如果你之后忘记这枚密钥，系统不会帮你找回匿名编辑权限。"
        tone="warning"
        state="default"
        v-bind="politeInlineFeedbackA11y"
      />

      <div class="mt-5 rounded-[var(--radius-control)] border border-[color:var(--panel-border)] bg-ink-50/60 p-4">
        <TextInput
          v-model="draftContent"
          label="正文"
          multiline
          :rows="14"
          :state="editorInputState"
          :placeholder="authorizationUi.editorPlaceholder"
          :hint="authorizationUi.editorHint"
        />

        <div v-if="authorizationUi.shouldShowEditKeyInput" class="mt-4">
          <TextInput
            v-model="editKey"
            :label="authorizationUi.editKeyLabel"
            type="password"
            auto-complete="off"
            :state="editKeyInputState"
            placeholder="输入编辑密钥…"
            :hint="authorizationUi.editKeyHint"
            :described-by="editKeyDescribedBy"
          />
        </div>
      </div>

      <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="m-0 text-sm text-[color:var(--text-secondary)]">
          保存不会改变当前链接；后续再次打开同一 `sid` 时会读取这里最后一次成功保存的内容。
        </p>
        <Button :state="actionState" leading-label="online" @click="handleSave">
          {{ authorizationUi.actionLabel }}
        </Button>
      </div>
    </SurfaceCard>

    <InlineFeedback
      v-else
      :title="viewModel.title"
      :description="viewModel.description"
      :tone="feedbackTone"
      :state="feedbackState"
      v-bind="politeInlineFeedbackA11y"
    />
  </div>
</template>
