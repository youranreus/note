<template>
  <n-space v-if="!loading" :style="{ height: `${height}px` }" vertical justify="center">
    <template v-if="pagination.total">
      <n-scrollbar :style="{ height: `${height - 36}px` }" trigger="none">
        <n-list hoverable clickable>
          <n-list-item v-for="note in notes" :key="note.id" @click="navigateNote(note.sid)">
            <n-thing :title="note.sid" content-style="margin-top: 10px;">
              <template #description>
                <n-space size="small" style="margin-top: 4px">
                  <n-tag :bordered="false" type="info" size="small">
                    #{{ note.id }}
                  </n-tag>
                  <n-tag :bordered="false" :type="note.locked ? 'error' : 'info'" size="small">
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
    </template>
    <n-empty v-else size="huge" description="没有便签哦"> </n-empty>
  </n-space>
  <div v-else class="tw-flex tw-justify-center tw-items-center" :style="{ height: `${height}px` }">
    <n-spin size="large" />
  </div>
</template>
<script setup lang="ts">
import { NoteType, type MemoData, type MemoRes, type PaginationData } from '~/types';

const props = defineProps<{
  notes: MemoData[] | MemoRes[];
  pagination: PaginationData;
  height: number;
  loading?: boolean;
}>()

const emit = defineEmits<{
  (e: 'update:pagination', val: PaginationData): void;
}>()

const router = useRouter()
const { togglePanel } = useUser()

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

const navigateNote = (sid: string) => {
  router.push({ name: 'NoteDetail', params: { type: NoteType.ONLINE, id: sid } })
  togglePanel(false)
}
</script>