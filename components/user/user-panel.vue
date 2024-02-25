<template>
  <n-space vertical>
    <div class="user-panel-header">
      <n-space justify="space-between" align="center">
        <n-thing>
          <template #avatar>
            <n-avatar round :size="avatarSize">
              <n-icon class="tw-m-2" :component="IdCard" />
            </n-avatar>
          </template>
          <template #header>
            User #{{ userData.id }}
          </template>
          <template #description>
            <n-space>
              <n-tag :bordered="false" type="info" size="tiny">{{ userData.role === UserRole.ADMIN ? '管理员' : '用户' }}</n-tag>
              <n-tag :bordered="false" size="tiny">{{ userData.email }}</n-tag>
            </n-space>
          </template>
        </n-thing>
        
        <n-button secondary type="error" @click="clear">
          <template #icon>
            <n-icon :component="Exit" />
          </template>
          登出
        </n-button>
      </n-space>
    </div>

    <n-tabs type="bar">
      <n-tab-pane name="created" tab="创建的">
        <note-list :loading="userNoteLoading" :notes="userNote" v-model:pagination="userNotePagi" :height="listHeight" />
      </n-tab-pane>
      <n-tab-pane name="favour" tab="收藏">
        <note-list :loading="favourLoading" :notes="favourNote" v-model:pagination="favourPagination" :height="listHeight" />
      </n-tab-pane>
    </n-tabs>
  </n-space>
</template>
<script setup lang="ts">
import { IdCard, Exit } from '@vicons/ionicons5'
import { UserRole } from '@reus-able/types'

const device = useNaiveDevice()
const { userData, clear } = useUser()
const { loading: userNoteLoading, pagination: userNotePagi, data: userNote, load: loadUserNote } = useUserNote()
const { loading: favourLoading, pagination: favourPagination, data: favourNote, load: loadFavourNote } = useFavourNote()

const listHeight = device.isMobileOrTablet ? 358 : 626
const avatarSize = device.isMobileOrTablet ? 36 : 48

onMounted(async () => {
  await loadUserNote()
  await loadFavourNote()
})
</script>