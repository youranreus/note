<template>
  <naive-config>
    <n-message-provider>
      <n-el tag="div" style="background: var(--body-color); transition: .3s var(--cubic-bezier-ease-in-out);">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </n-el>
    </n-message-provider>
  </naive-config>
</template>
<script setup lang="ts">
import { useOsTheme } from 'naive-ui'
const { colorModePreference } = useNaiveColorMode();

const osThemeRef = useOsTheme()
const theme = computed<'dark' | 'light'>(() => (osThemeRef.value === 'dark' ? 'dark' : 'light'));
watch(
  () => theme.value,
  (val) => {
    colorModePreference.set(val)
  }
)
</script>
