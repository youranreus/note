<script setup lang="ts">
import type { OnlineNoteObjectHeaderModel } from '../online-note'

import Button from '@/components/ui/Button.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import SurfaceCard from '@/components/ui/SurfaceCard.vue'

defineProps<{
  model: OnlineNoteObjectHeaderModel
}>()

const emit = defineEmits<{
  copy: []
}>()
</script>

<template>
  <SurfaceCard state="focus">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0">
        <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">对象头部</p>
        <h3 class="mt-2 break-all text-xl font-semibold">SID: {{ model.sid }}</h3>
        <p class="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
          {{ model.shareStatusDescription }}
        </p>
      </div>

      <Button
        :state="model.copyButtonState"
        leading-label="share"
        variant="secondary"
        @click="emit('copy')"
      >
        {{ model.copyButtonLabel }}
      </Button>
    </div>

    <div class="mt-5 grid gap-3 md:grid-cols-3">
      <div class="rounded-[var(--radius-control)] border border-[color:var(--panel-border)] bg-white/70 px-4 py-3">
        <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">保存状态</p>
        <div class="mt-2">
          <StatusPill :label="model.saveStatusLabel" :tone="model.saveStatusTone" />
        </div>
      </div>

      <div class="rounded-[var(--radius-control)] border border-[color:var(--panel-border)] bg-white/70 px-4 py-3">
        <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">分享状态</p>
        <div class="mt-2">
          <StatusPill :label="model.shareStatusLabel" :tone="model.shareStatusTone" />
        </div>
      </div>

      <div class="rounded-[var(--radius-control)] border border-[color:var(--panel-border)] bg-white/70 px-4 py-3">
        <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">编辑状态</p>
        <div class="mt-2">
          <StatusPill
            :label="model.editStatusLabel"
            :caption="model.editStatusCaption"
            :tone="model.editStatusTone"
          />
        </div>
      </div>
    </div>
  </SurfaceCard>
</template>
