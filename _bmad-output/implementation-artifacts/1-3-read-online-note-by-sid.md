# Story 1.3: 通过 SID 读取在线便签

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 分享接收者，
I want 通过固定 `sid` 直接打开在线便签并查看最新内容，
so that 我无需登录或额外步骤就能消费分享结果。

## Acceptance Criteria

1. 某个 `sid` 已关联一条未删除的在线便签时，访客直接访问 `/note/o/:sid`，系统应按唯一 `sid` 读取该便签，并在内容页直接展示该对象的最新已保存内容。
2. 访客未登录时，打开有效分享链接应允许正常阅读，不应因登录流程阻塞主阅读路径。
3. 当数据库和 API 被实现后，后端应通过唯一 `sid` 而不是模糊查询返回单一对象，且前后端应一致处理“不存在”“已删除”“正常可读”三类结果。

## Tasks / Subtasks

- [ ] Task 1: 建立 Story 1.3 所需的在线便签读取契约与共享类型 (AC: 1, 3)
  - [ ] 在 `packages/shared-types` 中新增在线便签详情 DTO、读取错误码与前端消费所需的状态类型，保持前后端字段使用 `camelCase`。
  - [ ] 明确详情读取响应至少覆盖 `sid`、`content`、对象状态，以及前端区分“正常可读 / 不存在 / 已删除”所需的最小信息。
  - [ ] 不在本故事提前引入保存、编辑密钥、收藏或作者资产字段；仅保留读取当前在线便签所需的最小契约。

- [ ] Task 2: 在 `apps/api` 落地按唯一 `sid` 读取在线便签的最小链路 (AC: 1, 3)
  - [ ] 将当前 `apps/api/src/routes/notes.ts` 从模块占位推进到真实读取入口，新增 `GET /api/notes/:sid`，并继续保留或兼容已有 shell/status 仅在不干扰主链路时存在。
  - [ ] 新增 `schemas` 与 `services` 层实现，确保路由参数校验、读取逻辑和错误映射分层清晰，不把所有逻辑塞进 route handler。
  - [ ] 当前仓库尚未落完整 Prisma/数据库读写链路时，可在 `apps/api` 先补齐最小 `notes` 数据访问基础，但返回语义必须已经对齐最终模型：唯一 `sid`、未删除可读、已删除不可读、缺失资源不可读。
  - [ ] 明确禁止使用 `findFirst`、模糊查找或会静默吞掉重复 `sid` 风险的实现；如果底层尚未具备唯一约束，服务层也必须显式按“唯一对象”语义收口并保留后续迁移空间。
  - [ ] 不允许用硬编码 demo 内容、仅开发期假数据或内存数组来“伪完成” Story 1.3；若真实数据库链路尚未齐备，也应至少把数据访问收口为可替换的 repository/service seam，并保持对后续 Prisma 接入无缝兼容。

- [ ] Task 3: 在 `apps/web` 建立在线便签详情读取能力 (AC: 1, 2, 3)
  - [ ] 在现有 `apps/web/src/services` 下补齐 `axios + alova` 的在线便签读取方法，优先沿用项目既定技术栈，不另外引入新的请求方案。
  - [ ] 将在线详情请求封装到 `features/note` 内的轻量 composable 或 service 模块中，让 `OnlineNoteView` 继续保持薄层。
  - [ ] 读取逻辑必须以路由中的 `sid` 为唯一输入，不从首页遗留状态、Pinia 或其他全局 store 偷拿对象标识。
  - [ ] 未登录访客访问有效在线链接时，页面只进入读取与展示链路，不弹 SSO modal，不要求先登录。

- [ ] Task 4: 将在线便签页从占位壳体推进为“只读消费页” (AC: 1, 2, 3)
  - [ ] 基于现有 `OnlineNoteShell.vue` 演进出真实的只读查看状态，而不是继续显示“后续故事再接入”的占位文案。
  - [ ] 页面至少覆盖 4 类前端状态：加载中、正常可读、资源不存在、资源已删除；状态文案需清晰，不只靠颜色区分。
  - [ ] 正常可读状态下，页面应直接展示最新内容主体，并保留后续 Story 1.4 / 1.5 接入对象头部、保存反馈与编辑态的结构空间。
  - [ ] 路由参数无效时，继续沿用 Story 1.1 / 1.2 已建立的严格 `sid` 处理策略，不把空值或异常参数默默转成伪造对象。
  - [ ] 加载态、异常态与说明态优先复用现有 `LoadingCard`、`InlineFeedback`、`SurfaceCard` 等 foundation 组件，不重新发明在线页专用状态容器。

