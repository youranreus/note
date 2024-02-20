<template>
  <n-space vertical>
    <n-scrollbar :style="scrollStyle" trigger="none">
      <n-list hoverable clickable>
        <n-list-item v-for="note in notes" :key="note.id">
          <n-thing :title="note.sid" content-style="margin-top: 10px;">
            <template #description>
              <n-space size="small" style="margin-top: 4px">
                <n-tag :bordered="false" type="info" size="small">
                  #{{ note.id }}
                </n-tag>
                <n-tag :bordered="false" type="info" size="small">
                  {{ note.locked ? '已加密' : '未加密' }}
                </n-tag>
              </n-space>
            </template>
          </n-thing>
        </n-list-item>
      </n-list>
    </n-scrollbar>
    <n-space justify="end">
      <n-pagination v-model:page="computedPage" :page-size="pagination.limit" :item-count="pagination.total" :page-slot="7" />
    </n-space>
  </n-space>
</template>
<script setup lang="ts">
import type { MemoData, MemoRes, PaginationData } from '~/types';

const props = defineProps<{
  notes: MemoData[] | MemoRes[];
  pagination: PaginationData;
  scrollStyle?: string;
}>()

const emit = defineEmits<{
  (e: 'update:pagination', val: PaginationData): void;
}>()

const computedPage = computed({
  get() {
    return props.pagination.page
  },
  set(val) {
    emit('update:pagination', {
      ...props.pagination,
      page: val,
    })
  },
})
</script>