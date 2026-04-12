# Story 4.2: 删除后的失效链接与不可恢复语义

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 分享接收者或创建者，
I want 已删除便签在原链接上表现为明确失效，
so that 我不会误以为内容只是暂时加载失败或仍可恢复。

## Acceptance Criteria

1. 某条便签已经被成功删除时，任意用户再次访问原 `sid` 链接，系统应返回已删除或已失效的明确状态，且不继续展示原内容。
2. 创建者尝试找回已删除便签时，通过原有分享链接或个人入口访问，系统不得提供恢复内容的路径，产品语义上必须保持删除不可恢复。
3. 即使实现层采用软删除字段，对外表现仍必须等价于不可恢复终态，前后端错误语义不能把软删除暴露成可回收功能。

## Tasks / Subtasks

- [x] Task 1: 固化“已删除资源再次读取”的服务端契约，保持读链路语义稳定且与现有客户端兼容 (AC: 1, 2, 3)
  - [x] 以 `apps/api/src/services/note-read-service.ts` 为单一读语义入口，继续通过 `deleted_at` / `NOTE_DELETED` 区分“已删除”与“从未存在”，不要在 route handler、前端页面或列表组件里重复推断 deleted 状态。
  - [x] 在 `apps/api/src/routes/notes.ts` 与 `apps/api/src/schemas/note.ts` 中固定已删除资源的 HTTP 契约；当前若继续沿用 `404 + NOTE_DELETED`，必须把 route、schema、shared types、前端解析和测试全部保持一致，不要出现一部分 404、一部分 410 的混合状态。
  - [x] 4.2 默认优先保持现有 `404 + NOTE_DELETED` 契约并强化页面语义，而不是单独引入半套 `410 Gone` 迁移；若确需升级为 `410`，必须在同一 story 内同步更新所有调用方与测试矩阵。
  - [x] 禁止新增“恢复删除内容”“回收站”“查看历史版本”类旁路接口或隐藏 query 参数；本 story 只处理“重访原链接时如何明确失效”。

- [x] Task 2: 收口前端 deleted terminal experience，让“冷访问已删除链接”和“刚删除成功”呈现同一产品语义 (AC: 1, 2, 3)
  - [x] 在 `apps/web/src/features/note/online-note.ts`、`apps/web/src/features/note/use-online-note.ts`、`apps/web/src/features/note/components/OnlineNoteShell.vue` 中，把“首次 GET 就返回 `NOTE_DELETED`”和“用户刚删除成功”两条路径收口到一致的 deleted 终态表达。
  - [x] 已删除状态不得显示正文、编辑器、保存入口、收藏入口、删除入口或对象头分享操作；如果页面内仍保留旧 `draftContent`、`baselineContent`、`editKey` 等内存状态，必须在 deleted 终态下清空或保证不会被继续使用。
  - [x] `deleted` 必须与 `not-found`、泛化 `error` 明确区分：标题、描述、反馈 tone 和下一步建议都要可读，但不要提前把 4.3 的全站异常文案系统一起重写。
  - [x] 对于刷新、重新进入同一路由、登录态切换后重读、浏览器回退重进等场景，不得闪回旧内容，也不得误落到 `not-found` 的“首次保存”状态。

- [x] Task 3: 封住创建者与资产入口的“找回错觉”，保证所有回访路径都回到 deleted 终态 (AC: 1, 2)
  - [x] 验证 `apps/api/src/services/me-service.ts`、`apps/api/src/routes/me.ts`、`apps/api/src/routes/favorites.ts` 以及相应前端列表流，确保“我的创建 / 我的收藏”不会把已删除对象继续当成可恢复内容暴露；如存在 stale entry，仅做最小修复。
  - [x] 通过个人入口、旧收藏、旧书签或分享链接重新进入已删除 `sid` 时，最终应落到在线便签 deleted 终态，而不是重新打开正文、展示可保存草稿或提示“你可以开始第一次保存”。
  - [x] 删除后与该对象相关的列表/缓存应继续依赖既有失效策略，不要为 4.2 再引入第二套“已删除对象本地黑名单”或临时全局状态来源。

