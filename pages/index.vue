<template>
  <div class="tw-flex tw-w-screen tw-h-screen tw-items-center tw-justify-center">
    <div class="tw-w-[500px]">
      <n-card
        title="📒季悠然的便签"
      >
        <n-space vertical>
          <n-p>
            {{ infoText }}
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
const infoText = '这是一个烂大街的pastebin项目，但是被季悠然又拿起来炒了一遍。你可以创建在线的便签，或是本地便签，点击下面的按钮开始使用吧😄';

const jumpLinkMap = {
  home: 'https://mitsuha.space',
  github: 'https://github.com/youranreus/note'
} as const;

const jumpLink = (btn: 'home' | 'github') => {
  window.location.href = jumpLinkMap[btn];
}
</script>