- [ ] Task 5: 保持实现边界，避免越界吞并后续 stories (AC: 1, 2, 3)
  - [ ] 不在本故事实现在线便签保存、首次创建、持续更新；这些属于 Story 1.4。
  - [ ] 不在本故事实现 `NoteObjectHeader` 的完整分享/保存/权限反馈；这些属于 Story 1.5 和 Epic 2。
  - [ ] 不在本故事实现登录回跳、个人中心、收藏、编辑密钥或默认编辑权；读取链路必须在匿名可读前提下独立成立。
  - [ ] 不把本地便签模式逻辑混入在线便签 feature，保持 `/note/o/:sid` 与 `/note/l/:sid` 的职责分离。

- [ ] Task 6: 为读取链路补齐最小测试与验收 (AC: 1, 2, 3)
  - [ ] 为后端 `GET /api/notes/:sid` 增加测试，至少覆盖：存在且可读、资源不存在、资源已删除、无效 `sid` 参数。
  - [ ] 为前端在线便签读取状态增加测试，至少覆盖：加载态、成功态、not-found 态、deleted 态，以及未登录访问不触发登录阻断。
  - [ ] 保持现有首页路由与 `sid` 解析测试继续通过，新增测试不得破坏 Story 1.2 已建立的首页进入路径。
  - [ ] 通过 `pnpm --filter @note/api test`、`pnpm --filter @note/web test`、对应 `typecheck`，必要时再补 `build` 验证读取链路集成可用。

## Dev Notes

### Story Intent

本故事的目标不是“让在线页看起来不空”，而是第一次把 `note` 的核心价值落到真实对象读取上：用户拿到一个固定链接后，应能直接看到该 `sid` 对应的最新已保存内容。它是分享消费链路的起点，也是后续 Story 1.4 持续更新、Story 1.5 对象级反馈、Epic 2 权限升级的前置基础。

### Requirement Traceability

- FR3, FR4, FR20, FR26, FR27, FR28, FR29
- NFR2, NFR4, NFR10, NFR12, NFR14, NFR18, NFR19

### Cross-Story Context

- Story 1.2 已经把首页在线入口稳定导向 `/note/o/:sid`，因此 1.3 不需要重新处理首页草稿 `sid` 或主入口 CTA。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-2-home-sid-entry-mode-selection.md]
- Story 1.4 负责“首次保存创建 + 同一 `sid` 下持续更新”，所以 1.3 只做读取，不抢先实现保存按钮、编辑器提交或 upsert UI。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md]
- Story 1.5 负责对象头部与主路径反馈，因此 1.3 的页面结构应给对象级头部留位置，但不要在本故事模拟完整的分享/复制/保存状态条。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md]
- Epic 2 才引入登录创建者默认编辑权、编辑密钥与查看/编辑授权差异；1.3 默认站在“匿名可读”基线上，不引入登录门槛。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md#旅程-2主用户权限路径登录编辑与编辑密钥的双层模型]

### Previous Story Intelligence

- Story 1.2 已明确首页 `sid` 输入仅做 `trim` 和空值处理，并通过命名路由把目标落到 `online-note`；1.3 必须继续把路由中的 `sid` 视为唯一对象标识，而不是再加第二套来源。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-2-home-sid-entry-mode-selection.md#Tasks--Subtasks]
- Story 1.2 已把 `sid` 相关纯逻辑抽到 `apps/web/src/features/home/entry-sid.ts`，说明本项目偏向“把关键规则抽离成可测模块”；1.3 的读取状态判定与 DTO 适配也应延续这个模式。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-2-home-sid-entry-mode-selection.md#Completion Notes List]
- Story 1.2 的 review 已强调不要把首页和业务 feature 重新耦合在一起；因此 1.3 应把在线读取逻辑收口在 `features/note`，不要回流到首页组件或全局 store。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-2-home-sid-entry-mode-selection.md#Review Findings]
- Story 1.1 已建立严格的 `resolveSidParam` 行为：只接受单个非空字符串，不把异常路由参数静默转义成伪造 `sid`。1.3 读取逻辑必须沿用这个边界。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/router/sid.ts]

### Current Codebase Observations

