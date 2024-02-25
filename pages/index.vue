<template>
  <div class="tw-w-[90vw] sm:tw-w-[768px]">
    <n-card
      title="📒季悠然的便签"
    >
      <n-space vertical>
        <template v-if="infoTextRes?.data">
          <n-p v-for="(line, index) in infoTextRes.data" :key="index">
            {{ line }}
          </n-p>
        </template>
        <n-p v-else>加载中</n-p>
      </n-space>
      
      <template #header-extra>
        <n-space>
          <n-button quaternary @click="jumpLink('github')">
            <template #icon>
              <n-icon>
                <logo-github />
              </n-icon>
            </template>
          </n-button>
          <n-button quaternary @click="jumpLink('home')">
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
          <n-button secondary type="primary" @click="handleClickBtn('o')">
            <template #icon>
              <n-icon>
                <online-icon />
              </n-icon>
            </template>
            在线便签
          </n-button>
          <n-button secondary type="info" @click="handleClickBtn('l')">
            <template #icon>
              <n-icon>
                <local-icon />
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
import { LogoGithub, LinkOutline, CloudOfflineOutline as LocalIcon, CloudOutline as OnlineIcon, Search } from '@vicons/ionicons5'

const router = useRouter()
const sid = ref('')
const infoTextRes = await useConfig<Record<'data', string[]>>('memo-info-text')
const jumpLinkRes = await useConfig<Record<string, string>>('memo-jumplink')

const jumpLink = (btn: 'home' | 'github') => {
  if (jumpLinkRes?.[btn]) {
    window.location.href = jumpLinkRes[btn];
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

const handleClickBtn = (type: 'o' | 'l') => {
  const target = sid.value || randomString(10)
  router.push({ name: 'NoteDetail', params: { id: target, type } });
}
</script>
