# Story 2.2: 已登录创建者的默认编辑权

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 已登录创建者，
I want 以我的账户身份创建和编辑属于我的在线便签，
so that 我可以默认受控地维护自己分享出去的内容。

## Acceptance Criteria

1. 用户已建立有效登录会话时，首次保存一个新的在线便签，系统应把当前用户识别为该便签的创建者，且后续基于同一身份访问该便签时默认具有编辑权。
2. 已登录创建者打开自己创建的便签时，执行编辑和保存，系统应允许修改并成功持久化内容，且前后端都应基于资源所有权做一致校验。
3. 用户会话失效或身份不匹配时，尝试以创建者身份更新便签，系统应拒绝该修改请求，并返回清楚、稳定的权限错误语义。

## Tasks / Subtasks

- [ ] Task 1: 为在线便签补齐“作者身份”持久化边界 (AC: 1, 2, 3)
  - [ ] 在 `apps/api/prisma/schema.prisma` 中补齐 `User` 模型与 `Note.author` 关系，保持 `notes.author_id -> users.id` 的内部主键关联，不要把外部 SSO id 直接当成长期外键。
  - [ ] 若当前 API 侧仍只持有 `AuthUserDto.id: string`，在服务层或 repository 边界完成 `ssoId(string) -> users.sso_id(BigInt)` 的显式映射，不要把这个转换散落到 route handler 或前端。
  - [ ] 在首次保存新在线便签且当前会话为 authenticated 时，为对象绑定作者；已存在对象若已有作者，不得被后续请求静默改写作者归属。
  - [ ] 保持 `notes.sid` 唯一约束与 `author_id` 索引语义不变，不要因为引入作者关系破坏 Story 1.4 已经稳定的唯一对象写入路径。

- [ ] Task 2: 在 notes 服务层落地“创建者默认编辑权” (AC: 1, 2, 3)
  - [ ] 扩展 `note-write-service`，让写入决策接收服务端会话上下文，而不是只接收 `sid + content`。
  - [ ] 对“authenticated 首次创建”与“authenticated owner 再次更新”走成功分支；对“owner-bound note + 无会话 / 错会话”返回稳定权限错误，不得继续写入。
  - [ ] 明确当前 story 的边界：只实现“创建者默认编辑权”，不要提前吞并编辑密钥共享编辑逻辑；后续 Story 2.3 再接 `key_hash` 分支。
  - [ ] 不要把前端传来的 user id、owner 标记或隐藏字段作为授权依据；所有 owner 判断必须从服务端 session 与数据库记录推导。

- [ ] Task 3: 为读取链路补齐最小 owner 语义，支撑前后端一致校验 (AC: 1, 2, 3)
  - [ ] 扩展 `GET /api/notes/:sid` 的 DTO 或等价 detail 响应，补充最小可扩展的编辑能力字段，避免只靠临时布尔值 `isOwner`。
  - [ ] 当前 story 只需要覆盖最小集合：`owner-editable`、`anonymous-editable`、`forbidden` 或等价可扩展状态；不要在 2.2 提前把编辑密钥状态塞进 DTO。
  - [ ] 读取链路对 owner-bound note 应结合当前 session 给出一致能力判断，让前端不会继续显示“可编辑”而服务端实际拒绝。
  - [ ] 继续保持未登录阅读能力，不要因为 owner 语义引入而把 `GET /api/notes/:sid` 变成登录前置接口。

- [ ] Task 4: 在 Web 端把在线便签页从“权限待接入”推进到最小 owner 语义 (AC: 1, 2, 3)
  - [ ] 扩展 `packages/shared-types`、`note-methods.ts`、`use-online-note.ts` 与 `online-note.ts`，让前端状态机能消费服务端返回的 owner/edit 能力信息。
  - [ ] `OnlineNoteShell.vue` 与 `NoteObjectHeader.vue` 至少要能表达：当前用户是创建者可继续编辑、当前对象为匿名/未绑定作者、当前账户不能编辑 owner-bound note。
  - [ ] 对 owner-bound 但当前会话无效或身份不匹配的对象，不要继续保持“当前可继续编辑 + 保存更新”假象；至少要把保存动作禁用或在明确受控状态下提示下一步。
  - [ ] 保持 2.2 的 scope：这里只补 owner 语义，不把完整查看权/编辑权矩阵、密钥输入流或用户中心动作一起做掉。

