<template>
  <div class="page-container">
    <!-- 顶部导航 -->
    <div class="flex items-center gap-3 mb-6">
      <UButton
        variant="ghost"
        size="sm"
        icon="i-heroicons-arrow-left"
        @click="router.push('/')"
      />
      <span class="font-mono text-sm font-medium" style="color: var(--color-text-secondary);">
        #{{ sid }}
      </span>
      <div class="flex items-center gap-1.5 ml-auto">
        <span
          class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
          :style="type === NoteType.ONLINE
            ? 'background: #e8f0fe; color: var(--color-link);'
            : 'background: var(--color-bg-muted); color: var(--color-text-secondary);'"
        >
          {{ type === NoteType.ONLINE ? '在线' : '本地' }}
        </span>
        <span
          v-if="memo.editing"
          class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
          style="background: #fff8e6; color: #b45309;"
        >
          编辑中
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
          style="background: #e8f5e9; color: #2e7d32;"
        >
          {{ type === NoteType.ONLINE ? '已同步' : '已保存' }}
        </span>
        <span class="text-xs" style="color: var(--color-text-secondary);">
          {{ memo.content.length }} 字
        </span>
      </div>
    </div>

    <!-- 编辑区 -->
    <div class="rounded-2xl overflow-hidden mb-4" style="border: 1px solid var(--color-border);">
      <!-- 加密密钥输入 -->
      <div
        v-if="memo.locked"
        class="px-4 py-2.5 flex items-center gap-2"
        style="background: var(--color-bg-muted); border-bottom: 1px solid var(--color-divider);"
      >
        <UIcon name="i-heroicons-lock-closed" class="text-sm" style="color: var(--color-text-secondary);" />
        <UInput
          v-model="memo.key"
          placeholder="输入密钥"
          type="password"
          size="sm"
          variant="ghost"
          class="flex-1"
        />
      </div>

      <!-- 文本编辑器 -->
      <textarea
        v-model="memo.content"
        :disabled="loading"
        placeholder="Begin your story."
        class="w-full resize-none outline-none p-5 text-sm leading-relaxed"
        :style="{
          minHeight: '60vh',
          fontFamily: 'var(--font-family-mono)',
          background: 'var(--color-bg-base)',
          color: 'var(--color-text-primary)',
        }"
        @input="memo.editing = true"
      />
    </div>

    <!-- 工具栏 -->
    <div class="flex items-center justify-between">
      <!-- 左侧：收藏 + 复制链接 -->
      <div class="flex items-center gap-2">
        <UButton
          v-if="type === NoteType.ONLINE && isLogged"
          variant="ghost"
          size="sm"
          :icon="memo.favoured ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
          :style="memo.favoured ? 'color: var(--color-error)' : ''"
          @click="toggleFavour?.(!memo.favoured)"
        />
        <UButton
          variant="ghost"
          size="sm"
          icon="i-heroicons-link"
          @click="copyUrl"
        >
          复制链接
        </UButton>
      </div>

      <!-- 右侧：加密 + 保存 + 删除 -->
      <div class="flex items-center gap-2">
        <UButton
          v-if="!memo.locked && type === NoteType.ONLINE"
          variant="ghost"
          size="sm"
          icon="i-heroicons-lock-closed"
          :disabled="loading"
          @click="setLocked?.() "
        >
          加密
        </UButton>
        <UButton
          variant="soft"
          size="sm"
          icon="i-heroicons-cloud-arrow-up"
          :loading="loading"
          :disabled="!memo.content"
          @click="save"
        >
          保存
        </UButton>
        <UButton
          variant="ghost"
          size="sm"
          icon="i-heroicons-trash"
          color="error"
          :disabled="loading"
          @click="remove"
        >
          删除
        </UButton>
      </div>
    </div>
  </div>

  <UserDrawer />
</template>

<script setup lang="ts">
import { NoteType } from '~/types'

definePageMeta({ name: 'NoteDetail' })

const route = useRoute()
const router = useRouter()
const type = computed(() => route.params.type as NoteType)
const sid = computed(() => route.params.id as string)
const { isLogged } = useAuth()
const { memo, loading, save, remove, copyUrl, toggleFavour, setLocked } = useNote(sid.value, type.value)
</script>