- [x] Task 4: 保持软删除只是内部实现细节，避免产品语义泄漏或误导 (AC: 2, 3)
  - [x] 所有用户可见文案只能表达“已删除”“当前链接已失效”“不可恢复”，不要出现 `soft delete`、`deleted_at`、`回收站`、`可以找回` 等内部实现或误导性词汇。
  - [x] 前后端错误码、schema 与 view model 继续复用既有 `NOTE_DELETED` 语义，不为 deleted 链接再发明一套平行错误体系。
  - [x] 如果需要增强 deleted 页面说明，优先复用现有 `InlineFeedback`、terminal view model、shell 布局和现有 foundation 组件，不新建独立管理页、特殊 router 分支或额外状态容器。

- [x] Task 5: 为“重访已删除链接”补齐 focused regression tests，覆盖冷访问、重进与入口边界 (AC: 1, 2, 3)
  - [x] API / service 测试至少覆盖：GET 已删除 `sid` 返回稳定 deleted 契约；“从未存在”与“已删除”可区分；已删除响应不返回原始正文；若个人入口或收藏读取链路存在相关分支，也要确保不会泄露 deleted 内容。
  - [x] Web 测试至少覆盖：首次进入 `/note/o/:sid` 即收到 deleted 响应；刷新或重新挂载后仍保持 deleted 终态；deleted 状态下不显示 editor / object header / delete / favorite 动作；deleted 与 `not-found` / `error` 文案区分明确。
  - [x] 若需要验证登录后或个人入口回访 deleted 对象，可在现有 `apps/web/tests/user-panel.spec.ts` 或更合适的高层集成测试中补最小覆盖，但不要为了 4.2 新建大而全的 E2E 基础设施。
  - [x] 至少执行 `pnpm --filter @note/api test`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/web test`、`pnpm --filter @note/web typecheck`；若读契约、schema 或构建输出受影响，再补跑对应 `build`。

### Review Findings

- [x] [Review][Patch] 删除态重读后仍保留的 `readRequest.data` 会继续驱动登录后自动收藏，可能对已删除便签发起多余收藏请求并展示“收藏失败”反馈 [apps/web/src/features/note/use-online-note.ts:704]
- [x] [Review][Patch] 缺少“首次进入 deleted 链接”与“刷新/重新挂载后仍保持 deleted 终态”的 Web 回归测试，未满足 story 指定的最小覆盖范围 [apps/web/tests/use-online-note.spec.ts:956]

## Dev Notes

### Story Intent

Story 4.2 的重点不是“如何删除”，而是“删除之后，原链接还会向用户表达什么”。对用户来说，最危险的失败不是纯技术错误，而是把“永久删除”做成了“像暂时加载失败”或“似乎还能恢复”的错觉。

这条 story 必须把 deleted 资源的重访语义做成一个稳定、可理解、不会泄露原内容的终态，同时明确与 4.1、4.3 划边界：4.1 已负责确认删除与受权删除，4.3 才负责全站统一异常反馈体系；4.2 只收口“删除后重新打开原链接 / 通过个人入口回访”的明确失效与不可恢复语义。

### Requirement Traceability

- FR38, FR40, FR41, FR42
- NFR10, NFR13, NFR14, NFR15, NFR19
- UX-DR5, UX-DR7, UX-DR14, UX-DR20

### Epic Context

- Story 4.1 负责“删除前确认 + 服务端受权删除 + 当前页面删除成功后的终态反馈”，已经把主删除链路打通。
- Story 4.2 继续负责“删除后重新访问原 `sid` 时的完整产品语义”，包括旧书签、旧分享链接、个人入口与刷新重进场景。
- Story 4.3 负责把不存在、已删除、错误密钥、无权限、SSO 失败等异常状态的文案、样式和下一步建议做成统一体系，因此 4.2 不应提前扩写全站错误页或反馈系统。

### Previous Story Intelligence

- Story 4.1 已新增 `DELETE /api/notes/:sid`、`deleteBySid()`、共享删除 DTO、对象头删除入口、确认弹窗和删除成功后的当前页 deleted terminal state；4.2 必须复用这些能力，而不是重新设计第二套删除链路。 [Source: `_bmad-output/implementation-artifacts/4-1-delete-confirmation-authorized-delete.md`]
- Story 4.1 的 review 已暴露两个重要经验：删除相关失败反馈必须在用户修正输入或进入后续动作时及时清理；结构化错误码必须落到稳定 UI，而不是退回泛化报错。4.2 继续沿用“code -> 明确 feedback / terminal state”的模式。 [Source: `_bmad-output/implementation-artifacts/4-1-delete-confirmation-authorized-delete.md`]
- 当前代码已经存在一条“冷访问 deleted 链接”的基础通路：读服务返回 `NOTE_DELETED`，前端 view model 能映射 `deleted` 视图。4.2 的价值在于补齐产品语义、入口一致性和测试，而不是再发明一个独立 deleted 页面栈。 [Source: `apps/api/src/services/note-read-service.ts`] [Source: `apps/web/src/features/note/online-note.ts`]

### Current Codebase Findings

- `apps/api/src/services/note-read-service.ts` 已在命中 `deletedAt` 时返回 `status: 'deleted'` 与 `NOTE_DELETED`，并使用“当前链接不可继续读取”的明确 message，这说明 deleted 读语义已经有后端基础。 [Source: `apps/api/src/services/note-read-service.ts`]
- `apps/api/src/routes/notes.ts` 当前会把 deleted / not-found 统一映射到 404，并由结构化错误体继续区分具体业务语义；现有 `apps/api/tests/notes-read.spec.ts` 也已经按 404 + `NOTE_DELETED` 建立了回归基线。 [Source: `apps/api/src/routes/notes.ts`] [Source: `apps/api/tests/notes-read.spec.ts`]
- `apps/web/src/features/note/online-note.ts` 已能把读错误 `status === 'deleted'` 映射为 `viewModel.status === 'deleted'`，标题为“该在线便签已删除”；deleted 状态与 `not-found`、`error` 在 view model 层已经是不同分支。 [Source: `apps/web/src/features/note/online-note.ts`]
- `apps/web/src/features/note/use-online-note.ts` 的 `syncDraftFromRemote()` 只会主动同步 `available` / `not-found`，deleted 冷访问主要依赖 `readRequest.error` + `resolveOnlineNoteViewModel()`；这意味着 4.2 最需要补的是“首次进入 deleted 链接”的回归覆盖，而不是重写整个状态机。 [Source: `apps/web/src/features/note/use-online-note.ts`]
- `apps/web/src/features/note/components/OnlineNoteShell.vue` 已在 `viewModel.status === 'deleted'` 或 `error` 时复用 `InlineFeedback` 呈现终态，并通过 `authorizationUi.canShowEditor` 与 `objectHeader` 控制编辑器 / 对象头显示，这为 4.2 提供了最合适的 UI 收口点。 [Source: `apps/web/src/features/note/components/OnlineNoteShell.vue`]
- 现有 Web 测试只部分覆盖 deleted 场景：`apps/web/tests/use-online-note.spec.ts` 已覆盖“保存返回 `NOTE_DELETED`”和“删除成功进入 deleted terminal state”，`apps/web/tests/online-note.spec.ts` 有 deleted view model 分支，但还缺“冷访问已删除链接”的主要回归。 [Source: `apps/web/tests/use-online-note.spec.ts`] [Source: `apps/web/tests/online-note.spec.ts`]

### Technical Requirements

- 已删除对象的再次读取必须永远落到稳定的 deleted 终态，不得返回原始正文，不得暴露继续编辑或继续删除的能力，也不得伪装成“还没有保存过内容”。
- 当前 story 默认保持既有 `404 + NOTE_DELETED` API 契约，并通过页面语义明确表达“永久失效”；不要在 4.2 中单独引入半套 `410 Gone` 迁移。
- `NOTE_DELETED` 必须继续和 `NOTE_NOT_FOUND`、泛化读错误分开建模；deleted、not-found、error 三类状态都要有不同的标题、描述和后续动作提示。
- 冷访问、页面刷新、路由重入、登录态切换后的重读，以及从个人入口或旧收藏回访，都必须回到同一 deleted 语义，不允许某些路径进入 deleted、某些路径又回到 not-found 或旧正文。
- 不得引入任何“可恢复”表达、内部软删除字段透出或对 deleted 数据的第二真值源；远端 deleted 结果继续由 API + Alova/composable 负责，Pinia 只管理会话与 UI。

### Architecture Compliance

- 保持 REST 资源边界：deleted 读语义属于 `notes` 资源读取链路，不新增 `/api/deleted-note`、`/api/notes/:sid/recover` 或其他旁路接口。 [Source: `_bmad-output/planning-artifacts/architecture.md`] [Source: `docs/tech-solution.md`]
- 保持后端分层：route 只负责参数校验、schema 挂载与 HTTP 状态码映射；是否为 deleted 由读服务统一判断，不让 route handler 散落业务分支。 [Source: `_bmad-output/planning-artifacts/architecture.md`]
- 保持前端分层：远端对象读取、deleted 终态和回访语义仍收口在 `apps/web/src/features/note` 与 Alova/composable，不把远端对象状态塞入 Pinia。 [Source: `_bmad-output/planning-artifacts/architecture.md`] [Source: `_bmad-output/project-context.md`]
- 保持 story 边界：4.2 不新增恢复流程、不做全站统一异常组件重写、不顺手扩写本地便签、SSO 或大规模用户中心重构。 [Source: `_bmad-output/implementation-artifacts/4-1-delete-confirmation-authorized-delete.md`] [Source: `_bmad-output/planning-artifacts/epics.md`]

### Library / Framework Requirements

- 继续沿用现有 Vue 3 Composition API + `<script setup>`、Fastify route/schema/service 分层、Alova 请求管理与 `Vitest + @vue/test-utils` 测试模式；本 story 不需要升级依赖，也不需要新增错误页库、状态机库或 E2E 框架。 [Source: `_bmad-output/planning-artifacts/architecture.md`] [Source: `_bmad-output/project-context.md`]
- deleted 终态优先复用现有 `InlineFeedback`、`SurfaceCard`、view model / composable 模式，而不是引入另一套“系统错误页”抽象。 [Source: `apps/web/src/features/note/components/OnlineNoteShell.vue`] [Source: `apps/web/src/features/note/online-note.ts`]
- 包管理、脚本和验证命令统一使用 `pnpm`。 [Source: `_bmad-output/project-context.md`]

### File Structure Requirements

- 很可能需要修改：
  - `apps/api/src/services/note-read-service.ts`
  - `apps/api/src/routes/notes.ts`
  - `apps/api/src/schemas/note.ts`
  - `apps/web/src/features/note/online-note.ts`
  - `apps/web/src/features/note/use-online-note.ts`
  - `apps/web/src/features/note/components/OnlineNoteShell.vue`
  - `apps/api/tests/note-read-service.spec.ts`
  - `apps/api/tests/notes-read.spec.ts`
  - `apps/web/tests/online-note.spec.ts`
  - `apps/web/tests/use-online-note.spec.ts`
- 可能按最小需要修改：
  - `apps/api/src/services/me-service.ts`
  - `apps/api/src/routes/me.ts`
  - `apps/api/src/routes/favorites.ts`
  - `apps/web/tests/user-panel.spec.ts`
- 一般不应修改：
  - `apps/api/src/services/note-write-service.ts`
  - `apps/web/src/features/note/components/DeleteNoteConfirmModal.vue`
  - `apps/web/src/components/ui/Button.vue`
  - `apps/web/src/features/local-note/*`
  - `apps/web/src/features/auth/*`

### Testing Requirements

- API / service 层至少覆盖：
  - 读取已删除 `sid` 返回稳定 deleted 契约
  - 已删除与从未存在的资源可被区分
  - 已删除响应不再带原始正文
  - 如果个人入口或收藏列表仍存在相关读分支，不会继续泄露 deleted 对象
- Web / UI 层至少覆盖：
  - 首次进入 `/note/o/:sid` 即收到 deleted 响应时，页面直接进入 deleted 终态
  - deleted 终态下不显示 editor、object header、delete button、favorite button、share action
  - 刷新、重新挂载、登录态变化后重读，不会闪回旧内容或落到 not-found
  - deleted、not-found、generic error 的标题与描述保持可区分
- 回归要求：
  - Story 4.1 的删除成功后 current-page terminal deleted flow 不回归
  - Story 3.x 的“我的创建 / 我的收藏”缓存失效与回访路径不回归
  - 既有 `404 + NOTE_DELETED` 测试基线不被无意打破，除非明确执行完整契约迁移

### Latest Technical Notes

- MDN 当前说明：`410 Gone` 用于“资源永久不可用”的语义，且默认可缓存；`404 Not Found` 只说明资源缺失，并不表达永久性。如果服务端不知道是暂时还是永久，应该使用 404。对于 `note` 当前仓库来说，代码和测试已经建立了 `404 + NOTE_DELETED` 的稳定契约，因此 4.2 应优先保持现有 HTTP contract，并把“永久删除、不可恢复”的区别放到结构化业务码与页面文案上表达；不要做半套 410 迁移。 [Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/410] [Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404] [Source: `apps/api/tests/notes-read.spec.ts`] [Source: `apps/api/src/routes/notes.ts`]
- `404` 自定义页面如果表达不清，会加剧用户困惑；这进一步说明 deleted 链接页面必须明确告诉用户“这条在线便签已删除 / 当前链接已失效”，而不是只给一个模糊错误标题。 [Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404]

### Project Structure Notes

- 项目上下文要求：默认使用 `pnpm`、中文输出、Pinia 只承接会话与 UI、远端对象状态交给 Alova/composable。这意味着 4.2 不应通过新增 store 或全局 deleted registry 来解决 deleted link 语义。 [Source: `_bmad-output/project-context.md`]
- 旧文档 `docs/database-design.md` 仍保留 `deleteMany(sid)` 风险记录，但真实代码已经演进到唯一 `sid` + `deleted_at` + `NOTE_DELETED` 语义；4.2 应以后端现有实现和架构文档为准，不回退到旧批量删除心智。 [Source: `docs/database-design.md`] [Source: `apps/api/src/services/note-read-service.ts`] [Source: `_bmad-output/planning-artifacts/architecture.md`]
- `docs/tech-solution.md` 与当前代码在部分路由形态上存在历史差异，因此 4.2 若触达 “我的创建 / 我的收藏” 相关路径，应以当前 `apps/api` / `apps/web` 实现为准，只做最小修复，不借此扩展路由重构。 [Source: `docs/tech-solution.md`] [Source: `_bmad-output/project-context.md`]

### References

- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/project-context.md`
- `_bmad-output/implementation-artifacts/4-1-delete-confirmation-authorized-delete.md`
- `docs/tech-solution.md`
- `docs/database-design.md`
- `apps/api/src/routes/notes.ts`
- `apps/api/src/schemas/note.ts`
- `apps/api/src/services/note-read-service.ts`
- `apps/api/src/services/me-service.ts`
- `apps/api/src/routes/me.ts`
- `apps/api/src/routes/favorites.ts`
- `apps/api/tests/note-read-service.spec.ts`
- `apps/api/tests/notes-read.spec.ts`
- `apps/web/src/features/note/online-note.ts`
- `apps/web/src/features/note/use-online-note.ts`
- `apps/web/src/features/note/components/OnlineNoteShell.vue`
- `apps/web/tests/online-note.spec.ts`
- `apps/web/tests/use-online-note.spec.ts`
- `apps/web/tests/user-panel.spec.ts`
- [MDN 410 Gone](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/410)
- [MDN 404 Not Found](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404)

## Change Log

- 2026-04-10: 创建 Story 4.2 上下文，明确删除后重访原链接的 deleted 终态、不可恢复语义、`404 + NOTE_DELETED` 兼容边界、个人入口回访约束与 focused regression 测试范围，供后续 `dev-story` 直接实现。
- 2026-04-10: 实现 deleted 终态语义收口，补齐 deleted refetch 内存清理与 focused regression tests，并将 story 状态推进到 `review`。

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Implementation Plan

- 先固定 deleted 读取 contract 与 story 范围，确认 4.2 默认保持 `404 + NOTE_DELETED`，不把半套 410 迁移或恢复能力塞进当前故事。
- 再在 `features/note` 中把“冷访问 deleted 链接”和“删除成功后的终态”收口到一致的 deleted UI 语义，并阻止旧正文、草稿和对象头动作泄漏。
- 最后补齐 API / composable / component / 必要的入口回访测试，确认个人入口、刷新与登录切换不会打破 deleted 语义。

### Debug Log References

- 已完整读取 `sprint-status.yaml`，确认当前第一条 backlog story 为 `4-2-deleted-link-irreversible-semantics`，且 `epic-4` 已处于 `in-progress`，本次只需把 story 状态推进到 `ready-for-dev`。
- 已抽取 Epic 4 中 Story 4.1、4.2、4.3 的边界，确认 4.2 只负责“删除后重新访问原链接”的明确失效与不可恢复语义，不提前实现 4.3 的统一异常体系。
- 已核对 `note-read-service`、`notes` read route、`resolveOnlineNoteViewModel`、`useOnlineNote` 与 `OnlineNoteShell`，确认 deleted 冷访问链路已有基础，但相关回归测试仍需补齐。
- 已检查现有 API / Web 测试，确认 `notes-read.spec.ts` 已把 deleted 读契约固定为 `404 + NOTE_DELETED`，而 Web 侧尚缺“首次进入 deleted 链接”的 focused regression。
- 已参考最近提交 `feat(note): 在线便签受权删除与确认弹窗`，确认 4.1 已完成受权删除与当前页终态，4.2 应直接承接这套实现模式继续推进。
- 已通过公开规范核对 HTTP 语义：`410 Gone` 强调永久删除，`404 Not Found` 不表达永久性；结合当前仓库现状，4.2 默认保持既有 404 契约并在页面层强化永久失效语义。
- 已在 `apps/web/src/features/note/online-note.ts` 中补充共享 deleted terminal view model，并把顶层 badge 文案从泛化异常态收紧为明确的“已删除”语义。
- 已在 `apps/web/src/features/note/use-online-note.ts` 中修正 `syncDraftFromRemote()` 的判断顺序：结构化 `NOTE_DELETED` / `NOTE_NOT_FOUND` 响应会优先于 stale `data` 生效，避免重读时旧正文遮住 deleted 终态。
- 已验证 `apps/api/src/services/me-service.ts`、`apps/api/src/routes/me.ts` 与 `apps/api/src/routes/favorites.ts` 的现有过滤/返回策略能够继续阻止已删除对象通过个人入口或收藏链路被当作可恢复内容暴露，本次仅补 focused regression 覆盖。
- 已执行并通过验证：`pnpm --filter @note/api test`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/api build`、`pnpm --filter @note/web test`、`pnpm --filter @note/web typecheck`、`pnpm --filter @note/web build`。

### Completion Notes List

- 已统一“冷访问 deleted 链接”和“刚删除成功”两条路径的终态表达，确保页面顶部语义、终态标题和不可恢复文案保持一致。
- 当读链路、保存链路或删除链路返回 `NOTE_DELETED` 时，在线便签 composable 现在会清空 `draftContent`、`baselineContent`、`editKey` 与相关交互反馈，避免 deleted 终态继续持有旧正文或可保存错觉。
- 已补齐 API / service 回归：deleted read contract、deleted read 无正文泄露，以及 favorites deleted 响应的稳定性覆盖。
- 已补齐 Web 回归：deleted 顶层 badge 语义、登录态切换后重读 deleted 的内存清理，以及 deleted / not-found / error 的明确区分。
- API 与 Web 的 test、typecheck、build 均已通过，story 已具备进入 review 的交付质量门槛。

### File List

- _bmad-output/implementation-artifacts/4-2-deleted-link-irreversible-semantics.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- apps/api/tests/favorites.spec.ts
- apps/api/tests/note-read-service.spec.ts
- apps/api/tests/notes-read.spec.ts
- apps/web/src/features/note/online-note.ts
- apps/web/src/features/note/use-online-note.ts
- apps/web/tests/online-note.spec.ts
- apps/web/tests/use-online-note.spec.ts
