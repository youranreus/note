<script setup lang="ts">
import { computed, onMounted } from 'vue'

import Button from '@/components/ui/Button.vue'
import InlineFeedback from '@/components/ui/InlineFeedback.vue'
import { useAuthFlow } from '@/features/auth/use-auth-flow'

const { callbackCard, callbackPhase, processCallback, returnHome } = useAuthFlow()
const isError = computed(() => callbackPhase.value === 'error')

onMounted(() => {
  void processCallback()
})
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-[26.25rem] flex-col justify-center pb-16">
    <section
      :class="[
        'rounded-[var(--radius-panel)] bg-[color:var(--panel-bg)] px-6 py-6 shadow-[var(--panel-shadow)]',
        isError ? 'ring-2 ring-[#ffd9dd]' : ''
      ]"
    >
      <h2 class="m-0 text-xl font-semibold text-[color:var(--text-primary)]">{{ callbackCard.title }}</h2>

      <div v-if="callbackCard.loading" class="mt-4 flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-[color:var(--text-primary)]" />
        <span class="h-2 w-2 rounded-full bg-[color:var(--text-muted)]" />
        <span class="h-2 w-2 rounded-full bg-[color:var(--panel-border)]" />
      </div>

      <p v-else class="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
        {{ callbackCard.description }}
      </p>

      <InlineFeedback
        v-if="callbackPhase === 'error'"
        class="mt-4"
        :description="callbackCard.feedback.description"
        :title="callbackCard.feedback.title"
        :tone="callbackCard.feedback.tone"
        :state="callbackCard.feedback.state"
        :role="callbackCard.feedback.role"
        :aria-live="callbackCard.feedback.ariaLive"
        :aria-atomic="callbackCard.feedback.ariaAtomic"
      />

      <div v-if="callbackPhase === 'error'" class="mt-5 flex justify-end">
        <Button data-testid="auth-callback-home" size="compact" variant="secondary" @click="returnHome">
          返回首页
        </Button>
      </div>
    </section>
  </div>
</template>
