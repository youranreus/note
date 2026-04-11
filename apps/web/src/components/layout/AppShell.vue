<script setup lang="ts">
import AuthStatusPill from './AuthStatusPill.vue'
</script>

<template>
  <div class="min-h-screen bg-[color:var(--shell-bg)]">
    <header class="mx-auto flex w-full max-w-[50rem] justify-end px-6 pb-2 pt-4">
      <AuthStatusPill />
    </header>

    <main class="mx-auto flex w-full max-w-[50rem] flex-1 flex-col px-6 pb-10">
      <slot />
    </main>
  </div>
</template>
