<script setup lang="ts">
import { computed, useId, useTemplateRef } from 'vue'

import type { InteractionState } from '@note/shared-types'

import Button from '@/components/ui/Button.vue'
import InlineFeedback from '@/components/ui/InlineFeedback.vue'
import LoadingCard from '@/components/ui/LoadingCard.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import TextInput from '@/components/ui/TextInput.vue'
import { politeInlineFeedbackA11y } from '@/components/ui/inline-feedback'
import { useAuthStore } from '@/stores/auth-store'

import DeleteNoteConfirmModal from './DeleteNoteConfirmModal.vue'
import { resolveOnlineNoteAuthorizationUiModel } from '../online-note'
import { useOnlineNote } from '../use-online-note'

const props = defineProps<{
  sid: string | null
}>()

const authStore = useAuthStore()
const feedbackBaseId = useId()
const primaryFeedbackId = `${feedbackBaseId}-primary-feedback`
const editKeyInputRef = useTemplateRef<{ focus: () => void }>('editKeyInput')
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
const wordCount = computed(() => draftContent.value.length)
const noteTitle = computed(() => `# ${viewModel.value.sid ?? 'invalid'}`)
const canShowObjectLayout = computed(() => authorizationUi.value.canShowEditor)
const showEncryptButton = computed(() => authorizationUi.value.shouldShowEditKeyInput)
const showFavoriteButton = computed(() => objectHeader.value?.showFavoriteButton)
const showDeleteButton = computed(() => objectHeader.value?.showDeleteButton)

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

function handleFocusEditKey() {
  editKeyInputRef.value?.focus()
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-[45rem] flex-col gap-4 pt-16">
    <div v-if="viewModel.status === 'loading'" class="grid gap-3">
      <InlineFeedback
        title="正在读取在线便签"
        description="我们正在根据当前 sid 拉取该在线便签的最新已保存内容。"
        tone="info"
        state="focus"
        v-bind="politeInlineFeedbackA11y"
      />
      <div class="max-w-[26.25rem] rounded-[var(--radius-panel)] bg-[color:var(--panel-bg)] px-6 py-6 shadow-[var(--panel-shadow)]">
        <p class="m-0 text-xl font-semibold text-[color:var(--text-primary)]">正在读取在线便签</p>
        <p class="sr-only">{{ viewModel.sid }}</p>
        <div class="mt-4">
          <LoadingCard state="focus" />
        </div>
      </div>
    </div>

    <div v-else-if="canShowObjectLayout" class="grid gap-4">
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
          <StatusPill label="在线便签" tone="accent" />
          <span class="text-[12px] font-medium text-[color:var(--text-secondary)]">字数 {{ wordCount }}</span>
        </div>
        <div class="sr-only">
          <span>{{ viewModel.title }}</span>
          <span v-if="objectHeader">{{ objectHeader.shareStatusLabel }}</span>
          <span v-if="objectHeader">{{ objectHeader.editStatusLabel }}</span>
          <span>{{ authorizationUi.modeBadgeLabel }}</span>
        </div>
      </div>

      <DeleteNoteConfirmModal
        :open="isDeleteConfirmOpen"
        :busy="objectHeader?.deleteButtonState === 'disabled'"
        @close="handleCloseDeleteConfirm"
        @confirm="handleConfirmDelete"
      />

      <InlineFeedback
        v-if="primaryFeedback"
        :class="primaryFeedback.tone === 'success' ? 'max-w-fit' : ''"
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
        title="遗失编辑密钥后将无法恢复编辑权"
        description="当前这次首次保存会把对象创建成共享编辑模式；如果你之后忘记这枚密钥，系统不会帮你找回匿名编辑权限。"
        tone="warning"
        state="default"
        v-bind="politeInlineFeedbackA11y"
      />

      <TextInput
        v-model="draftContent"
        hide-label
        label="正文"
        multiline
        :rows="14"
        :state="editorInputState"
        :placeholder="authorizationUi.editorPlaceholder"
      />

      <div class="flex flex-col gap-3 border-t border-[color:var(--panel-border)] pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-2">
          <Button
            v-if="showFavoriteButton"
            :aria-label="objectHeader?.favoriteButtonLabel"
            icon="star"
            :state="objectHeader?.favoriteButtonState"
            size="icon"
            variant="subtle"
            @click="handleFavoriteNote"
          >
            <span class="sr-only">{{ objectHeader?.favoriteButtonLabel }}</span>
          </Button>
          <Button
            aria-label="复制链接"
            icon="copy"
            :state="objectHeader?.copyButtonState"
            size="icon"
            variant="subtle"
            @click="handleCopyShareLink"
          >
            <span class="sr-only">{{ objectHeader?.copyButtonLabel }}</span>
          </Button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button
            v-if="showEncryptButton"
            aria-label="聚焦编辑密钥输入框"
            icon="lock"
            size="compact"
            variant="subtle"
            @click="handleFocusEditKey"
          >
            加密
          </Button>
          <Button
            :state="actionState"
            icon="save"
            size="compact"
            @click="handleSave"
          >
            <span>保存</span>
            <span class="sr-only">{{ authorizationUi.actionLabel }}</span>
            <span v-if="viewModel.status === 'available'" class="sr-only">保存更新</span>
          </Button>
          <Button
            v-if="showDeleteButton"
            aria-label="删除便签"
            icon="trash"
            :state="objectHeader?.deleteButtonState"
            data-testid="note-delete-trigger"
            size="compact"
            variant="danger"
            @click="handleOpenDeleteConfirm"
          >
            删除
          </Button>
        </div>
      </div>

      <TextInput
        v-if="authorizationUi.shouldShowEditKeyInput"
        ref="editKeyInput"
        v-model="editKey"
        hide-label
        :label="authorizationUi.editKeyLabel"
        type="password"
        auto-complete="off"
        :state="editKeyInputState"
        placeholder="输入编辑密钥"
        :described-by="editKeyDescribedBy"
      />
    </div>

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
