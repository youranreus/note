<template>
  <div class="page-container">
    <!-- 标题区 -->
    <div class="mb-10">
      <h1 class="text-3xl font-semibold tracking-tight mb-2" style="color: var(--color-text-primary);">
        Memo
      </h1>
      <p class="text-sm" style="color: var(--color-text-secondary);">
        {{ infoText || '简单、轻量的便签工具' }}
      </p>
    </div>

    <!-- 快捷跳转链接 -->
    <div v-if="jumpLinks.length" class="flex gap-3 mb-8 flex-wrap">
      <a
        v-for="link in jumpLinks"
        :key="link.url"
        :href="link.url"
        target="_blank"
        class="text-sm transition-colors"
        style="color: var(--color-link);"
      >
        {{ link.label }} ↗
      </a>
    </div>

    <!-- 便签入口 -->
    <div class="rounded-2xl p-6 mb-6" style="background: var(--color-bg-muted);">
      <p class="text-xs font-medium mb-4" style="color: var(--color-text-secondary);">
        输入 ID 打开便签，或直接创建新便签
      </p>

      <div class="flex gap-2 mb-5">
        <UInput
          v-model="inputId"
          placeholder="便签 ID"
          class="flex-1"
          size="md"
          @keyup.enter="openNote"
        />
        <UButton variant="soft" @click="openNote" :disabled="!inputId">
          打开
        </UButton>
      </div>

      <div class="flex gap-2">
        <UButton
          variant="solid"
          class="flex-1"
          @click="createNew(NoteType.ONLINE)"
        >
          新建在线便签
        </UButton>
        <UButton
          variant="outline"
          class="flex-1"
          @click="createNew(NoteType.LOCAL)"
        >
          新建本地便签
        </UButton>
      </div>
    </div>

    <!-- 便签类型说明 -->
    <div class="grid grid-cols-2 gap-3 text-xs" style="color: var(--color-text-secondary);">
      <div class="rounded-xl p-4" style="background: var(--color-bg-muted); border: 1px solid var(--color-divider);">
        <div class="font-medium mb-1" style="color: var(--color-text-primary);">在线便签</div>
        <div>云端同步，支持多设备访问与加密</div>
      </div>
      <div class="rounded-xl p-4" style="background: var(--color-bg-muted); border: 1px solid var(--color-divider);">
        <div class="font-medium mb-1" style="color: var(--color-text-primary);">本地便签</div>
        <div>仅存储在当前浏览器，保护隐私</div>
      </div>
    </div>
  </div>

  <!-- 用户面板触发按钮 -->
  <UserDrawer />
</template>

<script setup lang="ts">
import { nanoid } from 'nanoid'
import { NoteType } from '~/types'

const router = useRouter()
const inputId = ref('')
const infoText = ref('')
const jumpLinks = ref<{ label: string; url: string }[]>([
  { label: 'GitHub', url: 'https://github.com/youranreus' },
])

const openNote = () => {
  if (!inputId.value.trim()) return
  router.push({ name: 'NoteDetail', params: { type: NoteType.ONLINE, id: inputId.value.trim() } })
}

const createNew = (type: NoteType) => {
  const id = nanoid(8)
  router.push({ name: 'NoteDetail', params: { type, id } })
}
</script>
