<script setup lang="ts">
defineProps<{
  sid: string | null
}>()
</script>

<template>
  <div class="grid gap-4">
    <div class="rounded-[var(--radius-panel)] border border-[color:var(--panel-border)] bg-white/85 p-6 shadow-[var(--panel-shadow)]">
      <p class="m-0 text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">在线模式</p>
      <h2 class="mt-3 text-2xl font-semibold">SID: {{ sid ?? 'invalid' }}</h2>
      <p class="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
        在线便签壳体已创建，后续将由 Story 1.3 与 Story 1.4 接入真实读取、保存、权限和反馈流程。
      </p>
    </div>
    <div
      v-if="!sid"
      class="rounded-[var(--radius-control)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      当前路由缺少有效 sid，占位页不会把异常参数默默转成伪造的 note id。
    </div>
    <div class="rounded-[var(--radius-panel)] border border-dashed border-[color:var(--panel-border)] bg-white/60 px-6 py-10 text-center text-sm text-[color:var(--text-secondary)]">
      当前仅保留编辑区域占位，不提前实现读取/写入逻辑。
    </div>
  </div>
</template>
