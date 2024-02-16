<template>
  <div class="tw-flex tw-w-screen tw-h-screen tw-items-center tw-justify-center">
    <div class="tw-w-[500px]">
      <n-card
        title="📒季悠然的便签"
      >
        <n-space vertical>
          <n-p>
            {{ infoTextRes.data.value?.data || '加载中' }}
          </n-p>
        </n-space>
        
        <template #header-extra>
          <n-space>
            <n-button secondary @click="jumpLink('github')">
              <template #icon>
                <n-icon>
                  <logo-github />
                </n-icon>
              </template>
            </n-button>
            <n-button secondary @click="jumpLink('home')">
              <template #icon>
                <n-icon>
                  <link-outline />
                </n-icon>
              </template>
            </n-button>
          </n-space>
        </template>

        <template #action>
          <n-space justify="end">
            <n-button secondary type="primary">
              <template #icon>
                <n-icon>
                  <globe-outline />
                </n-icon>
              </template>
              在线便签
            </n-button>
            <n-button secondary type="info">
              <template #icon>
                <n-icon>
                  <save-outline />
                </n-icon>
              </template>
              本地便签
            </n-button>
          </n-space>
        </template>
      </n-card>
    </div>
  </div>
</template>
<script setup lang="ts">
import { LogoGithub, LinkOutline, GlobeOutline, SaveOutline } from '@vicons/ionicons5'
const infoTextRes = await useConfig<Record<'data', string>>('memo-info-text')

const jumpLinkRes = await useConfig<Record<string, string>>('memo-jumplink')

const jumpLink = (btn: 'home' | 'github') => {
  if (jumpLinkRes.data.value?.[btn]) {
    window.location.href = jumpLinkRes.data.value?.[btn];
  }
}
</script>
