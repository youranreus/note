<template>
  <div class="page-container flex items-center justify-center min-h-screen">
    <div class="w-full max-w-sm">
      <h2 class="text-xl font-semibold mb-2" style="color: var(--color-text-primary);">正在登录</h2>
      <p class="text-sm mb-6" style="color: var(--color-text-secondary);">正在通过 SSO 验证身份...</p>
      <UProgress animation="carousel" />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { login } = useAuth()

onMounted(async () => {
  const code = route.query.code as string
  if (!code) {
    router.push('/')
    return
  }
  await login(code)
  router.push('/')
})
</script>
