<script setup lang="ts">
import { computed } from 'vue'

import type { MyNoteSummaryDto, UserPanelTab } from '@note/shared-types'

import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import InlineFeedback from '@/components/ui/InlineFeedback.vue'
import ListItem from '@/components/ui/ListItem.vue'
import LoadingCard from '@/components/ui/LoadingCard.vue'
import Modal from '@/components/ui/Modal.vue'
import SegmentedTabs from '@/components/ui/SegmentedTabs.vue'
import SurfaceCard from '@/components/ui/SurfaceCard.vue'

import { formatUserPanelUpdatedAt } from '../user-panel'

const props = withDefaults(defineProps<{
  open: boolean
  activeTab: UserPanelTab
  createdNotes: MyNoteSummaryDto[]
  createdLoading: boolean
  createdErrorMessage?: string
}>(), {
  createdErrorMessage: ''
})

const emit = defineEmits<{
  close: []
  createFirstNote: []
  openNote: [sid: string]
  selectTab: [tab: UserPanelTab]
}>()

const tabOptions = [
  {
    label: '我的创建',
    value: 'created'
  },
  {
    label: '我的收藏',
    value: 'favorites'
  }
] as const satisfies Array<{ label: string; value: UserPanelTab }>

const tabModel = computed({
  get: () => props.activeTab,
  set: (value: string) => emit('selectTab', value as UserPanelTab)
})
</script>

<template>
  <Modal
    :open="open"
    close-label="关闭个人中心"
    description="这里承载你的账户资产入口，优先查看我创建过的在线便签，并保持轻量弹层语义。"
    state="focus"
    title="个人中心"
    @close="emit('close')"
  >
    <div class="grid gap-4" data-testid="user-center-modal">
      <InlineFeedback
        description="个人中心不会带你离开当前产品主路径；这里优先承接我的创建，收藏资产会在下一张 story 接入。"
        title="轻量资产入口"
        tone="info"
      />

      <SegmentedTabs
        v-model="tabModel"
        :options="tabOptions"
        state="default"
        test-id-prefix="user-center-tab"
      />

      <div v-if="activeTab === 'created'" class="grid gap-4">
        <LoadingCard v-if="createdLoading" />

        <InlineFeedback
          v-else-if="createdErrorMessage"
          :description="createdErrorMessage"
          title="暂时无法读取我的创建"
          tone="danger"
        />

        <div v-else-if="createdNotes.length > 0" class="grid gap-3">
          <SurfaceCard
            v-for="note in createdNotes"
            :key="note.sid"
            state="default"
          >
            <div class="grid gap-3">
              <ListItem
                :description="note.preview"
                :meta="formatUserPanelUpdatedAt(note.updatedAt)"
                :title="note.sid"
                state="default"
              />
              <div class="flex justify-end">
                <Button
                  :data-testid="`user-center-open-note-${note.sid}`"
                  variant="secondary"
                  @click="emit('openNote', note.sid)"
                >
                  进入便签
                </Button>
              </div>
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard v-else state="default">
          <div class="grid gap-4">
            <EmptyState
              description="当前账户下还没有创建过在线便签。回到首页输入或生成一个 sid 后，你创建的对象会出现在这里。"
              title="你还没有创建过在线便签"
            />
            <div class="flex justify-center">
              <Button
                data-testid="user-center-create-first-note"
                @click="emit('createFirstNote')"
              >
                回到首页创建第一条便签
              </Button>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <InlineFeedback
        v-else
        description="当前 story 只接入我的创建；我的收藏会在下一张 story 中补齐真实列表与返回路径。"
        title="我的收藏稍后接入"
        tone="warning"
      />
    </div>
  </Modal>
</template>
