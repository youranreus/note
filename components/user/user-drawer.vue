<template>
  <div class="tw-fixed tw-w-screen tw-bottom-4 tw-left-0 tw-flex tw-justify-center">
    <n-button secondary circle type="primary" size="large" @click="togglePanel()">
      <template #icon>
        <n-icon :component="Bookmarks"/>
      </template>
    </n-button>

    <n-drawer
      :show="panelActive"
      :mask-closable="false"
      placement="bottom"
      class="tw-bg-transparent tw-shadow-none"
      :default-height="500"
    >
      <div class="tw-w-full tw-h-full tw-flex tw-justify-center">
        <n-el ref="panelRef" tag="div" class="tw-w-[768px] tw-rounded-t-xl tw-p-4 tw-shadow-xl" style="background: var(--modal-color); transition: .3s var(--cubic-bezier-ease-in-out);">
          <user-login-hint v-if="!isLogged || loading" />
          <user-panel v-else />
        </n-el>
      </div>
    </n-drawer>
  </div>
</template>
<script setup lang="ts">
import { Bookmarks } from '@vicons/ionicons5'

const { panelActive, loading, isLogged, login, togglePanel } = useUser()

const panelRef = ref()
const route = useRoute()

onClickOutside(panelRef, () => togglePanel(false))

onMounted(() => {
  route.query.ticket && login(route.query.ticket as string)
})
</script>