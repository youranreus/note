<template>
  <section class="space-y-4">
    <div class="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 class="mb-2 text-xl font-semibold">首页壳（第一周）</h2>
      <p class="text-sm text-neutral-600">
        已完成未登录/已登录状态切换与 SSO 主链路连通，便签业务将在第二周接入。
      </p>
    </div>

    <div class="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div v-if="authStore.isLogged" class="space-y-3">
        <p class="text-sm">
          当前登录用户：
          <span class="font-medium">{{ authStore.user?.name ?? "Unknown" }}</span>
          （SSO ID: {{ authStore.user?.ssoId }}）
        </p>
        <button
          class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          type="button"
          :disabled="authStore.loading"
          @click="authStore.logout"
        >
          退出登录
        </button>
      </div>

      <div v-else class="space-y-3">
        <p class="text-sm text-neutral-700">未登录状态，可通过 SSO 进入系统。</p>
        <button
          class="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          type="button"
          @click="gotoSso"
        >
          SSO 登录
        </button>
      </div>
    </div>

    <div class="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 class="mb-3 text-base font-semibold">便签入口（占位）</h3>
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
          @click="gotoOnlineNote"
        >
          在线便签
        </button>
        <button
          type="button"
          class="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
          @click="gotoLocalNote"
        >
          本地便签
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { getSsoLoginUrl } from "@/features/auth/sso";

const authStore = useAuthStore();
const router = useRouter();

function randomSid() {
  return Math.random().toString(36).slice(2, 12);
}

function gotoSso() {
  window.location.href = getSsoLoginUrl();
}

function gotoOnlineNote() {
  void router.push({ name: "note-online", params: { sid: randomSid() } });
}

function gotoLocalNote() {
  void router.push({ name: "note-local", params: { sid: randomSid() } });
}
</script>
