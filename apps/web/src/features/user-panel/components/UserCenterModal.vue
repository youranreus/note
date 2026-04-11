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
import LoadingCard from '@/components/ui/LoadingCard.vue'
import Modal from '@/components/ui/Modal.vue'
import SegmentedTabs from '@/components/ui/SegmentedTabs.vue'

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
    label: '我的收藏',
    value: 'favorites'
  },
  {
    label: '我的创建',
    value: 'created'
  }
] as const satisfies Array<{ label: string; value: UserPanelTab }>

const tabIdPrefix = 'user-center'
const noteItemClassName =
  'group grid gap-1.5 rounded-[14px] border border-transparent bg-[color:var(--surface-white)]/90 px-4 py-3.5 text-left transition-[background-color,border-color] duration-[var(--duration-fast)] hover:bg-white focus-visible:border-[color:var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-soft)] motion-reduce:transition-none'

const tabModel = computed({
  get: () => props.activeTab,
  set: (value: string) => emit('selectTab', value as UserPanelTab)
})
</script>

<template>
  <Modal
    initial-focus="active-tab"
    :open="open"
    close-label="关闭个人中心"
    description="集中查看我收藏过的对象与我创建过的在线便签。"
    size="lg"
    title="个人中心"
    @close="emit('close')"
  >
    <div class="grid gap-4" data-testid="user-center-modal">
      <SegmentedTabs
        v-model="tabModel"
        aria-label="个人中心资产分类"
        :id-prefix="tabIdPrefix"
        :options="tabOptions"
        state="default"
        test-id-prefix="user-center-tab"
      />

      <div
        v-if="activeTab === 'created'"
        id="user-center-panel-created"
        aria-labelledby="user-center-tab-created"
        class="grid gap-4"
        role="tabpanel"
        tabindex="0"
      >
        <LoadingCard v-if="createdLoading" />

        <InlineFeedback
          v-else-if="createdErrorMessage"
          :description="createdErrorMessage"
          title="暂时无法读取我的创建"
          tone="danger"
        />

        <div v-else-if="createdNotes.length > 0" class="grid gap-2.5">
          <button
            v-for="note in createdNotes"
            :key="note.sid"
            :data-testid="`user-center-open-note-${note.sid}`"
            :class="noteItemClassName"
            type="button"
            @click="emit('openNote', note.sid)"
          >
            <span class="break-all text-sm font-semibold text-[color:var(--text-primary)]">
              {{ note.preview || note.sid }}
            </span>
            <span class="sr-only">{{ note.sid }}</span>
            <span class="text-[11px] leading-5 text-[color:var(--text-muted)]">
              {{ formatUserPanelUpdatedAt(note.updatedAt) }}
            </span>
          </button>

          <div class="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p class="m-0 text-[12px] leading-5 text-[color:var(--text-muted)]">
              当前已显示 {{ createdNotes.length }} / {{ createdTotal }} 条创建记录，当前页为第 {{ createdPage }} 页。
            </p>
            <Button
              v-if="createdHasMore"
              data-testid="user-center-load-more"
              :state="createdLoadingMore ? 'disabled' : 'default'"
              size="compact"
              variant="secondary"
              @click="emit('loadMoreCreated')"
            >
              {{ createdLoadingMore ? '正在加载更多' : '加载更多' }}
            </Button>
          </div>
        </div>

        <div v-else class="grid gap-4 rounded-[14px] bg-[color:var(--surface-white)]/88 px-4 py-5">
          <div class="grid gap-4">
            <EmptyState
              description="当前账户下还没有创建过在线便签。回到首页输入或生成一个 sid 后，你创建的对象会出现在这里。"
              title="你还没有创建过在线便签"
            />
            <div class="flex justify-center">
              <Button
                data-testid="user-center-create-first-note"
                size="compact"
                @click="emit('createFirstNote')"
              >
                回到首页创建第一条便签
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        id="user-center-panel-favorites"
        aria-labelledby="user-center-tab-favorites"
        class="grid gap-4"
        role="tabpanel"
        tabindex="0"
      >
        <LoadingCard v-if="favoriteLoading" />

        <InlineFeedback
          v-else-if="favoriteErrorMessage"
          :description="favoriteErrorMessage"
          title="暂时无法读取我的收藏"
          tone="danger"
        />

        <div v-else-if="favoriteNotes.length > 0" class="grid gap-2.5">
          <button
            v-for="note in favoriteNotes"
            :key="note.sid"
            :data-testid="`user-center-open-favorite-${note.sid}`"
            :class="noteItemClassName"
            type="button"
            @click="emit('openNote', note.sid)"
          >
            <span class="break-all text-sm font-semibold text-[color:var(--text-primary)]">
              {{ note.preview || note.sid }}
            </span>
            <span class="sr-only">{{ note.sid }}</span>
            <span class="text-[11px] leading-5 text-[color:var(--text-muted)]">
              {{ formatUserPanelFavoritedAt(note.favoritedAt) }}
            </span>
            <span class="sr-only">最近更新：{{ formatUserPanelUpdatedAt(note.updatedAt) }}</span>
          </button>

          <div class="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p class="m-0 text-[12px] leading-5 text-[color:var(--text-muted)]">
              当前已显示 {{ favoriteNotes.length }} / {{ favoriteTotal }} 条收藏记录，当前页为第 {{ favoritePage }} 页。
            </p>
            <Button
              v-if="favoriteHasMore"
              data-testid="user-center-load-more-favorites"
              :state="favoriteLoadingMore ? 'disabled' : 'default'"
              size="compact"
              variant="secondary"
              @click="emit('loadMoreFavorites')"
            >
              {{ favoriteLoadingMore ? '正在加载更多' : '加载更多' }}
            </Button>
          </div>
        </div>

        <div v-else class="grid gap-4 rounded-[14px] bg-[color:var(--surface-white)]/88 px-4 py-5">
          <div class="grid gap-4">
            <EmptyState
              description="当前没有收藏内容。去阅读在线便签并执行收藏后，你收藏过的对象会出现在这里。"
              title="当前没有收藏内容"
            />
            <div class="flex justify-center">
              <Button
                data-testid="user-center-browse-notes"
                size="compact"
                @click="emit('browseNotes')"
              >
                去阅读并收藏
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>
