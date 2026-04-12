<script setup lang="ts">
import { computed, nextTick, shallowRef, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'

import type { InteractionState } from '@note/shared-types'

import Button from '@/components/ui/Button.vue'
import LoadingCard from '@/components/ui/LoadingCard.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import TextInput from '@/components/ui/TextInput.vue'
import { useAuthStore } from '@/stores/auth-store'

import DeleteNoteConfirmModal from './DeleteNoteConfirmModal.vue'
import { resolveOnlineNoteAuthorizationUiModel } from '../online-note'
import { useOnlineNote } from '../use-online-note'

const props = defineProps<{
  sid: string | null
}>()

const authStore = useAuthStore()
const router = useRouter()
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
const isEditKeyExpanded = shallowRef(false)

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

  return 'default'
})

const actionState = computed<InteractionState>(() => {
  return saveState.value === 'saving' || !authorizationUi.value.canSave ? 'disabled' : 'default'
})

const editKeyInputState = computed<InteractionState>(() => {
  if (viewModel.value.editAccess === 'forbidden' || saveState.value === 'saving') {
    return 'disabled'
  }

  if (saveState.value === 'save-error') {
    return 'error'
  }

  return 'default'
})
const wordCount = computed(() => draftContent.value.length)
const noteTitle = computed(() => `# ${viewModel.value.sid ?? 'invalid'}`)
const loadingTitle = computed(() => `# ${viewModel.value.sid ?? '...'}`)
const loadingDescription = computed(
  () => authorizationUi.value.shellDescription || viewModel.value.description
)
const canShowObjectLayout = computed(() => authorizationUi.value.canShowEditor)
const showEncryptButton = computed(() => authorizationUi.value.shouldShowEditKeyInput)
const showFavoriteButton = computed(() => objectHeader.value?.showFavoriteButton)
const showDeleteButton = computed(() => objectHeader.value?.showDeleteButton)
const showEncryptedPill = computed(
  () =>
    viewModel.value.status === 'available' &&
    (viewModel.value.editAccess === 'key-required' || viewModel.value.editAccess === 'key-editable')
)
const shouldAutoExpandEditKey = computed(() => {
  if (!authorizationUi.value.shouldShowEditKeyInput) {
    return false
  }

  if (primaryFeedback.value?.describedField === 'editKey') {
    return true
  }

  return viewModel.value.editAccess === 'key-required' || viewModel.value.editAccess === 'key-editable'
})
const shouldRenderEditKeyInput = computed(
  () =>
    authorizationUi.value.shouldShowEditKeyInput &&
    (isEditKeyExpanded.value || shouldAutoExpandEditKey.value)
)
const editKeyButtonAriaLabel = computed(() => {
  if (shouldAutoExpandEditKey.value) {
    return '聚焦编辑密钥输入框'
  }

  return shouldRenderEditKeyInput.value ? '收起编辑密钥输入框' : '展开编辑密钥输入框'
})
const encryptButtonLabel = computed(() => {
  if (shouldAutoExpandEditKey.value) {
    return '编辑密钥'
  }

  return shouldRenderEditKeyInput.value ? '收起加密' : '加密'
})

function handleSave() {
  void saveNote()
}

