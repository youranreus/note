<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
import InlineFeedback from '@/components/ui/InlineFeedback.vue'
import SurfaceCard from '@/components/ui/SurfaceCard.vue'
import TextInput from '@/components/ui/TextInput.vue'

const model = defineModel<string>({ default: '' })

defineEmits<{
  submitOnline: [event: SubmitEvent]
  startLocal: [event: MouseEvent]
}>()

defineProps<{
  helperText: string
  infoTitle: string
  infoDescription: string
}>()
</script>

<template>
  <div class="grid gap-5">
    <SurfaceCard>
      <div class="grid gap-4">
        <div class="max-w-3xl">
          <p class="m-0 text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">EntryShell</p>
          <h2 class="mt-3 text-2xl font-semibold text-[color:var(--text-primary)] sm:text-3xl">
            输入或直接拿一个固定入口，马上开始。
          </h2>
          <p class="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
            在线便签用于稳定链接和后续持续更新，本地便签用于不经过远端存储的快速记录。首页不要求先登录。
          </p>
        </div>

        <form class="grid gap-4" @submit.prevent="$emit('submitOnline', $event)">
          <TextInput
            v-model="model"
            auto-capitalize="off"
            auto-complete="off"
            enter-key-hint="go"
            hint="输入已有 sid；如果留空，系统会使用当前准备好的固定入口 ID。"
            input-mode="text"
            label="固定入口 ID"
            placeholder="输入已有 sid，或直接使用系统准备的 ID"
            :spellcheck="false"
            state="focus"
          />

          <InlineFeedback
            :description="infoDescription"
            :title="infoTitle"
            tone="info"
          />

          <p class="m-0 text-sm leading-6 text-[color:var(--text-secondary)]">
            {{ helperText }}
          </p>

          <div class="grid gap-3 md:gap-4">
            <Button class="w-full" type="submit" variant="primary">
              在线便签
            </Button>
            <Button class="w-full" type="button" variant="secondary" @click="$emit('startLocal', $event)">
              本地便签
            </Button>
          </div>
        </form>
      </div>
    </SurfaceCard>
  </div>
</template>
