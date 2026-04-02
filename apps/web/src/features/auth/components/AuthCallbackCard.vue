<template>
  <div class="grid gap-4">
    <div class="rounded-[var(--radius-panel)] border border-[color:var(--panel-border)] bg-white/85 p-6 shadow-[var(--panel-shadow)]">
      <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">/auth/callback</p>
      <h2 class="mt-3 text-2xl font-semibold">SSO 回调壳体已就位</h2>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">
        当前页只负责承接统一回调路由。真实的 ticket 交换、会话恢复与回跳逻辑将在后续 Story 中由服务端和 auth feature 收口。
      </p>
    </div>
  </div>
</template>
