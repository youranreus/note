import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { UserSummary } from "@/types/auth";
import { authApi } from "@/services/http/auth";

export const useAuthStore = defineStore("auth", () => {
  const loading = ref(false);
  const user = ref<UserSummary | null>(null);

  const isLogged = computed(() => user.value !== null);

  async function refreshSession() {
    loading.value = true;
    try {
      const data = await authApi.session();
      user.value = data.logged ? (data.user ?? null) : null;
    } catch {
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function completeCallback(code: string) {
    loading.value = true;
    try {
      await authApi.callback(code);
      await refreshSession();
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    loading.value = true;
    try {
      await authApi.logout();
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    user,
    isLogged,
    refreshSession,
    completeCallback,
    logout
  };
});
