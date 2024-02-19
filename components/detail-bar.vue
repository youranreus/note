<template>
  <n-space>
    <n-tag size="small" :bordered="false" :type="typeTag.type">
      {{ typeTag.text }}
      <template #icon>
        <n-icon :component="typeTag.icon" />
      </template>
    </n-tag>
    <n-tag size="small" :bordered="false" :type="editTag.type">
      {{ editTag.text }}
      <template #icon>
        <n-icon :component="editTag.icon" />
      </template>
    </n-tag>
    <n-tag size="small" :bordered="false">
      {{ memo.content.length }}字
      <template #icon>
        <n-icon :component="BalloonOutline" />
      </template>
    </n-tag>
  </n-space>
</template>
<script setup lang="ts">
import { type MemoData, NoteType } from '~/types'
import {
  CloudOfflineOutline as LocalIcon,
  CloudOutline as OnlineIcon,
  CloudDoneOutline,
  PencilOutline,
  DownloadOutline,
  BalloonOutline,
} from '@vicons/ionicons5'

const props = defineProps<{
  memo: MemoData;
  type: NoteType;
}>()

const typeTag = computed(() => {
  if (props.type === NoteType.LOCAL) {
    return {
      icon: LocalIcon,
      text: '本地便签',
    }
  }

  return {
    icon: OnlineIcon,
    text: '在线便签',
    type: 'info' as const
  }
})

const editTag = computed(() => {
  if (props.memo.editing) {
    return {
      icon: PencilOutline,
      text: '编辑中',
    }
  }

  return {
    icon: props.type === NoteType.LOCAL ? DownloadOutline : CloudDoneOutline,
    text: props.type === NoteType.LOCAL ? '已保存' : '已同步',
    type: 'success' as const
  }
})
</script>