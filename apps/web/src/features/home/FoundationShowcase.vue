<script setup lang="ts">
import { shallowRef } from 'vue'

import { interactionStates } from '@/app/shell'
import Button from '@/components/ui/Button.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import InlineFeedback from '@/components/ui/InlineFeedback.vue'
import ListItem from '@/components/ui/ListItem.vue'
import LoadingCard from '@/components/ui/LoadingCard.vue'
import Modal from '@/components/ui/Modal.vue'
import SegmentedTabs from '@/components/ui/SegmentedTabs.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import SurfaceCard from '@/components/ui/SurfaceCard.vue'
import TextInput from '@/components/ui/TextInput.vue'

const demoTabs = [
  { label: '在线便签', value: 'online' },
  { label: '本地便签', value: 'local' }
]

const activeMode = shallowRef('online')
const inputValue = shallowRef('story-1-1-shell')
const modalOpen = shallowRef(false)
</script>

<template>
  <div class="grid gap-6">
    <SurfaceCard>
      <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-3xl">
          <p class="m-0 text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">Foundation</p>
          <h2 class="mt-3 text-2xl font-semibold">最小 design token 与高频组件层</h2>
          <p class="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
            这里集中落地 Story 1.1 要求的按钮、输入框、模态框、分段 tab、列表项、状态提示、空态、加载态与基础容器样式，并在初期就把 default / focus / error / disabled 四类状态定义完整。
          </p>
        </div>

        <Button leading-label="Shell" state="focus" @click="modalOpen = true">
          打开模态占位
        </Button>
      </div>
    </SurfaceCard>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <SurfaceCard>
        <div class="grid gap-5">
          <SegmentedTabs v-model="activeMode" :options="demoTabs" state="default" />

          <div class="grid gap-3 sm:grid-cols-2">
            <TextInput
              v-model="inputValue"
              hint="后续 Story 1.2 会在这里接入 sid 输入与自动生成。"
              label="SID 输入壳体"
              placeholder="输入或生成 sid"
              state="focus"
            />
            <TextInput
              label="错误态占位"
              placeholder="用于后续校验反馈"
              state="error"
            />
          </div>

          <div class="flex flex-wrap gap-3">
            <Button v-for="state in interactionStates" :key="state" :state="state">
              {{ state }}
            </Button>
          </div>

          <div class="flex flex-wrap gap-3">
            <StatusPill caption="匿名状态占位" label="Anonymous" tone="neutral" />
            <StatusPill caption="回调中" label="Recovering" state="focus" tone="accent" />
            <StatusPill caption="错误演示" label="Blocked" state="error" tone="danger" />
            <StatusPill caption="Disabled" label="Read only" state="disabled" tone="warning" />
          </div>
        </div>
      </SurfaceCard>

      <div class="grid gap-6">
        <InlineFeedback
          description="当前仅交付样式与状态约束，不接入真实业务异常。"
          title="统一反馈容器"
          tone="info"
        />
        <LoadingCard />
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <SurfaceCard>
        <div class="grid gap-3">
          <ListItem
            description="对应后续在线模式、对象头部、权限反馈等增长点。"
            meta="feature"
            title="列表项骨架"
          />
          <ListItem
            description="在 Story 1.1 仅强调布局和状态统一，不提前实现收藏、删除、会话恢复。"
            meta="scope"
            state="focus"
            title="边界收口"
          />
        </div>
      </SurfaceCard>

      <EmptyState
        description="当某个流程还未接入真实数据时，页面不会空白或 404，而是保留明确的容器与下一步语义。"
        title="空态骨架"
      />
    </div>

    <Modal
      :open="modalOpen"
      description="模态框组件已具备统一容器、阴影、状态边界和关闭行为，占位用于后续确认弹窗与授权反馈。"
      state="default"
      title="模态基础能力"
      @close="modalOpen = false"
    />
  </div>
</template>
