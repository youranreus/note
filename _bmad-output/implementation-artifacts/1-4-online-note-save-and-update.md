# Story 1.4: 在线便签的首次保存与持续更新

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 创建者，
I want 在同一 `sid` 下保存并持续更新在线便签内容，
so that 我分享出去的链接始终对应最新版本。

## Acceptance Criteria

1. 用户进入一个尚未保存过内容的在线便签 `sid` 时，首次执行保存，系统应创建该 `sid` 对应的便签记录，且之后再次进入同一链接时可以读取到刚保存的内容。
2. 用户正在编辑一个已存在的在线便签时，再次保存更新后的内容，系统应在同一 `sid` 下更新最新内容，且已分享链接不应发生变化。
3. 前后端执行保存链路时，服务端应保证按 `sid` 的幂等创建或更新语义，且保存结果应以明确成功或失败反馈返回给前端。

## Tasks / Subtasks

- [x] Task 1: 补齐在线便签保存契约与前端状态语义 (AC: 1, 2, 3)
  - [x] 在 `packages/shared-types` 中新增在线便签保存所需的最小 DTO 与错误语义，继续保持应用层 `camelCase` 字段命名，不把数据库 `snake_case` 直接暴露给前端。
  - [x] 保存请求体应只承载当前故事真正需要的最小信息（至少包含 `content`，`sid` 继续来自路由参数），不要在 1.4 提前引入作者、收藏、编辑密钥或权限派生字段。
  - [x] 保存成功响应至少应让前端能够明确区分“首次创建”与“已有对象更新”，并回收最新 `sid` / `content` 与稳定的保存结果语义；若当前基础设施暂不适合返回完整审计时间，可先以明确的 `created` / `updated` 结果保证用户反馈，不要虚构时间字段。
  - [x] 前端本地状态需补出“未保存 / 保存中 / 已保存 / 保存失败”这组最小写入反馈语义，但这些 UI 状态仍应留在 `features/note` 局部，不进入 Pinia。

- [x] Task 2: 在 `apps/api` 落地按 `sid` 幂等创建或更新的写入链路 (AC: 1, 2, 3)
  - [x] 在现有 `GET /api/notes/:sid` 基础上新增 `PUT /api/notes/:sid`，继续保持 `routes -> schemas -> services -> repository/infra` 分层，不把幂等写入、冲突判断和错误映射塞进 route handler。
  - [x] 新增写入 schema 与 `note-write-service`（或等价独立写服务），并在 `apps/api/src/app.ts` 中提供与读取链路一致的依赖注入入口，便于沿用 Fastify `inject` 测试风格。
  - [x] 服务端必须以 `sid` 作为唯一业务键收口“首次保存创建 + 再次保存更新”语义；优先使用事务、唯一索引或等价机制避免并发下重复创建，不允许退回 `findFirst`、模糊查询或“先随便取一条再覆盖”的实现。
  - [x] 若当前数据库基础设施仍未补齐 `notes.sid` 唯一约束或 Prisma `Note` 模型，应先补足 Story 1.4 所需的最小写入前提；若历史重复 `sid` 风险尚未完全清理，服务层也必须继续显式返回稳定冲突语义，而不是静默覆盖不确定记录。
  - [x] 已删除对象不能在 1.4 中被保存请求静默“复活”；如果命中 `deleted_at` 记录，应返回稳定的不可写错误语义，为 Epic 4 的不可恢复终态保持一致空间。
  - [x] 不允许用内存数组、mock 持久化或纯前端假成功来伪造“已保存”；Story 1.4 必须落到真实 API 写入闭环。

