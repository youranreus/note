<template>
  <div class="min-h-full bg-neutral-100 text-neutral-900">
    <header class="border-b border-neutral-200 bg-white/70 backdrop-blur">
      <div class="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <h1 class="text-lg font-semibold">Note</h1>
        <button
          class="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50"
          type="button"
          @click="openUserPanel"
        >
          用户面板
        </button>
      </div>
    </header>

    <main class="mx-auto w-full max-w-5xl px-4 py-6">
      <RouterView />
    </main>

    <UserPanelPlaceholder />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import UserPanelPlaceholder from "@/components/UserPanelPlaceholder.vue";
import { useUiStore } from "@/stores/ui";

const uiStore = useUiStore();

function openUserPanel() {
  uiStore.openUserPanel();
}
</script>
