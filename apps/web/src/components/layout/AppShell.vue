<script setup lang="ts">
import AuthStatusPill from './AuthStatusPill.vue'
</script>

<template>
  <div class="min-h-screen px-4 py-5 sm:px-6 sm:py-8">
    <div class="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col gap-6 rounded-[28px] border border-white/60 bg-white/40 p-4 shadow-[var(--panel-shadow)] backdrop-blur sm:p-6">
      <header class="flex flex-col gap-4 rounded-[var(--radius-panel)] border border-[color:var(--panel-border)] bg-white/72 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="m-0 text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">note</p>
          <h1 class="mt-2 text-2xl font-semibold sm:text-3xl">固定链接的轻量文本入口</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">
            从首页直接进入在线便签或本地便签，围绕固定入口 ID 保持短路径、低等待感和清楚的对象心智。
          </p>
        </div>
        <div class="flex justify-start sm:justify-end">
          <AuthStatusPill />
        </div>
      </header>

      <main class="mx-auto flex w-full max-w-[min(100%,72rem)] flex-1 flex-col gap-6">
        <slot />
      </main>
    </div>
  </div>
</template>