function handleGoBack() {
  void router.push({ name: 'home' })
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

function handleToggleEditKey() {
  if (shouldAutoExpandEditKey.value) {
    nextTick(() => {
      editKeyInputRef.value?.focus()
    })
    return
  }

  const nextExpanded = !isEditKeyExpanded.value
  isEditKeyExpanded.value = nextExpanded

  if (nextExpanded) {
    nextTick(() => {
      editKeyInputRef.value?.focus()
    })
  }
}

watch(
  () => props.sid,
  () => {
    isEditKeyExpanded.value = false
  }
)

watch(
  () => primaryFeedback.value?.describedField,
  (nextField, previousField) => {
    if (nextField !== 'editKey' || nextField === previousField) {
      return
    }

    nextTick(() => {
      editKeyInputRef.value?.focus()
    })
  }
)

watch(shouldAutoExpandEditKey, (nextValue, previousValue) => {
  if (!nextValue || nextValue === previousValue || primaryFeedback.value?.describedField === 'editKey') {
    return
  }

  isEditKeyExpanded.value = false
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-[45rem] flex-col gap-4 pt-16">
    <div
      v-if="viewModel.status === 'loading'"
      aria-busy="true"
      aria-live="polite"
      class="grid gap-4"
      role="status"
    >
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
            {{ loadingTitle }}
          </h1>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <StatusPill :label="authorizationUi.modeBadgeLabel" tone="accent" />
          <StatusPill label="在线便签" tone="accent" />
          <span class="text-[12px] font-medium text-[color:var(--text-secondary)]">正在同步最新内容</span>
        </div>
        <p class="m-0 max-w-[42rem] text-sm leading-6 text-[color:var(--text-secondary)]">
          {{ loadingDescription }}
        </p>
        <div class="sr-only">
          <span>{{ viewModel.sid }}</span>
          <span>{{ viewModel.description }}</span>
        </div>
      </div>

      <div class="grid gap-3">
        <div
          class="overflow-hidden rounded-[var(--radius-panel)] border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)]/92 px-6 py-6 shadow-[var(--panel-shadow)]"
        >
          <div class="grid gap-5">
            <div class="flex flex-wrap items-center gap-2">
              <div
                class="h-6 w-20 animate-pulse rounded-full bg-[color:var(--accent-soft)] motion-reduce:animate-none"
              />
              <div
                class="h-6 w-24 animate-pulse rounded-full bg-[color:var(--subtle-fill)] motion-reduce:animate-none"
              />
              <div
                class="h-4 w-16 animate-pulse rounded-full bg-[color:var(--subtle-fill)]/90 motion-reduce:animate-none"
              />
            </div>

            <LoadingCard state="focus" />

            <div class="grid gap-3">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div
                  class="h-4 w-full max-w-[19rem] animate-pulse rounded-full bg-[color:var(--subtle-fill)] motion-reduce:animate-none"
                />
                <div class="flex items-center gap-2">
                  <div
                    class="h-10 w-10 animate-pulse rounded-[var(--radius-control)] bg-[color:var(--subtle-fill)] motion-reduce:animate-none"
                  />
                  <div
                    class="h-10 w-10 animate-pulse rounded-[var(--radius-control)] bg-[color:var(--subtle-fill)] motion-reduce:animate-none"
                  />
                  <div
                    class="h-10 w-24 animate-pulse rounded-[var(--radius-control)] bg-[color:var(--accent-soft)] motion-reduce:animate-none"
                  />
                </div>
              </div>
              <div
                class="h-11 w-full max-w-[22rem] animate-pulse rounded-[var(--radius-control)] bg-[color:var(--subtle-fill)]/95 motion-reduce:animate-none"
              />
            </div>
          </div>
        </div>

        <p class="m-0 text-[12px] leading-5 text-[color:var(--text-muted)]">
          先展示最近一次成功保存的版本；读取完成后，你会直接进入可编辑页面。
        </p>
      </div>
    </div>

    <div v-else-if="canShowObjectLayout" class="grid gap-4">
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
          <StatusPill label="在线便签" tone="accent" />
          <StatusPill v-if="showEncryptedPill" label="已加密" tone="warning" />
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
        :sid="viewModel.sid"
        @close="handleCloseDeleteConfirm"
        @confirm="handleConfirmDelete"
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

      <div class="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
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
            :aria-label="editKeyButtonAriaLabel"
            data-testid="toggle-edit-key"
            icon="lock"
            size="compact"
            variant="subtle"
            @click="handleToggleEditKey"
          >
            {{ encryptButtonLabel }}
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
        v-show="shouldRenderEditKeyInput"
        ref="editKeyInput"
        v-model="editKey"
        hide-label
        :label="authorizationUi.editKeyLabel"
        type="password"
        auto-complete="off"
        :hint="authorizationUi.editKeyHint"
        :state="editKeyInputState"
        placeholder="输入编辑密钥"
      />
    </div>

    <div
      v-else
      class="max-w-[36rem] rounded-[var(--radius-panel)] bg-[color:var(--panel-bg)] px-6 py-6 shadow-[var(--panel-shadow)]"
    >
      <p class="m-0 text-xl font-semibold text-[color:var(--text-primary)]">
        {{ viewModel.title }}
      </p>
      <p class="mt-3 mb-0 text-sm leading-6 text-[color:var(--text-secondary)]">
        {{ viewModel.description }}
      </p>
    </div>
  </div>
</template>
