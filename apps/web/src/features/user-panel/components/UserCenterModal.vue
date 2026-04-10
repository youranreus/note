<script setup lang="ts">
import { computed } from 'vue'

import type {
  MyFavoriteSummaryDto,
  MyNoteSummaryDto,
  UserPanelTab
} from '@note/shared-types'

import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import InlineFeedback from '@/components/ui/InlineFeedback.vue'
import ListItem from '@/components/ui/ListItem.vue'
import LoadingCard from '@/components/ui/LoadingCard.vue'
import Modal from '@/components/ui/Modal.vue'
import SegmentedTabs from '@/components/ui/SegmentedTabs.vue'
import SurfaceCard from '@/components/ui/SurfaceCard.vue'

import {
  formatUserPanelFavoritedAt,
  formatUserPanelUpdatedAt
} from '../user-panel'

const props = withDefaults(defineProps<{
  open: boolean
  activeTab: UserPanelTab
  createdNotes: MyNoteSummaryDto[]
  createdPage: number
  createdTotal: number
  createdHasMore: boolean
  createdLoading: boolean
  createdLoadingMore: boolean
  createdErrorMessage?: string
  favoriteNotes: MyFavoriteSummaryDto[]
  favoritePage: number
  favoriteTotal: number
  favoriteHasMore: boolean
  favoriteLoading: boolean
  favoriteLoadingMore: boolean
  favoriteErrorMessage?: string
}>(), {
  createdErrorMessage: '',
  favoriteErrorMessage: ''
})

const emit = defineEmits<{
  browseNotes: []
  close: []
  createFirstNote: []
  loadMoreCreated: []
  loadMoreFavorites: []
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
    description="这里承载你的账户资产入口，集中查看我创建过的在线便签与我收藏过的对象，并保持轻量弹层语义。"
    state="focus"
    title="个人中心"
    @close="emit('close')"
  >
    <div class="grid gap-4" data-testid="user-center-modal">
      <InlineFeedback
        description="个人中心不会带你离开当前产品主路径；你可以从这里查看我创建的便签和我收藏过的对象，并回到同一条在线对象路径。"
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

          <SurfaceCard state="default">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p class="m-0 text-sm leading-6 text-[color:var(--text-secondary)]">
                当前已显示 {{ createdNotes.length }} / {{ createdTotal }} 条创建记录，当前页为第 {{ createdPage }} 页。
              </p>
              <Button
                v-if="createdHasMore"
                data-testid="user-center-load-more"
                :state="createdLoadingMore ? 'disabled' : 'default'"
                variant="secondary"
                @click="emit('loadMoreCreated')"
              >
                {{ createdLoadingMore ? '正在加载更多' : '加载更多' }}
              </Button>
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

      <div v-else class="grid gap-4">
        <LoadingCard v-if="favoriteLoading" />

        <InlineFeedback
          v-else-if="favoriteErrorMessage"
          :description="favoriteErrorMessage"
          title="暂时无法读取我的收藏"
          tone="danger"
        />

        <div v-else-if="favoriteNotes.length > 0" class="grid gap-3">
          <SurfaceCard
            v-for="note in favoriteNotes"
            :key="note.sid"
            state="default"
          >
            <div class="grid gap-3">
              <ListItem
                :description="note.preview"
                :meta="formatUserPanelFavoritedAt(note.favoritedAt)"
                :title="note.sid"
                state="default"
              />
              <p class="m-0 text-sm leading-6 text-[color:var(--text-secondary)]">
                最近更新：{{ formatUserPanelUpdatedAt(note.updatedAt) }}
              </p>
              <div class="flex justify-end">
                <Button
                  :data-testid="`user-center-open-favorite-${note.sid}`"
                  variant="secondary"
                  @click="emit('openNote', note.sid)"
                >
                  返回便签
                </Button>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard state="default">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p class="m-0 text-sm leading-6 text-[color:var(--text-secondary)]">
                当前已显示 {{ favoriteNotes.length }} / {{ favoriteTotal }} 条收藏记录，当前页为第 {{ favoritePage }} 页。
              </p>
              <Button
                v-if="favoriteHasMore"
                data-testid="user-center-load-more-favorites"
                :state="favoriteLoadingMore ? 'disabled' : 'default'"
                variant="secondary"
                @click="emit('loadMoreFavorites')"
              >
                {{ favoriteLoadingMore ? '正在加载更多' : '加载更多' }}
              </Button>
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard v-else state="default">
          <div class="grid gap-4">
            <EmptyState
              description="当前没有收藏内容。去阅读在线便签并执行收藏后，你收藏过的对象会出现在这里。"
              title="当前没有收藏内容"
            />
            <div class="flex justify-center">
              <Button
                data-testid="user-center-browse-notes"
                @click="emit('browseNotes')"
              >
                去阅读并收藏
              </Button>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  </Modal>
</template>
