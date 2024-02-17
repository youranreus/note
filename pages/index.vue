<template>
  <div class="tw-w-[768px]">
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
          <n-input v-model:value="sid" placeholder="跳转至">
            <template #prefix>
              <n-icon :component="Search"/>
            </template>
          </n-input>
          <n-button secondary type="primary" @click="handleClickBtn('online')">
            <template #icon>
              <n-icon>
                <globe-outline />
              </n-icon>
            </template>
            在线便签
          </n-button>
          <n-button secondary type="info" @click="handleClickBtn('local')">
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
</template>
<script setup lang="ts">
import { LogoGithub, LinkOutline, GlobeOutline, SaveOutline, Search } from '@vicons/ionicons5'

const router = useRouter()
const sid = ref('')
const infoTextRes = await useConfig<Record<'data', string>>('memo-info-text')
const jumpLinkRes = await useConfig<Record<string, string>>('memo-jumplink')

const jumpLink = (btn: 'home' | 'github') => {
  if (jumpLinkRes.data.value?.[btn]) {
    window.location.href = jumpLinkRes.data.value?.[btn];
  }
}

const randomString = (s: number) => {
  s = s || 32;
  let t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
      a = t.length,
      n = "",
      i = 0;
  for (; i < s; i++) n += t.charAt(Math.floor(Math.random() * a));
  return n;
}

const handleClickBtn = (type: 'online' | 'local') => {
  const target = sid.value || randomString(10)

  router.push({ name: 'OnlineNote', params: { id: target } });
}
</script>