- `apps/web/src/views/OnlineNoteView.vue` 当前只把 `sid` 作为 prop 传给 `OnlineNoteShell`，还没有任何真实读取请求，这正是 1.3 的直接切入点。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/views/OnlineNoteView.vue]
- `apps/web/src/features/note/components/OnlineNoteShell.vue` 目前仍是占位壳体，提示“后续由 Story 1.3 与 Story 1.4 接入真实读取、保存、权限和反馈流程”；本故事应把其中的“真实读取”部分落地。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue]
- `apps/api/src/routes/notes.ts` 目前只有 `/shell-status` 占位接口，尚未具备真正的 `GET /api/notes/:sid` 读取能力。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/routes/notes.ts]
- `apps/web/src/services/http-client.ts` 当前只有 `apiBaseUrl` 与回调地址工具函数，尚未初始化请求实例或 note 读取方法。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/services/http-client.ts]
- `packages/shared-types/src/index.ts` 目前仅有壳体级类型，没有 note 详情 DTO；1.3 是第一次需要前后端共享在线便签读取契约。 [Source: /Users/youranreus/Code/Projects/note/packages/shared-types/src/index.ts]
- `apps/web` 已经存在 `LoadingCard`、`InlineFeedback`、`SurfaceCard` 等 foundation 组件，1.3 应优先复用它们来承接读取态，而不是在 `features/note` 再造新的状态反馈容器。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/home/FoundationShowcase.vue]

### Architecture Guardrails

- 前后端通信风格已明确为 `Axios transport + Alova request state/cache`，前端不要绕过既定方案直接手写散落的 `fetch`。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md#api--communication-patterns]
- 前端分层必须继续遵循 `views / features / components / services / router`，让 `views` 负责装配、`features` 负责业务，避免把请求与状态机直接堆进 view。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md#frontend-architecture]
- API 错误语义至少要能区分“资源不存在”“资源已删除”，并保持稳定的 `code + message` 结构，为前端状态分支提供可靠依据。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md#format-patterns]
- `sid` 是会影响 API、路由、分享链路和删除语义的核心对象模型，因此 1.3 不允许引入会稀释唯一性的临时实现。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md#decision-impact-analysis]

### UX Guidance

- 旅程 1 明确要求用户进入 `/note/o/:sid` 后，应立即感知“这个地址已经成立，可以继续维护”；对于 1.3，这意味着至少要展示当前对象内容与 `sid` 关联，而不是继续停留在技术占位文案。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md#旅程-1快速进入在线便签并获得固定入口]
- `NoteObjectHeader` 在 UX 中被定义为在线便签页顶部的对象级状态区，用于强化“固定入口对象”心智；1.3 可以先为它预留结构，但不要一次性实现完整的保存/分享/权限动作。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md#noteobjectheader]
- 失败与处理中间态必须有明确文本，不只依赖颜色或动画；因此 not-found / deleted / loading 都应是可读状态，而不是空白容器。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md#flow-optimization-principles]

### Data and API Notes

