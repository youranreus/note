<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'

import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingCard from '@/components/ui/LoadingCard.vue'
import TextInput from '@/components/ui/TextInput.vue'

import { useLocalNoteSummaries } from '../use-local-note-summaries'

const LOCAL_NOTES_PANEL_STORAGE_KEY = 'note:home:local-notes-expanded'

const emit = defineEmits<{
  openNote: [sid: string]
}>()

const {
  clearSearch,
  errorMessage,
  filteredItems,
  items,
  loadSummaries,
  loading,
  searchQuery,
  storageAvailable
} = useLocalNoteSummaries()

const isExpanded = shallowRef(resolveInitialExpanded())

const panelClassName = computed(() => [
  'overflow-hidden rounded-[var(--radius-panel)] border bg-[color:var(--panel-bg)] shadow-[var(--panel-shadow)] transition-[border-color,box-shadow,background-color] duration-[var(--duration-fast)]',
  isExpanded.value
    ? 'border-[color:var(--accent-soft)] shadow-[0_16px_40px_rgba(55,84,255,0.08)]'
    : 'border-[color:var(--control-border)]'
])

const bodyClassName = computed(() => [
  'grid transition-[grid-template-rows,opacity,margin] duration-[var(--duration-fast)] ease-out motion-reduce:transition-none',
  isExpanded.value ? 'mt-1 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'
])

const panelStatus = computed(() => {
  if (!isExpanded.value) {
    return items.value.length > 0 ? `最近 ${items.value.length} 条` : '点开后查看'
  }

  if (loading.value) {
    return '正在读取'
  }

  if (errorMessage.value) {
    return '读取失败'
  }

  if (filteredItems.value.length === 0 && searchQuery.value.trim() !== '') {
    return '没有匹配结果'
  }

  if (items.value.length === 0) {
    return '还没有本地内容'
  }

  return `${filteredItems.value.length} 条结果`
})

const listStateTitle = computed(() => {
  if (!storageAvailable.value) {
    return '当前环境不支持本地便签'
  }

  if (errorMessage.value) {
    return '本地便签列表暂时不可用'
  }

  if (searchQuery.value.trim() !== '' && filteredItems.value.length === 0) {
    return '没有找到匹配的本地便签'
  }

  return '还没有本地便签'
})

const listStateDescription = computed(() => {
  if (!storageAvailable.value) {
    return '这个浏览器当前无法提供 IndexedDB，本地便签列表不会在首页显示。'
  }

  if (errorMessage.value) {
    return errorMessage.value
  }

  if (searchQuery.value.trim() !== '') {
    return '可以试试搜索 sid 的一部分，或换一个摘要关键词。'
  }

  return '当你在这台设备里保存过本地便签后，这里会按最近更新时间列出来。'
})

const formattedItems = computed(() =>
  filteredItems.value.map((item) => ({
    ...item,
    meta: formatUpdatedAt(item.updatedAt),
    secondary: `SID ${item.sid} · ${item.contentLength} 字`
  }))
)

watch(
  isExpanded,
  (nextExpanded) => {
    writeExpandedPreference(nextExpanded)

    if (!nextExpanded) {
      clearSearch()
      return
    }

    void loadSummaries()
  },
  {
    immediate: true
  }
)

function resolveInitialExpanded() {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(LOCAL_NOTES_PANEL_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function writeExpandedPreference(value: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(LOCAL_NOTES_PANEL_STORAGE_KEY, value ? 'true' : 'false')
  } catch {
    // Ignore local preference persistence failures.
  }
}

function formatUpdatedAt(value: string) {
  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    return '最近保存'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(timestamp)
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function handleOpenNote(sid: string) {
  emit('openNote', sid)
}
</script>

<template>
  <section :class="panelClassName" data-testid="local-notes-panel">
    <button
      :aria-expanded="isExpanded ? 'true' : 'false'"
      class="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-[background-color] duration-[var(--duration-fast)] hover:bg-white/70"
      data-testid="local-notes-toggle"
      type="button"
      @click="toggleExpanded"
    >
      <div class="min-w-0">
        <p class="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
          快速回到本地内容
        </p>
        <div class="mt-1 flex items-baseline gap-2">
          <p class="m-0 text-sm font-semibold text-[color:var(--text-primary)]">本地便签</p>
          <p class="m-0 truncate text-xs text-[color:var(--text-secondary)]">
            {{ panelStatus }}
          </p>
        </div>
      </div>

      <span
        class="shrink-0 rounded-full bg-[color:var(--subtle-fill)] px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] text-[color:var(--text-secondary)]"
      >
        {{ isExpanded ? '收起' : '展开' }}
      </span>
    </button>

    <div :class="bodyClassName">
      <div class="overflow-hidden">
        <div class="grid gap-3 border-t border-[color:var(--control-border)] px-4 pb-4 pt-3.5">
          <TextInput
            v-model="searchQuery"
            data-testid="local-notes-search"
            hide-label
            input-mode="search"
            label="搜索本地便签"
            placeholder="搜索 sid 或摘要"
          />

          <LoadingCard v-if="loading" data-testid="local-notes-loading" />

          <div
            v-else-if="formattedItems.length > 0"
            class="max-h-[clamp(11rem,30vh,17rem)] space-y-2 overflow-y-auto pr-1"
            data-testid="local-notes-list"
          >
            <button
              v-for="item in formattedItems"
              :key="item.sid"
              class="flex w-full items-start justify-between gap-3 rounded-[var(--radius-control)] border border-[color:var(--control-border)] bg-white/70 px-4 py-3.5 text-left transition-[border-color,background-color,box-shadow] duration-[var(--duration-fast)] hover:border-[color:var(--accent-soft)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-soft)]"
              data-testid="local-note-item"
              type="button"
              @click="handleOpenNote(item.sid)"
            >
              <div class="min-w-0">
                <p class="m-0 break-words text-sm font-semibold text-[color:var(--text-primary)]">
                  {{ item.excerpt }}
                </p>
                <p class="mt-1 text-xs text-[color:var(--text-secondary)]">
                  {{ item.secondary }}
                </p>
              </div>

              <span
                class="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]"
              >
                {{ item.meta }}
              </span>
            </button>
          </div>

          <EmptyState
            v-else
            :description="listStateDescription"
            :title="listStateTitle"
            data-testid="local-notes-empty"
          />
        </div>
      </div>
    </div>
  </section>
</template>