- [x] Task 3: 在 `apps/web` 建立在线便签编辑草稿与保存请求能力 (AC: 1, 2, 3)
  - [x] 在 `apps/web/src/services/note-methods.ts` 中补齐 `PUT /api/notes/:sid` 的 alova method，继续复用现有 `axios + alova` 请求底座，不新增第二套 HTTP 封装。
  - [x] 基于现有 `use-online-note.ts` / `online-note.ts` 组织方式，新增或扩展 `features/note` 内的 composable / 状态适配模块，让保存逻辑继续由 feature 承担，`OnlineNoteView.vue` 保持薄层。
  - [x] 草稿内容应始终以当前路由 `sid` 为对象边界：读取成功时用远端内容初始化编辑区；首次进入且 `not-found` 时，用空草稿进入“尚未保存”的可编辑态；切换到其他 `sid` 时，旧对象草稿和保存状态必须被正确重置。
  - [x] 在远端内容回填与本地编辑之间，需要显式处理“初始化同步”和“用户已修改”的边界，避免请求重试或重复读取把用户尚未保存的草稿静默覆盖掉。
  - [x] Story 1.4 默认站在 Epic 1 的最小主路径上：不要提前接入登录创建者默认编辑权、编辑密钥或收藏逻辑；未登录用户在该阶段仍应能完成首次保存与持续更新的闭环，但实现上应给 Epic 2 的权限服务扩展留好接口边界。

- [x] Task 4: 将在线便签页从只读消费页推进为可创建、可更新的编辑页 (AC: 1, 2, 3)
  - [x] `apps/web/src/features/note/components/OnlineNoteShell.vue` 当前的 `not-found` 分支不能再只是终态提示；在 1.4 中，它应演进为“该 `sid` 尚未保存内容”的可编辑起始态，让用户能够直接输入正文并首次保存创建对象。
  - [x] `available` 分支应从只读 `<pre>` 展示升级为可编辑正文区域，并在保存成功后继续展示该 `sid` 的最新远端内容，确保“更新后链接不变、内容变新”的心智清晰可见。
  - [x] `deleted`、`invalid-sid` 和通用 `error` 仍应保持非伪造对象的异常态，不允许在这些状态下偷偷降级成“随便创建一个新对象”。
  - [x] 页面至少需要明确表达：当前对象 `sid`、当前是否尚未保存、保存是否进行中、上一次保存是否成功或失败；反馈优先复用现有 `InlineFeedback`、`LoadingCard`、`SurfaceCard`、`Button`、`TextInput` 等基础组件或在其上做最小增强，不重新发明在线页专用基础控件。
  - [x] Story 1.4 可以在当前页面结构中加入最小保存反馈，但不要提前吞并 Story 1.5 的完整 `NoteObjectHeader`、复制链接入口或完整分享状态条；现有“预留对象头部 / 保存反馈”区域应继续保留给后续故事扩展。

- [x] Task 5: 维持故事边界并保护已有读取链路回归 (AC: 1, 2, 3)
  - [x] 保持 `OnlineNoteView.vue` 继续只做路由参数解析与 `sid` 传递，严格沿用 `resolveSidParam()` 的“单个非空字符串”边界，不把非法路由参数自动转成可保存对象。
  - [x] 不在本故事实现复制分享链接、收藏、个人中心、SSO 回跳、编辑密钥、默认编辑权或本地便签持久化；这些能力分别属于 Story 1.5、Epic 2、Epic 3 与 Story 1.6。
  - [x] 不要把在线便签远端详情、保存草稿或结果状态塞入 Pinia，继续遵守“Pinia 管会话/UI，alova 管远端数据，feature 局部状态管编辑过程”的边界。
  - [x] 不要把保存行为做成静默 autosave 并跳过明确反馈；本故事的目标是让用户感知到“我刚刚保存了”以及“保存失败了”，以满足 FR16 / NFR3，而不是悄悄发请求。