- 技术方案已经建议 `GET /api/notes/:sid` 作为在线便签详情读取接口，这与当前 Story 1.3 的需求直接一致。 [Source: /Users/youranreus/Code/Projects/note/docs/tech-solution.md#53-模块接口建议]
- 数据库设计强调 `notes.sid` 必须唯一，历史方案中的 `findFirst` / `deleteMany` 正是需要被消除的风险；即便 1.3 只实现读取，也不能走回旧路径。 [Source: /Users/youranreus/Code/Projects/note/docs/database-design.md#15-现状问题重构驱动]
- `notes` 目标模型已给出 `sid / content / key_hash / author_id / deleted_at` 等字段，1.3 读取链路至少应把 `deleted_at` 语义映射成“已删除不可读”的可判定结果。 [Source: /Users/youranreus/Code/Projects/note/docs/database-design.md#22-表结构定义建议]

### File Structure Requirements

- 预计至少会修改：
  - `apps/api/src/routes/notes.ts`
  - `apps/api/src/services/*`
  - `apps/api/src/schemas/*`
  - `apps/web/src/services/http-client.ts`
  - `apps/web/src/views/OnlineNoteView.vue`
  - `apps/web/src/features/note/components/OnlineNoteShell.vue`
  - `packages/shared-types/src/index.ts`
- 建议新增并优先放在以下位置：
  - `apps/api/src/services/note-read-service.ts`
  - `apps/api/src/schemas/note.ts`
  - `apps/web/src/features/note/use-online-note.ts` 或 `apps/web/src/features/note/online-note.ts`
  - `apps/web/tests/online-note.spec.ts`
  - `apps/api/tests/notes-read.spec.ts` 或现有 API 测试目录下的等价文件
- 不应修改：
  - `apps/web/src/features/home/*`
  - `apps/web/src/features/local-note/*`
  - `apps/api/src/routes/auth.ts`
  - 收藏、个人中心、编辑密钥相关 feature

### Testing Requirements

- API 测试至少覆盖：
  - `GET /api/notes/:sid` 返回 200 且内容正确
  - 资源不存在时返回稳定 not-found 语义
  - 资源已删除时返回稳定 deleted 语义
  - 异常/空 `sid` 参数不会被当成正常对象读取
- 前端测试至少覆盖：
  - 在线便签页加载时出现明确 loading 状态
  - 成功读取后渲染最新内容
  - `not-found` 与 `deleted` 分别显示不同反馈
  - 未登录访客访问成功态时不会触发登录阻断
- 回归测试至少覆盖：
  - `resolveSidParam` 既有行为不变
  - 首页从 Story 1.2 跳入在线页的路由仍正常
  - `pnpm --filter @note/web typecheck`
  - `pnpm --filter @note/api typecheck`

### Git Intelligence Summary

- 最近相关提交已经把首页 SID 进入链路与 review 修正落地，说明当前开发节奏正从“入口”切到“在线对象读取”，1.3 应紧贴这条主路径，不要重新回到脚手架层。 [Source: `git log --oneline -5` on 2026-04-02]
- 最近可见提交中没有在线读取能力的实现痕迹，当前 API 和在线页都仍是 shell，因此这条 story 的价值和边界都很清晰。 [Source: `git log --oneline -5` on 2026-04-02]

### Scope Boundaries

- 不在本故事实现：
  - 在线便签首次保存或更新
  - 分享链接复制与保存反馈
  - 登录回跳恢复
  - 收藏、我的创建、我的收藏
  - 编辑密钥或默认编辑权
  - 本地便签模式的读取与持久化
- 如果为完成读取链路必须补少量基础设施，应以“最小可运行读取链路”为原则，不要顺手扩张到完整 CRUD。
- “最小可运行读取链路”指真实读取架构最小闭环，而不是用 mock 数据、静态常量或演示内容制造已完成假象。

### References

- [epics.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md)
- [prd.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md)
- [architecture.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md)
- [ux-design-specification.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md)
- [project-context.md](/Users/youranreus/Code/Projects/note/_bmad-output/project-context.md)
- [tech-solution.md](/Users/youranreus/Code/Projects/note/docs/tech-solution.md)
- [database-design.md](/Users/youranreus/Code/Projects/note/docs/database-design.md)
- [1-2-home-sid-entry-mode-selection.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-2-home-sid-entry-mode-selection.md)
- [OnlineNoteView.vue](/Users/youranreus/Code/Projects/note/apps/web/src/views/OnlineNoteView.vue)
- [OnlineNoteShell.vue](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue)
- [notes.ts](/Users/youranreus/Code/Projects/note/apps/api/src/routes/notes.ts)
- [http-client.ts](/Users/youranreus/Code/Projects/note/apps/web/src/services/http-client.ts)
- [sid.ts](/Users/youranreus/Code/Projects/note/apps/web/src/router/sid.ts)
- [index.ts](/Users/youranreus/Code/Projects/note/packages/shared-types/src/index.ts)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 已从 `sprint-status.yaml` 确认当前第一条 backlog story 为 `1-3-read-online-note-by-sid`。
- 已抽取 Epic 1 中 Story 1.3 的原始 AC，并对照 PRD、架构、UX、技术方案与数据库设计补全实现约束。
- 已读取 Story 1.2 完整故事文档，继承其关于 `sid` 唯一对象心智、严格参数处理、feature 内聚与测试优先的实施经验。
- 已核对当前代码库，确认 `apps/api/src/routes/notes.ts` 仍为 shell 接口、`OnlineNoteShell.vue` 仍为占位实现、`packages/shared-types` 尚无 note DTO。
- 已将 1.3 的任务边界收紧为“在线只读读取链路”，明确把保存、分享反馈、权限升级与收藏排除到后续 stories。

### Completion Notes List

- Story 1.3 已按当前 sprint 顺序创建为 `ready-for-dev`。
- 文档已补齐读取链路所需的 API、前端、共享类型、状态语义、测试与边界说明，不再只是复制 epics 原文。
- 已把前一故事的 learnings 与当前仓库真实缺口整合进 Dev Notes，降低后续 `DS` 误把 1.3 扩张成完整 CRUD 的风险。
- VS 已补充两项防偏航约束：禁止用假数据伪完成在线读取，以及要求优先复用既有 foundation 状态组件。

### File List

- `_bmad-output/implementation-artifacts/1-3-read-online-note-by-sid.md`
