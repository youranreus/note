<template>
  <div class="tw-h-full tw-w-full tw-flex tw-justify-center tw-items-center">
    <n-result v-if="!loading" status="418" title="在线服务" description="登录以同步你的便签" size="small">
      <template #footer>
        <n-button secondary type="info" @click="handleLogin">使用SSO登录</n-button>
      </template>
    </n-result>
    <n-spin v-else size="large" />
  </div>
</template>
<script setup lang="ts">
const { loading } = useUser()

const handleLogin = () => {
  const config = useRuntimeConfig().public;
  const url = `${config.ssoHost}/callback/${config.ssoKey}`

  window.location.href = url;
}
</script>