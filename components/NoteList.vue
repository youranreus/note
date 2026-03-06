<template>
  <div>
    <!-- 加载中 -->
    <div v-if="loading" class="flex justify-center py-10">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-xl" style="color: var(--color-text-secondary);" />
    </div>

    <!-- 空状态 -->
    <div v-else-if="!notes.length" class="flex flex-col items-center py-10 gap-2">
      <div class="text-3xl">🗒️</div>
      <p class="text-sm" style="color: var(--color-text-secondary);">没有便签</p>
    </div>

    <!-- 列表 -->
    <div v-else class="space-y-1">
      <div
        v-for="note in notes"
        :key="note.id"
        class="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
        style="border: 1px solid transparent;"
        @mouseenter="(e: any) => e.currentTarget.style.background = 'var(--color-bg-muted)'"
        @mouseleave="(e: any) => e.currentTarget.style.background = 'transparent'"
        @click="navigate(note.sid)"
      >
        <div class="flex-1 min-w-0">
          <div class="text-sm font-mono truncate" style="color: var(--color-text-primary);">
            {{ note.sid }}
          </div>
          <div class="text-xs mt-0.5 truncate" style="color: var(--color-text-secondary);">
            {{ note.content || '（空）' }}
          </div>
        </div>
        <div class="flex items-center gap-1.5 ml-3 shrink-0">
          <span
            v-if="note.locked"
            class="text-xs px-1.5 py-0.5 rounded"
            style="background: #fce8e8; color: var(--color-error);"
          >
            已加密
          </span>
          <UIcon name="i-heroicons-chevron-right" class="text-sm" style="color: var(--color-text-secondary);" />
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="pagination.total > pagination.limit" class="flex justify-end pt-3">
      <UPagination
        :model-value="pagination.page"
        :total="pagination.total"
        :page-size="pagination.limit"
        size="sm"
        @update:model-value="(v: number) => emit('update:pagination', { ...pagination, page: v })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { NoteType, type MemoRes, type PaginationData } from '~/types'

const props = defineProps<{
  notes: MemoRes[]
  pagination: PaginationData
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:pagination', val: PaginationData): void
}>()

const router = useRouter()

const navigate = (sid: string) => {
  router.push({ name: 'NoteDetail', params: { type: NoteType.ONLINE, id: sid } })
}
</script>
