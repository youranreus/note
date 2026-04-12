# Story Validation Report: 2-4-unified-view-edit-authorization

## Validation Result

- Story file: `_bmad-output/implementation-artifacts/2-4-unified-view-edit-authorization.md`
- Validation status: pass with fixes applied
- Story status after validation: `ready-for-dev`

## Summary

本次 `VS` 复核后，Story 2.4 已具备进入 `DS` 的条件。主方向是正确的：它已经把 2.4 明确成“统一授权语义、统一对象表达、统一读写判断”的故事，而不是误写成新权限系统或误吞 Epic 3 / 4。

不过仍有 3 个会直接影响开发代理实现质量的缺口，我已经直接修回 story 文件：

1. Story 虽然指出要统一前端授权表达，但没有明确要求优先扩展现有 `online-note.ts` / `use-online-note.ts` helper，容易让实现阶段在组件层再造一套平行 mapper。
2. Story 的文件触点遗漏了 `apps/web/src/services/note-methods.ts`，而 2.4 很可能会调整 `GET/PUT /api/notes/:sid` 的共享 DTO；如果漏掉这里，Web 端容易继续按旧响应契约消费。
3. Story 的测试要求更偏 service 层，但 2.4 的核心风险之一正是 route schema / DTO / Web helper 三层语义漂移，所以还需要显式把 route 级测试与 Web helper 一致性测试写进门槛。

## Fixes Applied

### 1. Prevent parallel authorization mappers

- 新增要求：优先扩展现有 `resolveOnlineNoteViewModel`、`resolveOnlineNoteSaveFeedback`、`resolveOnlineNoteObjectHeader`、`canEditOnlineNote` 和 `createSavePayload`
- 明确不要在组件层再新造一套平行授权 mapper
- 这样能防止同一状态在 helper、composable、组件三处被重复翻译，重新制造 2.4 想消灭的语义漂移

### 2. Add `note-methods.ts` as a first-class touchpoint

- 在 File Structure 和 Current Codebase Reality Check 中补入 `apps/web/src/services/note-methods.ts`
- 明确它直接绑定 `OnlineNoteDetailDto` / `OnlineNoteSaveResponseDto`，因此只要响应摘要结构变化，这里就必须一起改
- 这样可以避免开发代理只改 shared types 和 route/schema，却漏掉 Web 请求层

### 3. Tighten route-level and helper-level regression gates

- 在 Testing Requirements 中补充：
  - `apps/api/tests/notes-read.spec.ts`
  - `apps/api/tests/notes-write.spec.ts`
  - `apps/web/tests/online-note.spec.ts`
  - `apps/web/tests/use-online-note.spec.ts`
- 明确 2.4 不仅要过 service 单测，还要证明 Fastify route schema、共享 DTO、Web helper 和 shell 层消费的是同一套授权语义

## Remaining Risks

- 当前 story 仍然把“是否保留单一 `editAccess` 字段”留给实现阶段判断，这是合理的，但 `DS` 时要严格守住“增量收口”边界，不要演变成大规模 DTO 重构。
- 现有 `key-required` 体验允许用户先编辑本地草稿，再输入密钥保存；实现阶段很容易一刀切把它禁成完全只读。那样虽然更简单，但会偏离当前 UX 和 2.3 已建立的交互。
- 当前公开提交历史还没有完整反映 2.3 的代码现实，因此 `DS` 时应优先相信当前工作树和 story 文档，而不是单看最近 commit。

## Recommendation

- 下一步可直接进入 `DS`
- 实现时优先守住三件事：不要新造平行 mapper、不要漏改 request/route 契约层、不要让 helper / route / UI 三层重新分叉出不同授权语义
