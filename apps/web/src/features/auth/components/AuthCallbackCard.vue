<script setup lang="ts">
import { computed, onMounted } from 'vue'

import Button from '@/components/ui/Button.vue'
import InlineFeedback from '@/components/ui/InlineFeedback.vue'
import LoadingCard from '@/components/ui/LoadingCard.vue'
import SurfaceCard from '@/components/ui/SurfaceCard.vue'
import { useAuthFlow } from '@/features/auth/use-auth-flow'

const { callbackCard, callbackPhase, processCallback, returnHome } = useAuthFlow()
const cardState = computed(() =>
  callbackCard.value.feedback.tone === 'danger' ? 'error' : 'focus'
)

onMounted(() => {
  void processCallback()
})
</script>

<template>
  <div class="grid gap-4">
    <SurfaceCard :state="cardState">
      <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">/auth/callback</p>
      <h2 class="mt-3 text-2xl font-semibold">{{ callbackCard.title }}</h2>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">
        {{ callbackCard.description }}
      </p>

      <div class="mt-5 grid gap-4">
        <LoadingCard v-if="callbackCard.loading" state="focus" />
        <InlineFeedback
          :description="callbackCard.feedback.description"
          :title="callbackCard.feedback.title"
          :tone="callbackCard.feedback.tone"
          :state="callbackCard.feedback.state"
          :role="callbackCard.feedback.role"
          :aria-live="callbackCard.feedback.ariaLive"
          :aria-atomic="callbackCard.feedback.ariaAtomic"
        />
      </div>

      <div v-if="callbackPhase === 'error'" class="mt-5 flex flex-wrap gap-3">
        <Button data-testid="auth-callback-home" variant="secondary" @click="returnHome">
          返回首页
        </Button>
      </div>
    </SurfaceCard>
  </div>
</template>
