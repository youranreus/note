<template>
  <div class="tw-fixed tw-w-screen tw-bottom-4 tw-left-0 tw-flex tw-justify-center">
    <n-button secondary circle type="primary" size="large" @click="updateUser">
      <template #icon>
        <n-icon :component="Bookmarks"/>
      </template>
    </n-button>
  </div>
</template>
<script setup lang="ts">
import { Bookmarks } from '@vicons/ionicons5'

const { userData, update } = useUser()
console.log('🤔 userData 是 ', userData)

const updateUser = () => {
  update({
    ...userData.value,
    id: userData.value.id + 1,
  })
}
</script>