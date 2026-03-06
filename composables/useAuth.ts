import type { UserInfo } from '~/types'

export const useAuth = () => {
  const { user, fetch: fetchSession, clear: clearSession } = useUserSession()
  const toast = useToast()
  const loading = ref(false)

  const isLogged = computed(() => !!user.value?.id)

  const login = async (code: string) => {
    loading.value = true
    try {
      await $fetch('/api/auth/login', { method: 'POST', query: { code } })
      await fetchSession()
      toast.add({ title: '登录成功', color: 'success' })
    } catch {
      toast.add({ title: '登录失败', color: 'error' })
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clearSession()
    toast.add({ title: '已退出登录', color: 'neutral' })
  }

  const redirectToSSO = async () => {
    const { url } = await $fetch<{ url: string }>('/api/auth/redirect')
    window.location.href = url
  }

  return { user, isLogged, loading, login, logout, redirectToSSO }
}
