<template>
  <div class="tw-fixed tw-w-screen tw-bottom-4 tw-left-0 tw-flex tw-justify-center">
    <n-button secondary circle type="primary" size="large" @click="active = true">
      <template #icon>
        <n-icon :component="Bookmarks"/>
      </template>
    </n-button>

    <n-drawer
      v-model:show="active"
      :mask-closable="false"
      placement="bottom"
      class="tw-bg-transparent tw-shadow-none"
      :default-height="500"
    >
      <div class="tw-w-full tw-h-full tw-flex tw-justify-center">
        <n-el ref="panelRef" tag="div" class="tw-w-[768px] tw-rounded-t-xl tw-p-4 tw-shadow-xl" style="background: var(--modal-color); transition: .3s var(--cubic-bezier-ease-in-out);">
          <user-login-hint v-if="!isLogged" />
        </n-el>
      </div>
    </n-drawer>
  </div>
</template>
<script setup lang="ts">
import { Bookmarks } from '@vicons/ionicons5'

const { isLogged } = useUser()

const active = ref(false)
const panelRef = ref();

onClickOutside(panelRef, () => {
  active.value = false
})
</script>