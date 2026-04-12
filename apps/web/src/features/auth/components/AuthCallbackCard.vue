<script setup lang="ts">
import { computed, onMounted } from 'vue'

import Button from '@/components/ui/Button.vue'
import InlineFeedback from '@/components/ui/InlineFeedback.vue'
import { useAuthFlow } from '@/features/auth/use-auth-flow'

const { callbackCard, callbackPhase, processCallback, returnHome } = useAuthFlow()
const isError = computed(() => callbackPhase.value === 'error')
const isLoading = computed(() => callbackCard.value.loading)
const isSuccess = computed(() => callbackPhase.value === 'success')

onMounted(() => {
  void processCallback()
})
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-[26.25rem] flex-col justify-center pb-16">
    <section
      :class="[
        'rounded-[var(--radius-panel)] border border-[color:var(--control-border)] bg-[color:var(--panel-bg)] px-6 py-6 shadow-[var(--panel-shadow)]',
        isError ? 'ring-2 ring-[#ffd9dd]' : ''
      ]"
    >
      <p class="m-0 text-[11px] font-semibold tracking-[0.12em] text-[color:var(--text-muted)]">
        SSO 安全回跳
      </p>
      <h2 class="m-0 text-xl font-semibold text-[color:var(--text-primary)]">{{ callbackCard.title }}</h2>

      <p class="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
        {{ callbackCard.description }}
      </p>

      <div
        v-if="isLoading"
        aria-live="polite"
        class="mt-5 rounded-[var(--radius-control)] border border-[color:var(--control-border)] bg-[color:var(--surface-white)]/88 px-4 py-4"
        role="status"
      >
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2" aria-hidden="true">
            <span class="callback-dot callback-dot--1" />
            <span class="callback-dot callback-dot--2" />
            <span class="callback-dot callback-dot--3" />
          </div>
          <p class="m-0 text-sm font-medium text-[color:var(--text-primary)]">正在建立安全会话</p>
        </div>
        <p class="mt-3 mb-0 text-[13px] leading-6 text-[color:var(--text-secondary)]">
          完成后会自动恢复到你刚才的页面，不需要手动操作。
        </p>
      </div>

      <div
        v-else-if="isSuccess"
        class="mt-5 rounded-[var(--radius-control)] border border-[color:var(--success)]/12 bg-[color:var(--success-soft)] px-4 py-4"
      >
        <p class="m-0 text-sm font-medium text-[color:var(--text-primary)]">登录已完成，正在返回原页面</p>
      </div>

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

<style scoped>
.callback-dot {
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 999px;
  background: var(--accent);
  animation: callback-dot-pulse 900ms cubic-bezier(0.22, 1, 0.36, 1) infinite;
  opacity: 0.3;
}

.callback-dot--2 {
  animation-delay: 120ms;
}

.callback-dot--3 {
  animation-delay: 240ms;
}

@keyframes callback-dot-pulse {
  0%,
  80%,
  100% {
    opacity: 0.28;
    transform: translateY(0) scale(0.9);
  }

  40% {
    opacity: 1;
    transform: translateY(-2px) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .callback-dot {
    animation: none;
    opacity: 0.72;
    transform: none;
  }
}
</style>
