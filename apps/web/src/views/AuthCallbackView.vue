<template>
  <section class="mx-auto max-w-xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
    <h2 class="mb-3 text-xl font-semibold">SSO 回调处理中</h2>
    <p class="text-sm text-neutral-700">{{ statusText }}</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const statusText = ref("正在校验票据并恢复会话...");
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  try {
    const code = route.query.code;
    if (!code || typeof code !== "string") {
      statusText.value = "缺少 code，正在返回首页。";
      setTimeout(() => {
        void router.replace("/");
      }, 600);
      return;
    }

    await authStore.completeCallback(code);
    statusText.value = "登录成功，正在跳转首页。";
    setTimeout(() => {
      void router.replace("/");
    }, 600);
  } catch (error) {
    statusText.value = `登录失败：${(error as Error).message}`;
  }
});
</script>