- [ ] Task 5: 保持 Epic 1 与 Story 2.1 既有能力不回归 (AC: 1, 2, 3)
  - [ ] 匿名用户访问首页、在线阅读页、本地便签页的路径不能被登录前置阻断。
  - [ ] Story 1.4 的 `created / updated` 保存结果、Story 1.5 的复制反馈与对象头部结构、Story 2.1 的登录回跳恢复，不应因为 owner 接入被破坏。
  - [ ] 仍然遵守“Pinia 只管理 auth / UI、Alova 管远端状态、权限逻辑服务端收口”的边界。
  - [ ] 不要提前实现“我的创建 / 我的收藏”、收藏动作、删除动作或编辑密钥校验。

- [ ] Task 6: 为 owner 默认编辑权补齐 API / Web / 状态机回归测试 (AC: 1, 2, 3)
  - [ ] API 测试至少覆盖：authenticated 首次保存绑定作者、同一 owner 再次更新成功、错会话更新失败、会话失效更新失败、匿名阅读 owner-bound note 仍可读。
  - [ ] Web 测试至少覆盖：owner 状态显示为可编辑、非 owner 状态不再显示误导性编辑语义、权限失败反馈有清楚文字、登录恢复后 owner 语义可重新生效。
  - [ ] 状态机测试至少覆盖：sid 切换后旧保存结果不污染新对象、权限失败不会清空当前草稿、owner 语义不会破坏 Story 1.5 已有复制反馈逻辑。
  - [ ] 至少执行 `pnpm --filter @note/api test`、`pnpm --filter @note/web test`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/web typecheck`；若修改 Prisma schema 或构建契约，再补跑对应 `build` 与 `db:init` 验证。

## Dev Notes

### Story Intent

Story 2.2 的职责，是把 Epic 2 从“用户已经能登录回来”推进到“登录身份真的影响对象编辑权”。当前系统已经有在线便签读取、保存、对象头部和 SSO 会话恢复，但真正的“创建者默认编辑权”还没有落地：后端写入时不看当前会话，前端对象头部也仍然用“权限模型待 Epic 2 接入”占位。

这个故事最重要的 guardrail 不是“把用户 id 存起来”，而是“把资源所有权变成一致的系统规则”。如果前端说能改、后端却拒绝，或者后端已经绑定作者但前端还把它当成匿名开放编辑对象，这个 story 就算功能接上了也没有完成目标。

### Requirement Traceability

- FR2, FR9, FR15, FR17, FR19, FR21, FR23
- NFR5, NFR7, NFR8, NFR11, NFR12, NFR14, NFR18, NFR19
- UX-DR5, UX-DR6, UX-DR7, UX-DR14, UX-DR15, UX-DR19, UX-DR20

### Cross-Story Context

- Story 1.3 已经把 `GET /api/notes/:sid` 和在线只读消费页建立起来，因此 2.2 不需要重做读取入口，而是要把读取结果推进为“包含最小 owner 语义的 detail”。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-3-read-online-note-by-sid.md]
- Story 1.4 已经把同一 `sid` 下的首次保存与持续更新链路打通，2.2 必须直接承接这条写路径，而不是另起一套 owner 专用保存接口。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md]
- Story 1.5 已经把对象头部收口为 `NoteObjectHeader`，这正是 2.2 表达“创建者可编辑 / 当前账户不可编辑”的自然落点。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md]
- Story 2.1 已经落地 SSO 登录、回跳恢复与 `GET /api/me/session`，2.2 应复用这条会话链路，不要再发明第二套 auth 感知方式。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-1-sso-login-callback-recovery.md]
- Story 2.3 才会接入编辑密钥共享编辑，Story 2.4 才会统一查看权/编辑权状态，因此 2.2 只负责“登录创建者默认编辑权”的最小闭环。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md]

### Previous Story Intelligence

- Story 2.1 已明确 auth store 只管理会话和 UI 感知状态，SSO 细节只能在 API plugin/facade 层收口。因此 2.2 的 owner 判断必须建立在服务端 session 上，而不是把用户身份塞回前端 payload。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-1-sso-login-callback-recovery.md]
- Story 2.1 的 review 已暴露出“前端预判与后端稳定错误语义不一致”的风险；2.2 在 owner 权限失败分支上必须避免重复这个问题。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-1-sso-login-callback-recovery.md]
- Story 1.4/1.5 的 review follow-up 说明当前项目最常见的高风险点是 sid 切换后的过期异步结果污染当前对象，所以 2.2 的 owner 状态、保存结果和权限失败反馈同样要防竞态串台。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md]
- 最近可见 git 提交仍然主要集中在 Epic 1，说明当前本地代码虽然已经有 2.1 auth 实现，但团队的稳定实现模式仍然是“在既有 feature 内增量推进”，不要回退到大改脚手架。 [Source: `git log --oneline -5` on 2026-04-05]

### Current Codebase Reality Check

- `apps/api/src/routes/notes.ts` 当前 `PUT /api/notes/:sid` 只按 `sid + content` 调用 `noteWriteService.saveBySid()`，完全没有读取当前 session，也没有 owner 校验。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/routes/notes.ts]
- `apps/api/src/services/note-write-service.ts` 当前只会“新建 / 更新 / deleted 拒绝”，不会绑定作者，也不会拒绝非 owner 更新。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/services/note-write-service.ts]
- `apps/api/prisma/schema.prisma` 当前只有 `Note` 模型，虽然已经有 `authorId` 字段，但还没有 `User` 模型、`author` 关系和 favourites 关联，因此 2.2 需要第一次把作者实体真正落到 schema。 [Source: /Users/youranreus/Code/Projects/note/apps/api/prisma/schema.prisma]
- `apps/api/src/routes/me.ts` 和 `apps/api/src/plugins/auth.ts` 已经能从 cookie 恢复 authenticated session，这意味着 2.2 没有理由再让前端把 user id 带回写入接口。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/routes/me.ts] [Source: /Users/youranreus/Code/Projects/note/apps/api/src/plugins/auth.ts]
- `packages/shared-types/src/index.ts` 当前 note detail/save DTO 里没有任何 owner/edit 能力字段，`AuthUserDto.id` 仍是 string。2.2 需要在不破坏现有 Web 契约的前提下，为 note detail 引入最小可扩展权限信息。 [Source: /Users/youranreus/Code/Projects/note/packages/shared-types/src/index.ts]
- `apps/web/src/features/note/online-note.ts` 当前对象头部的编辑状态固定写死为“当前可继续编辑 / 权限模型待 Epic 2 接入”，这是 2.2 最直接的前端待替换点。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/online-note.ts]
- `apps/web/src/features/note/components/OnlineNoteShell.vue` 当前只把 `available` / `not-found` 都视为可编辑状态；如果 2.2 不调整这里，前端就会继续给 owner-bound non-owner 展示误导性可编辑 UI。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue]
- `apps/web/src/services/auth-methods.ts` 与 `auth-store.ts` 已经能恢复会话，因此 2.2 的前端实现应以“消费现有 session + note detail 的 owner 语义”为主，而不是再去拉一条单独的 owner 查询链路。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/services/auth-methods.ts] [Source: /Users/youranreus/Code/Projects/note/apps/web/src/stores/auth-store.ts]

### Technical Requirements

- 继续遵守 `Vue 3 + Tailwind + alova + axios + Pinia` / `Fastify + Prisma + MySQL` 的既有选型，不为 2.2 引入新的权限库、ORM 包装层或前端状态库。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md] [Source: /Users/youranreus/Code/Projects/note/apps/web/package.json] [Source: /Users/youranreus/Code/Projects/note/apps/api/package.json]
- owner 判断必须由服务端 session + 数据库作者关系共同决定，不能相信前端传来的 `isOwner`、`userId`、隐藏字段或本地缓存标记。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 当前数据库设计约定 `users.id` 为内部主键、`users.sso_id` 为外部身份映射，`notes.author_id` 指向 `users.id`；2.2 应按这个模型落地，而不是让 `notes.author_id` 直接存外部 SSO 字符串。 [Source: /Users/youranreus/Code/Projects/note/docs/database-design.md]
- 当前 `AuthUserDto.id` 在 Web/API 契约里仍是 string，若数据库层要求 `sso_id BIGINT`，转换必须在 API 侧显式完成，并对非数字 SSO id 给出稳定失败语义或统一适配方案。不要把这个冲突留给前端。 [Source: /Users/youranreus/Code/Projects/note/packages/shared-types/src/index.ts] [Source: /Users/youranreus/Code/Projects/note/docs/database-design.md]
- 读取路径仍需保持匿名可读；2.2 只能收紧“编辑权”，不能把“查看权”也偷偷绑到登录上。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md]
- 继续保留 Story 1.4 的同一 `sid` 创建/更新语义；owner 接入后也不应改变链接稳定性和保存结果语义。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md]

### Architecture Compliance Guardrails

- `routes` 只做 request/session 读取、schema 校验和响应映射；owner 归属判断、用户建档/upsert、权限拒绝逻辑应落在 service / repository 层。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- `views` 保持薄层，Web 端 owner 状态汇总继续放在 `features/note`，不要把授权细节塞进 `OnlineNoteView.vue` 或 `AuthStatusPill.vue`。
- 若 `GET /api/notes/:sid` 需要返回新的 owner/edit 信息，优先扩展 shared DTO，并在 `online-note.ts` 里做状态适配；不要在模板里散落新的条件分支和硬编码文案。
- 不要为了 2.2 直接实现完整“查看权 + 编辑权 + 密钥”统一矩阵；当前只允许留下可扩展字段或结构，完整统一语义交给 2.4。
- 继续遵守“SSO 与权限逻辑只在服务端收口”的边界；前端只消费 session 与 owner 语义，不直接处理三方 SSO 结果。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]

### Library / Framework Requirements

- Prisma 当前仍通过 `pnpm --filter @note/api db:init` + `prisma db push` 驱动本地 schema 落库。2.2 若新增 `User` 模型与 `Note.author` 关系，必须显式验证新表、关系和索引已经真实落库，而不是只改 `schema.prisma` 就算完成。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md] [External: https://docs.prisma.io/docs/v6/orm/prisma-migrate/understanding-prisma-migrate/mental-model]
- Fastify 若新增 decorator、typed service helper 或 route schema 扩展，应继续沿用当前 `declare module 'fastify'` 的类型扩展方式，不要绕开类型系统直接在 `app`/`request` 上挂未声明字段。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/plugins/auth.ts] [External: https://fastify.dev/docs/latest/Reference/TypeScript/]
- Web 端已有 `use-online-note` composable 状态机与 `online-note.ts` 适配器；2.2 应继续扩展这组模块，而不是把 owner 权限判断散回组件模板。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/use-online-note.ts] [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/online-note.ts]
- 若 notes route 需要程序化跳转或状态恢复，仍优先沿用现有 Vue Router 命名路由/params 模式，不要手写字符串 path。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/router/index.ts] [External: https://router.vuejs.org/guide/essentials/navigation]

### UX Guidance

- UX 已明确在线便签页要持续表达“当前 `sid`、是否已保存、是否可分享、是否有编辑权”，所以 2.2 不应只做后端拒绝，还必须让对象头部开始体现 owner 语义。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- 权限失败、会话失效和内容失效都需要给出明确原因与下一步建议，不能只把按钮灰掉或抛一个泛化错误。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- 登录用户创建内容后的默认编辑权应表现为“自然、受控”，而不是强侵入的后台管理感；仍然要维持当前在线页以内容主体为中心的节奏。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- 若当前账户不可编辑 owner-bound note，页面应让用户理解“你可以查看，但不能修改”，避免出现“仍可输入但保存永远失败”的挫败体验。完整统一语义可在 2.4 深化，但 2.2 至少要做到不误导。 [Inference from Sources: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md, /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md]

### Data and API Notes

- 数据库设计建议的目标结构已明确包含 `users`、`notes.author_id` 与 `notes.key_hash`；2.2 只落作者身份与 owner 权限，不提前实现 key 校验。 [Source: /Users/youranreus/Code/Projects/note/docs/database-design.md]
- `GET /api/me/session` 已存在并能恢复 authenticated user，2.2 更适合把 notes route 直接接入这条会话链路，而不是新增额外的 `/api/notes/:sid/permissions` 边路。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/routes/me.ts]
- 当前 `GET /api/notes/:sid` / `PUT /api/notes/:sid` 已是稳定资源边界，2.2 应优先在现有 routes 上扩展 owner 语义，而不是为了 owner 权限拆新 endpoint。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/routes/notes.ts]
- 若为 2.2 扩展 note detail DTO，建议把 owner 能力设计成未来可承接 2.3 / 2.4 的字段，而不是只留一次性布尔值。例如使用 `editAccess` / `ownershipStatus` 这类可扩展命名，但本 story 只实现 owner 相关最小取值。 [Inference from Sources: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md, /Users/youranreus/Code/Projects/note/apps/web/src/features/note/online-note.ts]

### File Structure Requirements

- 预计至少会修改：
  - `apps/api/prisma/schema.prisma`
  - `apps/api/src/routes/notes.ts`
  - `apps/api/src/services/note-read-service.ts`
  - `apps/api/src/services/note-write-service.ts`
  - `apps/api/src/schemas/note.ts`
  - `packages/shared-types/src/index.ts`
  - `apps/web/src/services/note-methods.ts`
  - `apps/web/src/features/note/use-online-note.ts`
  - `apps/web/src/features/note/online-note.ts`
  - `apps/web/src/features/note/components/NoteObjectHeader.vue`
  - `apps/web/src/features/note/components/OnlineNoteShell.vue`
- 很可能需要新增：
  - `apps/api/src/services/user-service.ts` 或等价 repository/service
  - `apps/api/tests/notes-owner-auth.spec.ts` 或在现有 `notes-write.spec.ts` / `note-write-service.spec.ts` 内新增 owner 场景
  - `apps/web/tests/owner-note-auth.spec.ts` 或在现有 `online-note.spec.ts` / `use-online-note.spec.ts` 内新增 owner 语义测试
- 一般不应修改：
  - `apps/web/src/features/local-note/*`
  - `apps/web/src/features/home/*`
  - `apps/web/src/features/auth/components/SsoConfirmModal.vue`
  - 收藏、删除、编辑密钥相关 feature

### Testing Requirements

- API / service 层至少覆盖：
  - authenticated 用户首次保存新 note 时写入 `author_id`
  - 同一 authenticated owner 再次保存同一 note 成功
  - 其他 authenticated 用户保存 owner-bound note 被稳定拒绝
  - owner-bound note 在匿名或 session 失效状态下更新被稳定拒绝
  - anonymous 创建或 legacy `author_id IS NULL` 对象在当前 story 的行为保持显式且可回归，不允许因为默认分支漂移产生隐式 break
- Web / state 层至少覆盖：
  - owner 打开自己创建的 note 时对象头部显示 owner 可编辑语义
  - non-owner/会话失效打开 owner-bound note 时不再显示误导性“当前可继续编辑”
  - 权限失败反馈有稳定标题、正文和下一步提示
  - sid 切换后旧权限/保存结果不会污染当前对象
  - Story 1.5 的复制反馈与保存反馈仍然通过同一轻量出口工作
- 回归要求：
  - `auth-status-pill.spec.ts`、`auth-callback.spec.ts` 不因 note owner 语义受损
  - `online-note.spec.ts`、`use-online-note.spec.ts` 的既有 `loading/not-found/deleted/save-error` 分支继续通过
  - `notes-read.spec.ts` 继续保持匿名可读语义

### Git Intelligence Summary

- 最近 5 次提交仍然是 Epic 1 主线，说明当前仓库的稳定实现模式还是“先把对象路径和状态机收口，再补权限语义”，2.2 最适合延续这一节奏。 [Source: `git log --oneline -5` on 2026-04-05]
- 当前 auth 能力更多来自本地未提交代码和 Story 2.1 产物，而不是最近提交历史；因此实现 2.2 时应以当前代码现实和 2.1 story 文档为主，不要只根据近期 commit 误判 auth 尚未落地。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-1-sso-login-callback-recovery.md]

### Project Structure Notes

- 当前项目上下文明确要求：`pnpm` 优先、中文输出优先、Pinia 只管 auth/UI、远端状态交给 alova、文档与代码冲突时先显式指出冲突再决定。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]
- 当前存在一个真实数据建模缺口：schema 已有 `Note.authorId`，但还没有 `User` 模型与 relation；2.2 实现时应把这个缺口补齐，而不是继续让 `authorId` 作为“悬空字段”存在。 [Source: /Users/youranreus/Code/Projects/note/apps/api/prisma/schema.prisma] [Source: /Users/youranreus/Code/Projects/note/docs/database-design.md]
- 当前 note 对象头部仍保留“权限模型待 Epic 2 接入”占位文案，这是本 story 最明确的产品/代码对齐入口。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/online-note.ts]

### References

- [epics.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md)
- [prd.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md)
- [architecture.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md)
- [ux-design-specification.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md)
- [project-context.md](/Users/youranreus/Code/Projects/note/_bmad-output/project-context.md)
- [tech-solution.md](/Users/youranreus/Code/Projects/note/docs/tech-solution.md)
- [database-design.md](/Users/youranreus/Code/Projects/note/docs/database-design.md)
- [2-1-sso-login-callback-recovery.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-1-sso-login-callback-recovery.md)
- [note-write-service.ts](/Users/youranreus/Code/Projects/note/apps/api/src/services/note-write-service.ts)
- [note-read-service.ts](/Users/youranreus/Code/Projects/note/apps/api/src/services/note-read-service.ts)
- [notes.ts](/Users/youranreus/Code/Projects/note/apps/api/src/routes/notes.ts)
- [me.ts](/Users/youranreus/Code/Projects/note/apps/api/src/routes/me.ts)
- [schema.prisma](/Users/youranreus/Code/Projects/note/apps/api/prisma/schema.prisma)
- [index.ts](/Users/youranreus/Code/Projects/note/packages/shared-types/src/index.ts)
- [use-online-note.ts](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/use-online-note.ts)
- [online-note.ts](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/online-note.ts)
- [OnlineNoteShell.vue](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue)
- [NoteObjectHeader.vue](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/NoteObjectHeader.vue)
- [auth-store.ts](/Users/youranreus/Code/Projects/note/apps/web/src/stores/auth-store.ts)
- [auth-methods.ts](/Users/youranreus/Code/Projects/note/apps/web/src/services/auth-methods.ts)
- [auth.spec.ts](/Users/youranreus/Code/Projects/note/apps/api/tests/auth.spec.ts)
- [notes-write.spec.ts](/Users/youranreus/Code/Projects/note/apps/api/tests/notes-write.spec.ts)
- [use-online-note.spec.ts](/Users/youranreus/Code/Projects/note/apps/web/tests/use-online-note.spec.ts)
- [online-note.spec.ts](/Users/youranreus/Code/Projects/note/apps/web/tests/online-note.spec.ts)

## Change Log

- 2026-04-05: 创建 Story 2.2 上下文，补齐 owner 默认编辑权的数据建模、服务端权限边界、前端最小 owner 语义、回归风险与测试要求，供后续 `dev-story` 直接实现。

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 已完整读取 `sprint-status.yaml`，确认当前第一条 backlog story 为 `2-2-owner-default-edit-permission`。
- 已抽取 `epics.md` 中 Story 2.2 的用户故事与 AC，并对照 PRD 旅程 2、Architecture 中 auth/security 与 data architecture、UX 中 object state patterns 进行上下文收口。
- 已复盘 Story 2.1、1.4、1.5 的实施产物，确认当前最关键的现实缺口是“会话已存在，但 note 写链路与对象头部还没有真正接入 owner 语义”。
- 已检查 `routes/notes.ts`、`note-write-service.ts`、`schema.prisma`、`shared-types`、`use-online-note.ts`、`online-note.ts` 与现有测试，确认 2.2 需要同时覆盖后端作者绑定、前端状态适配和回归防护。
- 已补充 Prisma `db push` 与 Fastify TypeScript 官方资料，用于避免“schema 已改但数据库未落地”和“新 decorator/helper 未进入类型系统”的常见失误。

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story 2.2 已根据当前 sprint 顺序从 `backlog` 提升为 `ready-for-dev`。
- 本 story 已显式指出当前数据建模冲突：`AuthUserDto.id` 为 string，而数据库设计目标是 `users.sso_id` / `notes.author_id` 内部主键关联；后续实现必须在 API 边界解决，而不是把冲突丢给前端。
- 本 story 已明确限制 scope：只做“登录创建者默认编辑权”，不提前吞并编辑密钥共享编辑、统一授权矩阵、用户中心或收藏能力。

### File List

- `_bmad-output/implementation-artifacts/2-2-owner-default-edit-permission.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/routes/notes.ts`
- `apps/api/src/services/note-read-service.ts`
- `apps/api/src/services/note-write-service.ts`
- `apps/api/src/schemas/note.ts`
- `packages/shared-types/src/index.ts`
- `apps/web/src/services/note-methods.ts`
- `apps/web/src/features/note/use-online-note.ts`
- `apps/web/src/features/note/online-note.ts`
- `apps/web/src/features/note/components/NoteObjectHeader.vue`
- `apps/web/src/features/note/components/OnlineNoteShell.vue`
