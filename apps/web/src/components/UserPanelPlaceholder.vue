<template>
  <Teleport to="body">
    <div
      v-if="uiStore.userPanelVisible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="uiStore.closeUserPanel"
    >
      <div class="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">用户信息面板（占位）</h2>
          <button
            type="button"
            class="rounded-md border border-neutral-300 px-2 py-1 text-sm hover:bg-neutral-100"
            @click="uiStore.closeUserPanel"
          >
            关闭
          </button>
        </div>
        <p class="text-sm text-neutral-600">
          第一周仅完成骨架。第二周将在这里接入“我的创建 / 我的收藏”列表。
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useUiStore } from "@/stores/ui";

const uiStore = useUiStore();
</script>