- [x] Task 6: 为首次保存与持续更新链路补齐测试与验收 (AC: 1, 2, 3)
  - [x] API 测试至少覆盖：首次 `PUT /api/notes/:sid` 创建成功、再次 `PUT /api/notes/:sid` 更新成功、空白 `sid` 被拒绝、重复 `sid` 冲突语义稳定、已删除对象不会被写入链路静默复活。
  - [x] 前端测试至少覆盖：`not-found` 状态进入可编辑新建态、已存在对象加载后可编辑并保存、保存中有明确反馈、保存失败有明确反馈、保存成功后页面反映最新内容且仍停留在同一 `sid`。
  - [x] 保持 Story 1.3 已有读取测试继续通过，特别是：`shell-status` 保留字 `sid` 仍可正常读取真实对象、`/api/notes/__meta/shell-status` 元路径不被破坏、非法 `sid` 仍被拒绝。
  - [x] 至少执行 `pnpm --filter @note/api test`、`pnpm --filter @note/web test`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/web typecheck`；若页面结构与请求方法改动较大，补跑对应 `build` 作为集成兜底。

## Dev Notes

### Story Intent

本故事的职责，是把 Epic 1 的在线便签从“可被打开和读取”推进到“可以在同一固定链接下真正产生内容并持续维护”。用户第一次从首页进入一个全新的 `sid` 时，不应再被 `not-found` 挡住；他应能直接开始输入、首次保存创建对象，并在后续继续更新同一链接下的最新内容。

### Requirement Traceability

- FR4, FR11, FR12, FR16, FR24, FR25, FR27, FR29
- NFR1, NFR3, NFR10, NFR11, NFR12, NFR14, NFR19, NFR20
- UX-DR5, UX-DR6, UX-DR14, UX-DR15, UX-DR16, UX-DR19

### Cross-Story Context

- Story 1.2 已把首页在线入口固定导向 `/note/o/:sid`，并明确该 `sid` 是后续读取与保存的唯一对象标识；1.4 应直接承接这个入口，不要回到首页重新发明对象来源。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/implementation-artifacts/1-2-home-sid-entry-mode-selection.md]
- Story 1.3 已完成“匿名按唯一 `sid` 读取”的最小闭环，因此 1.4 不需要重做读取架构，而应在既有读链路上叠加写入与编辑体验。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/implementation-artifacts/1-3-read-online-note-by-sid.md]
- Story 1.5 才负责完整对象头部、复制链接和主路径反馈强化；1.4 只需要把保存反馈做清楚，不要一次性把 `NoteObjectHeader` 的完整分享/权限表达全部吞并。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/epics.md]
- Epic 2 才引入“登录创建者默认编辑权 + 编辑密钥共享编辑权”的正式权限模型，所以 1.4 的目标是先建立最小保存闭环，而不是提前实现完整鉴权。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/prd.md]
- Epic 4 定义删除为不可恢复终态，因此 1.4 的写链路不能把已删除对象默默复活。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/epics.md] [Source: /Users/reuszeng/Code/Projects/note/docs/database-design.md]

### Previous Story Intelligence

- Story 1.3 已把 `GET /api/notes/:sid` 收口为真实读取入口，且通过 `NoteSidConflictError` 显式阻断重复 `sid` 风险；1.4 的写链路必须延续这条“唯一对象语义优先于临时可跑”的基调。 [Source: /Users/reuszeng/Code/Projects/note/apps/api/src/routes/notes.ts] [Source: /Users/reuszeng/Code/Projects/note/apps/api/src/services/note-read-service.ts]
- Story 1.3 已将 notes 模块保留壳体从 `/api/notes/shell-status` 移到 `/api/notes/__meta/shell-status`，避免合法 `sid=shell-status` 被吞掉；1.4 的 `PUT` 路由和相关测试不能把这个修复回退。 [Source: /Users/reuszeng/Code/Projects/note/apps/api/tests/notes-read.spec.ts]
- Story 1.3 前端状态机已经把 `available / not-found / deleted / invalid-sid / error` 统一成 `features/note/online-note.ts` 中的 view model；1.4 应继续沿用这个集中状态适配模式，而不是在组件模板里散落 if/else。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/features/note/online-note.ts]
- Story 1.3 当前 `OnlineNoteShell.vue` 把 `not-found` 当作终态反馈；1.4 的关键变化之一，是把这个分支改造成“可首次保存”的新建态，这一点如果遗漏，Story 1.4 的主价值就无法成立。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue]
- Story 1.3 已确认 `OnlineNoteView.vue` 只负责从路由取 `sid` 并传给 shell；1.4 必须保持这个薄层模式，不把保存状态和请求拼进 view。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/views/OnlineNoteView.vue]

### Current Codebase Reality Check

- `apps/web/src/features/note/components/OnlineNoteShell.vue` 当前仍带有“只读消费页”“预留对象头部 / 保存反馈”占位文案，说明页面结构已经为 1.4 / 1.5 预留了扩展点；1.4 应把“可编辑 + 可保存”接进去，而不是重做整个页面骨架。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue]
- `apps/web/src/features/note/use-online-note.ts` 当前只有 `GET` 请求封装与读取 viewModel，尚未管理本地草稿、保存动作或保存反馈。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/features/note/use-online-note.ts]
- `apps/web/src/services/note-methods.ts` 目前只有 `createGetOnlineNoteDetailMethod()`，是 1.4 新增写方法的最直接位置。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/services/note-methods.ts]
- `packages/shared-types/src/index.ts` 当前只定义了读取 DTO 与错误码，没有保存请求/响应 DTO，也没有“创建/更新结果”语义。 [Source: /Users/reuszeng/Code/Projects/note/packages/shared-types/src/index.ts]
- `apps/api/src/routes/notes.ts` 当前只有 `GET /:sid`，`apps/api/src/schemas/note.ts` 也只有读取 schema；1.4 需要在这里新增 `PUT` 写链路与对应的 body/response/error schema。 [Source: /Users/reuszeng/Code/Projects/note/apps/api/src/routes/notes.ts] [Source: /Users/reuszeng/Code/Projects/note/apps/api/src/schemas/note.ts]
- `apps/api/src/app.ts` 当前的依赖注入只暴露了 `noteReadService`，这对测试友好；1.4 最自然的扩展方式是追加 `noteWriteService`，而不是直接在测试里打桩整个 route 文件。 [Source: /Users/reuszeng/Code/Projects/note/apps/api/src/app.ts]
- `apps/api/prisma/schema.prisma` 当前仍只有 generator / datasource 壳体，没有 `Note` 模型；如果 1.4 需要更稳的写入实现，应优先补“支撑写入的最小前提”，不要因为 schema 空壳而回退到不可靠的临时实现。 [Source: /Users/reuszeng/Code/Projects/note/apps/api/prisma/schema.prisma]

### Technical Requirements

- 前端继续使用 `Vue 3 + TypeScript + alova + axios`，后端继续使用 `Fastify + TypeScript`，不要为 1.4 引入新的请求库、状态库或表单库。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/package.json] [Source: /Users/reuszeng/Code/Projects/note/apps/api/package.json]
- 当前 HTTP 基座已固定为 `axiosClient + alovaClient`，所有在线便签读写请求都应继续通过 `apps/web/src/services/http-client.ts` 这一底座发出。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/services/http-client.ts]
- `sid` 仍是唯一对象标识，前端路由参数只接受单个非空字符串；任何空白或异常参数都必须停在 `invalid-sid`，不能被“首次保存”兜底成伪造对象。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/router/sid.ts]
- 后端响应结构继续遵循“成功返回直接业务对象，失败返回稳定 `code + status + message`”模式；保存失败不能只返回模糊 500 文案。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 保存反馈必须足够快且足够清楚，不能做成点击后长时间静默；这是 NFR3 的直接约束。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/prd.md]
- 在线与本地模式边界必须继续明确：1.4 只修改 `features/note` 与 `notes` API，不得把本地便签存储逻辑混进来。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md] [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/project-context.md]

### Architecture Compliance Guardrails

- `views` 继续只做路由装配，在线便签写入状态放在 `features/note`；不要把编辑器局部状态或保存反馈塞回 `views`。
- `routes` 只做参数读取、schema 校验和响应映射；写入事务、唯一性判断、删除终态判断放在 `services` / repository。
- `packages/shared-types` 继续作为前后端契约收口点，保存 DTO 不要只定义在单端本地类型里。
- Pinia 只管理会话与 UI；在线便签详情与写入结果继续走 alova + feature 局部状态，不制造第二个全局真值源。
- 若需要补最小 Prisma / SQL 写入层，也应优先放在 `apps/api/src/services` / `infra` 相邻位置，保持和 1.3 读链路同样的 seam，而不是把 SQL 直接内联进 route。

### Library / Framework Requirements

- 当前仓库前端版本固定为：`vue@^3.5.13`、`alova@^3.0.6`、`axios@^1.7.9`、`vitest@^2.1.8`；不要无需求升级版本。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/package.json]
- 当前仓库后端版本固定为：`fastify@^5.0.0`、`@prisma/client@^5.22.0`、`prisma@^5.22.0`、`vitest@^2.1.8`；故事实现应在这个版本面内完成。 [Source: /Users/reuszeng/Code/Projects/note/apps/api/package.json]
- 前端当前已经在 `use-online-note.ts` 中采用 `useRequest` + `watch` + `abort` 的模式处理按 `sid` 切换请求；保存链路优先延续这一风格，而不是再引入另一种异步编排方式。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/features/note/use-online-note.ts]
- 现有 foundation 组件已包含 `InlineFeedback`、`LoadingCard`、`SurfaceCard` 等状态承载器；若需要输入 / 按钮增强，应优先复用或轻量扩展既有组件。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue] [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]

### UX Guidance

- UX 明确要求在线便签结果页强化“固定入口对象”心智，清楚展示当前 `sid`、保存状态、可分享状态和编辑权限状态；1.4 至少要先把“当前对象 + 保存状态”做出来。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md#noteobjectheader]
- 成功保存、失败保存等反馈应优先采用轻量但明确的反馈模式，优先 inline status 或轻量 toast，不要通过大弹窗打断主路径。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md#feedback-patterns]
- 状态提示不能只依赖颜色；“保存中”“已保存”“保存失败”都必须有文字表达。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md#accessibility-strategy]
- 用户进入新 `sid` 后，应感知到“这个地址已经成立，可以开始写内容”，而不是只看到一个 not-found 错误页；这是 1.4 相比 1.3 的核心体验转折。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md#critical-success-moments]

### Data and API Notes

- 技术方案已明确建议 `PUT /api/notes/:sid` 表达“更新便签内容（不存在则创建）”，这是 Story 1.4 的直接接口语义。 [Source: /Users/reuszeng/Code/Projects/note/docs/tech-solution.md]
- 技术方案同时强调“首次保存创建 + 更新”应置于事务中，避免并发下重复创建；如果 dev agent 省略这一点，就无法真正满足 AC3。 [Source: /Users/reuszeng/Code/Projects/note/docs/tech-solution.md]
- 数据库设计要求 `notes.sid` 全局唯一，且删除为不可恢复终态；若 1.4 因当前 schema 空壳而继续沿用临时实现，也必须显式说明并收口风险，不能把不确定性埋进业务逻辑里。 [Source: /Users/reuszeng/Code/Projects/note/docs/database-design.md]
- Story 1.3 目前通过 SQL `SELECT ... ORDER BY id DESC LIMIT 2` 显式检查重复 `sid`；1.4 写入若暂未完整切到 Prisma model，也至少要保持同样级别的唯一性风险感知。 [Source: /Users/reuszeng/Code/Projects/note/apps/api/src/services/note-read-service.ts]

### File Structure Requirements

- 预计至少会修改：
  - `apps/api/src/app.ts`
  - `apps/api/src/routes/notes.ts`
  - `apps/api/src/schemas/note.ts`
  - `apps/web/src/features/note/components/OnlineNoteShell.vue`
  - `apps/web/src/features/note/online-note.ts`
  - `apps/web/src/features/note/use-online-note.ts`
  - `apps/web/src/services/note-methods.ts`
  - `packages/shared-types/src/index.ts`
- 建议新增并优先放在以下位置：
  - `apps/api/src/services/note-write-service.ts`
  - `apps/api/tests/notes-write.spec.ts`（或在现有 `notes-read.spec.ts` 基础上扩展等价测试）
  - `apps/web/src/features/note/use-online-note-save.ts`（若保存状态拆分为独立 composable 更清晰）
  - `apps/web/tests/online-note.spec.ts`（直接扩展保存场景）或 `apps/web/tests/online-note-save.spec.ts`
- 如需补最小数据库建模前提，可触达：
  - `apps/api/prisma/schema.prisma`
- 不应修改：
  - `apps/web/src/features/home/*`
  - `apps/web/src/features/local-note/*`
  - `apps/web/src/routes/auth.ts`
  - 收藏、个人中心、SSO 回跳与编辑密钥相关 feature

### Testing Requirements

- API 测试至少覆盖：
  - 新 `sid` 首次保存返回创建成功语义
  - 已存在 `sid` 再次保存返回更新成功语义
  - `PUT` 后通过 `GET /api/notes/:sid` 可读到最新内容
  - 空白 `sid` 返回稳定 400
  - 重复 `sid` / 冲突状态返回稳定错误语义
  - 已删除记录不会被 `PUT` 默默复活
- 前端测试至少覆盖：
  - `not-found` 不再只是错误提示，而是可输入的未保存编辑态
  - 已存在内容加载后会回填到编辑区
  - 点击保存后出现保存中反馈，成功后转为已保存反馈
  - 保存失败时保留用户草稿并显示明确失败反馈
  - `deleted` / `invalid-sid` / 通用 error 不会误显示成可保存新对象
- 回归测试至少覆盖：
  - `shell-status` 合法 `sid` 读取行为不被破坏
  - `__meta/shell-status` 元路径仍存在
  - `resolveSidParam()` 既有严格行为不变
  - 未登录访问有效分享链接时，现有读取体验不被登录前置阻断

### Git Intelligence Summary

- 最近提交顺序显示当前开发节奏是“首页入口 -> Story 1.3 上下文 -> 在线对象主路径”，因此 1.4 应继续沿着在线对象主路径推进，而不是回头重做脚手架或切换技术栈。 [Source: `git log --oneline -5` on 2026-04-03]
- 最近历史没有任何 notes 写接口或保存态实现痕迹，说明 Story 1.4 的价值边界非常清楚：它就是第一次把“读取得到的对象”变成“可以真实创建和更新的对象”。 [Source: `git log --oneline -5` on 2026-04-03]

### Scope Boundaries

- 不在本故事实现完整 `NoteObjectHeader`、复制分享链接、收藏按钮或完整对象工具条。
- 不在本故事实现登录创建者默认编辑权、编辑密钥共享编辑、权限输入框或任何需要 SSO 的受控写入流程。
- 不在本故事实现删除接口、删除确认或删除后的统一反馈体系。
- 不在本故事实现本地便签持久化、跨模式同步或自动从在线回退到本地。
- 不在本故事为了“尽快可用”而引入假保存、静态 demo 内容、无事务的脆弱多记录覆盖逻辑。

### References

- [epics.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/epics.md)
- [prd.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/prd.md)
- [architecture.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md)
- [ux-design-specification.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md)
- [project-context.md](/Users/reuszeng/Code/Projects/note/_bmad-output/project-context.md)
- [tech-solution.md](/Users/reuszeng/Code/Projects/note/docs/tech-solution.md)
- [database-design.md](/Users/reuszeng/Code/Projects/note/docs/database-design.md)
- [1-2-home-sid-entry-mode-selection.md](/Users/reuszeng/Code/Projects/note/_bmad-output/implementation-artifacts/1-2-home-sid-entry-mode-selection.md)
- [1-3-read-online-note-by-sid.md](/Users/reuszeng/Code/Projects/note/_bmad-output/implementation-artifacts/1-3-read-online-note-by-sid.md)
- [OnlineNoteView.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/views/OnlineNoteView.vue)
- [OnlineNoteShell.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue)
- [use-online-note.ts](/Users/reuszeng/Code/Projects/note/apps/web/src/features/note/use-online-note.ts)
- [online-note.ts](/Users/reuszeng/Code/Projects/note/apps/web/src/features/note/online-note.ts)
- [note-methods.ts](/Users/reuszeng/Code/Projects/note/apps/web/src/services/note-methods.ts)
- [http-client.ts](/Users/reuszeng/Code/Projects/note/apps/web/src/services/http-client.ts)
- [sid.ts](/Users/reuszeng/Code/Projects/note/apps/web/src/router/sid.ts)
- [notes.ts](/Users/reuszeng/Code/Projects/note/apps/api/src/routes/notes.ts)
- [note.ts](/Users/reuszeng/Code/Projects/note/apps/api/src/schemas/note.ts)
- [note-read-service.ts](/Users/reuszeng/Code/Projects/note/apps/api/src/services/note-read-service.ts)
- [notes-read.spec.ts](/Users/reuszeng/Code/Projects/note/apps/api/tests/notes-read.spec.ts)
- [online-note.spec.ts](/Users/reuszeng/Code/Projects/note/apps/web/tests/online-note.spec.ts)
- [schema.prisma](/Users/reuszeng/Code/Projects/note/apps/api/prisma/schema.prisma)
- [index.ts](/Users/reuszeng/Code/Projects/note/packages/shared-types/src/index.ts)

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- 已完整读取 `sprint-status.yaml`，确认下一条 backlog story 为 `1-4-online-note-save-and-update`。
- 已分析 `epics.md`、`prd.md`、`architecture.md`、`ux-design-specification.md`、`project-context.md`、`tech-solution.md` 与 `database-design.md`，提取 Story 1.4 的功能边界与幂等写入约束。
- 已复盘 Story 1.2 与 Story 1.3 产物，确认 1.4 必须直接承接“首页稳定导入的 sid”与“按 sid 读取”的既有链路，而不是重做入口或读取架构。
- 已检查当前代码库，确认在线便签仍只有 GET 读取能力，`not-found` 仍是终态提示，`Prisma schema` 仍未落 `Note` 模型，因此故事文档已把这些现实缺口显式纳入实施约束。
- 已把“`not-found` 必须演进为可首次保存的新建态”“已删除对象不能被写链路静默复活”“不要越界吞并 Story 1.5 / Epic 2”列为本 story 的关键 guardrails。
- 已先补 `apps/api/tests/notes-write.spec.ts` 与 `apps/web/tests/online-note.spec.ts`，用红灯测试锁定首次保存、更新、冲突、删除终态与保存反馈行为。
- 已实现共享保存 DTO、`PUT /api/notes/:sid`、`note-write-service`、Prisma `Note` 模型声明，以及 `features/note` 内的草稿同步与保存状态管理。
- 已完成 `pnpm --filter @note/shared-types build`、`pnpm --filter @note/api test`、`pnpm --filter @note/web test`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/web typecheck`、`pnpm --filter @note/api build` 与 `pnpm --filter @note/web build` 验证，且全部通过。
- 已针对 review patch 复查 `use-online-note.ts`、`note-write-service.ts` 与相关测试，确认当前剩余工作集中在终态回落、sid 切换竞态、数据库初始化脚本与真实链路回归覆盖。
- 已新增真实 `useOnlineNote` 状态机测试与 `createPrismaNoteWriteRepository()` 锁/事务测试，并跑通 `pnpm test` 全仓回归，确认 Story 1.4 可以推进到 `review`。

### Completion Notes List

- 已完成 Story 1.4 的真实在线写入闭环：首次保存创建对象、再次保存更新同一 `sid`，并通过明确的 `created` / `updated` 结果语义反馈给前端。
- 已把在线页从只读消费页推进为可编辑页：`not-found` 进入可创建态，`available` 支持持续更新，`deleted` / `invalid-sid` / `error` 保持不可伪造的异常态。
- 已在 `features/note` 内收口“未保存 / 保存中 / 已保存 / 保存失败”最小本地写入状态，并处理 sid 切换、远端回填与用户未保存草稿不被覆盖的边界。
- 已补齐 API / Web 测试与类型构建验证，确认 Story 1.3 读取回归保持通过，Story 1.4 新增保存链路达到 review 条件。
- 已修复终态写入错误回落：当保存命中 `NOTE_DELETED` / `NOTE_SID_CONFLICT` 时，在线页现在会切回不可编辑的 `deleted` / `error` 状态，不再伪装成可继续保存的对象。
- 已修复 sid 切换竞态：旧保存请求在用户切换到新 `sid` 后即使晚到，也不会再污染当前页面的草稿、基线内容或读取结果。
- 已补齐数据库初始化脚本：`pnpm --filter @note/api db:init` 现在会先执行 `prisma db push` 再生成 client，把 `notes.sid` 的唯一约束真正落到数据库。
- 已新增真实回归覆盖：前端直接测试 `useOnlineNote` 状态机，后端直接测试 `createPrismaNoteWriteRepository()` 的锁与写入分支，同时补上“更新后再 GET 读到最新内容”的 API 验收。

### File List

- `_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/api/prisma/schema.prisma`
- `apps/api/package.json`
- `apps/api/src/app.ts`
- `apps/api/src/routes/notes.ts`
- `apps/api/src/schemas/note.ts`
- `apps/api/src/services/note-write-service.ts`
- `apps/api/tests/note-write-service.spec.ts`
- `apps/api/tests/notes-write.spec.ts`
- `apps/web/src/components/ui/TextInput.vue`
- `apps/web/src/features/note/components/OnlineNoteShell.vue`
- `apps/web/src/features/note/online-note.ts`
- `apps/web/src/features/note/use-online-note.ts`
- `apps/web/src/services/note-methods.ts`
- `apps/web/tests/online-note.spec.ts`
- `apps/web/tests/use-online-note.spec.ts`
- `packages/shared-types/src/index.ts`

### Change Log

- 2026-04-03: 创建 Story 1.4《在线便签的首次保存与持续更新》实施上下文文档，并将写入链路、前端编辑态、幂等约束与测试要求整理为 ready-for-dev 指南。
- 2026-04-03: 完成 Story 1.4 实现，新增 `PUT /api/notes/:sid` 幂等写入链路、在线页保存反馈与首次保存/持续更新测试，并将故事状态推进到 `review`。
- 2026-04-03: Addressed code review findings - 4 items resolved，补齐终态回落、sid 切换竞态、`db:init` 唯一约束落库，以及前后端真实保存链路回归覆盖。

### Review Findings

- [x] [Review][Patch] 终态写入错误未回落到不可编辑状态 [apps/web/src/features/note/use-online-note.ts:142] — `saveNote()` 在命中 `NOTE_DELETED` / `NOTE_SID_CONFLICT` 时只设置 `save-error` 与文案，不更新 `viewModel`；当前页仍会以 `available` / `not-found` 继续渲染编辑器，违反“`deleted` / `error` 不得伪装成可保存对象”的故事约束。
- [x] [Review][Patch] 切换 sid 后旧保存结果可能污染当前页面 [apps/web/src/features/note/use-online-note.ts:114] — 保存请求返回后没有再次确认当前路由 sid 是否仍等于提交 sid；若用户在请求未完成时切到其他对象，旧响应仍会覆写 `baselineContent`、`draftContent` 与 `readRequest`。
- [x] [Review][Patch] `notes.sid` 唯一约束只写进 Prisma schema，尚未真正落库 [apps/api/package.json:12] — 当前 `db:init` 只执行 `prisma generate`；`schema.prisma` 中新增的 `sid @unique` 不会自动创建数据库唯一索引，Story 1.4 宣称已补齐写入前提，但真实数据库约束仍未被应用。
- [x] [Review][Patch] Story 1.4 的验收测试未覆盖真实保存链路 [apps/web/tests/online-note.spec.ts:34] — 前端测试直接 mock 掉 `useOnlineNote`，API 测试注入 fake service，导致真实 `use-online-note.ts` 状态机与 `note-write-service.ts` 事务/锁逻辑未被回归；同时缺少“更新后再 GET 读到最新内容”的 API 覆盖。
