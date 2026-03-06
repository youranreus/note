<template>
  <!-- 底部悬浮按钮 -->
  <div class="fixed bottom-6 left-0 w-full flex justify-center z-50 pointer-events-none">
    <UButton
      class="pointer-events-auto shadow-lg"
      variant="solid"
      size="lg"
      icon="i-heroicons-bookmark-square"
      @click="open = true"
    />
  </div>

  <!-- 抽屉 -->
  <USlideover v-model:open="open" side="bottom" :ui="{ content: 'max-w-2xl mx-auto rounded-t-2xl' }">
    <template #content>
      <div class="p-5">
        <!-- 未登录 -->
        <div v-if="!isLogged" class="py-10 flex flex-col items-center gap-4">
          <div class="text-4xl">📝</div>
          <div>
            <p class="text-sm font-medium text-center mb-1" style="color: var(--color-text-primary);">同步你的便签</p>
            <p class="text-xs text-center" style="color: var(--color-text-secondary);">登录后可管理在线便签与收藏</p>
          </div>
          <UButton variant="solid" @click="redirectToSSO">
            使用 SSO 登录
          </UButton>
        </div>

        <!-- 已登录 -->
        <div v-else>
          <!-- 用户信息头部 -->
          <div class="flex items-center justify-between mb-5">
            <div>
              <div class="text-sm font-medium" style="color: var(--color-text-primary);">
                {{ user?.email }}
              </div>
              <div class="text-xs mt-0.5" style="color: var(--color-text-secondary);">
                <span
                  class="inline-block px-1.5 py-0.5 rounded text-xs"
                  :style="user?.role === 'ADMIN'
                    ? 'background: #e8f0fe; color: var(--color-link);'
                    : 'background: var(--color-bg-muted); color: var(--color-text-secondary);'"
                >
                  {{ user?.role === 'ADMIN' ? '管理员' : '用户' }}
                </span>
              </div>
            </div>
            <UButton variant="ghost" size="sm" color="error" @click="logout">
              退出
            </UButton>
          </div>

          <hr style="border-color: var(--color-divider);" class="mb-4" />

          <!-- Tabs -->
          <UTabs :items="tabs" class="w-full">
            <template #created>
              <NoteList
                :notes="userNote"
                :pagination="userNotePagi"
                :loading="userNoteLoading"
                @update:pagination="v => Object.assign(userNotePagi, v)"
              />
            </template>
            <template #favour>
              <NoteList
                :notes="favourNote"
                :pagination="favourPagination"
                :loading="favourLoading"
                @update:pagination="v => Object.assign(favourPagination, v)"
              />
            </template>
          </UTabs>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
const open = ref(false)
const { user, isLogged, logout, redirectToSSO } = useAuth()
const { loading: userNoteLoading, pagination: userNotePagi, data: userNote, load: loadUserNote } = useUserNote()
const { loading: favourLoading, pagination: favourPagination, data: favourNote, load: loadFavourNote } = useFavourNote()

const tabs = [
  { label: '创建的', slot: 'created' as const },
  { label: '收藏', slot: 'favour' as const },
]

const route = useRoute()
onMounted(async () => {
  // SSO 回调：从 query 参数拿 ticket（兼容旧版跳转）
  if (route.query.ticket) {
    // 旧版 ticket 模式兼容（如有需要）
  }
  if (isLogged.value) {
    await Promise.all([loadUserNote(), loadFavourNote()])
  }
})

watch(isLogged, async (val) => {
  if (val) {
    await Promise.all([loadUserNote(), loadFavourNote()])
  }
})
</script>
