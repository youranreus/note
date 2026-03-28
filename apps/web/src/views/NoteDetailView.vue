<template>
  <section class="space-y-4">
    <div class="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 class="mb-2 text-xl font-semibold">便签详情壳（第一周）</h2>
      <p class="text-sm text-neutral-600">
        已完成路由骨架。第二周接入在线便签 CRUD、本地便签持久化、收藏能力。
      </p>
    </div>

    <div class="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm text-sm">
      <p><span class="font-medium">类型：</span>{{ type }}</p>
      <p><span class="font-medium">SID：</span>{{ sid }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  sid: string;
  type: "online" | "local";
}

defineProps<Props>();
</script>
