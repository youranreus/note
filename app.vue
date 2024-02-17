<template>
  <n-config-provider :theme="theme">
    <n-message-provider>
      <n-el tag="div" style="background: var(--body-color); transition: .3s var(--cubic-bezier-ease-in-out);">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </n-el>
    </n-message-provider>
  </n-config-provider>
</template>
<script setup lang="ts">
import { darkTheme, useOsTheme } from 'naive-ui'

const osThemeRef = useOsTheme()
const theme = computed(() => (osThemeRef.value === 'dark' ? darkTheme : null));
</script>
