# Story 3.1: 登录门槛下的收藏动作

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 分享接收者，
I want 在登录后收藏重要便签，
so that 我可以把值得回访的内容沉淀到自己的账户资产中。

## Acceptance Criteria

1. 用户正在查看一条他人分享的在线便签时，若已登录并点击收藏，系统必须创建该用户与该便签之间的收藏关系，并让当前页面立即呈现“已收藏”的结果反馈。
2. 用户尚未登录时，在便签页触发收藏必须先进入既有 SSO 登录升级链路；登录成功后应回到原来的便签上下文，并继续完成这次收藏动作，而不是让用户重新找回对象。
3. 用户重复收藏同一条便签时，服务端与数据库层都必须保持幂等，不产生重复记录，也不向用户暴露“已收藏导致失败”这类伪异常。

## Tasks / Subtasks

- [x] Task 1: 补齐 favorites 共享契约与数据模型，让“当前是否可收藏 / 是否已收藏 / 收藏写入结果”有稳定单一事实来源 (AC: 1, 3)
  - [x] 当前 `packages/shared-types/src/index.ts` 还没有任何 favorite DTO、错误码或 note 详情里的收藏摘要字段；3.1 应在 shared types 中补齐最小共享契约，避免 API、Web composable 和组件各自发明一套收藏状态命名。
  - [x] 当前 `apps/api/prisma/schema.prisma` 只有 `User` / `Note`，尚未落 `note_favorites` 关系；本故事应按架构与数据库设计补上 `NoteFavorite`（或等价命名）模型、复合主键与必要索引，保持 `user_id + note_id` 级别的天然幂等。
  - [x] 若在线便签详情需要在当前页立即表达“已收藏”，优先在 `GET /api/notes/:sid` 的成功响应里补最小收藏摘要（如 `isFavorited`、`favoriteCount` 或等价结构），但必须保持 `sid` 作为外部资源标识，不向前端泄漏内部 `note.id` 作为收藏 API 入参。
  - [x] 由于 PRD 明确写的是“收藏他人分享的便签”，本故事应把“自己创建的便签”视为不应进入收藏目标的对象；无论最终采用前端隐藏还是服务端稳定拒绝，都必须避免让“我的创建 / 我的收藏”语义重叠成同一资产集合。

- [x] Task 2: 在服务端实现登录门槛下的收藏写入、鉴权与幂等语义 (AC: 1, 2, 3)
  - [x] 将 `apps/api/src/routes/favorites.ts` 从当前 shell-status 占位推进为真实收藏入口，优先沿用 favorites 资源边界，不要回退到早期文档里 `POST /api/notes/:id/favorite` 的旧草案。
  - [x] 收藏写入必须要求已登录会话；匿名请求应返回稳定、可映射的 auth-required 错误语义，而不是 500、静默重定向或与权限错误混在一起的模糊失败。
  - [x] 服务端应通过当前 session 解析用户、通过 `sid` 解析目标 note、再在事务中写入 favorite 关系；不要让前端持有或拼接内部 `note.id` 来完成收藏。
  - [x] 对重复收藏同一对象的请求，数据库层应依赖复合主键 / 唯一约束，服务层应返回稳定成功结果或等价 no-op 结果，不允许把“重复收藏”暴露成异常。
  - [x] 需要同时覆盖目标不存在、目标已删除、目标属于当前用户本人、会话失效等分支，确保 favorites route 的错误语义与 note / auth 模块一样稳定可预测。

- [x] Task 3: 复用现有 SSO 回跳链路，实现“未登录点收藏 -> 登录 -> 回来继续收藏”的动作恢复 (AC: 2)
  - [x] 收藏动作触发登录时，必须复用 Story 2.1 已落地的 `SsoConfirmModal`、`/api/auth/login`、`/api/auth/callback`、`/api/me/session` 与 return-to 恢复链路，不要为收藏再起第二套登录弹窗或“收藏专用回跳页”。
  - [x] 当前 `normalizeAuthReturnToPath()` 只保留安全站内路径，`auth-session-service.ts` 的 pending flow 也只记录 `returnTo + state`；如果要在登录后自动继续收藏，优先扩展既有 pending flow / callback 契约承载一次性 favorite intent，而不是把动作意图塞进不安全 query、`localStorage` 或新的全局持久化 store。
  - [x] 登录成功后，系统应在回到原 `sid` 对象页时自动且仅一次继续执行收藏，避免要求用户重复点击，也要避免刷新/重复进入时出现无限重复提交。
  - [x] 收藏登录门槛不能反过来破坏匿名阅读路径：未登录用户仍可正常查看在线便签，只有“资产化动作”才要求登录升级。

- [x] Task 4: 在在线便签页接入轻量收藏 CTA 与即时反馈，不打乱既有保存、复制与授权状态表达 (AC: 1, 2)
  - [x] 优先把收藏动作作为对象页里的 tertiary / ghost 级补充动作接到现有 `NoteObjectHeader.vue` 或与其并列的对象级状态区，而不是新做后台页、吸顶工具栏或抢主任务的 primary CTA。
  - [x] 已登录且符合收藏条件时，点击收藏应立即让当前页进入“已收藏”结果态，并给出轻量但明确的成功反馈；失败时也要说明是登录缺失、对象失效、权限问题还是其他稳定错误，而不是只显示“收藏失败”。
  - [x] 匿名点击收藏时，应进入既有登录升级 modal，并保留当前 `sid`、当前页面上下文和可恢复的动作语义；收藏行为不应影响当前正文查看、复制链接、保存状态或编辑授权提示。
  - [x] 当前 `OnlineNoteShell.vue`、`NoteObjectHeader.vue`、`use-online-note.ts` 已经承载对象状态、复制反馈与保存反馈；3.1 应优先增量复用这些落点，避免再造一套与对象页平行的收藏状态条。
  - [x] 远端收藏状态属于 Alova 管理的业务数据，不应进入 `auth-store` 这类全局会话 store；收藏成功后应通过统一 cache invalidation 或等价机制刷新 note detail 与后续“我的收藏”数据源，而不是新增双真值源。

- [x] Task 5: 保持 Epic 3 的实施边界，不在 3.1 提前吞并用户中心列表、取消收藏或完整资产面板 (AC: 1, 2, 3)
  - [x] 本故事只负责“从对象页发起收藏并完成登录门槛闭环”，不提前实现 Story 3.2 的 `UserCenterModal`、Story 3.3 的“我的收藏”列表，或 Story 3.4 的完整可访问性收口。
  - [x] 不在 3.1 提前实现取消收藏、收藏列表分页、我的创建列表聚合或用户中心 tab 切换；这些能力后续会继续在 `favorites` / `me` / `user-panel` 模块上扩展。
  - [x] 不为了让收藏生效而重做首页入口、本地便签模式、SSO 主链路、统一授权模型；只允许围绕 favorite intent 恢复所必需的最小 auth 契约扩展。
  - [x] 如果实现中发现“必须先有我的收藏列表才能验证收藏成功”，应把当前 story 收缩为对象页即时状态 + 稳定写入结果，把列表呈现留到 3.3，而不是在 3.1 偷渡完整资产面板。

- [x] Task 6: 为收藏写入、登录恢复与对象页反馈补齐 API / Web / auth 回归测试 (AC: 1, 2, 3)
  - [x] API / service 测试至少覆盖：匿名收藏被稳定拒绝、已登录收藏成功、重复收藏幂等成功、目标不存在/已删除返回稳定错误、自己创建的对象不会被当作可收藏目标。
  - [x] 若扩展了 auth pending flow / callback 契约以恢复 favorite intent，需补 `apps/api/tests/auth.spec.ts` 或等价测试，确认登录前记录 intent、回跳后保留 return-to、且 intent 只消费一次。
  - [x] Web 测试至少覆盖：匿名点击收藏会打开现有 `SsoConfirmModal`、登录成功后返回原 `sid` 并继续收藏一次、已登录收藏成功后当前页面立即呈现“已收藏”反馈、复制链接与保存按钮行为不回归。
  - [x] 若 note detail DTO 新增 favorite 摘要，需补齐 `apps/api/tests/notes-read.spec.ts`、`apps/web/tests/online-note.spec.ts`、`apps/web/tests/use-online-note.spec.ts` 等契约与视图模型测试，确保对象页不会因为新增收藏状态而破坏既有授权表达。
  - [x] 至少执行 `pnpm --filter @note/api test`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/web test`、`pnpm --filter @note/web typecheck`；若 Prisma schema、auth callback 契约或构建入口被修改，再补跑对应 `build` 与 `db:init`。

## Dev Notes

### Story Intent

Story 3.1 的核心，不是“页面上多一个星标按钮”，而是把接收者路径里的第一次资产化动作真正打通。用户在阅读别人分享的在线便签时，不应该被登录前置打断；但一旦他决定把内容沉淀为自己的资产，系统就需要顺滑地把这次动作升级为登录后收藏，并在完成登录后把用户带回原对象，继续完成刚才那一下点击。

这个故事最容易做坏的地方有两个：第一，把“收藏需要登录”错误实现成“阅读需要登录”；第二，让用户登录回来后还得自己重新找到对象、再重新点一次收藏。3.1 的价值就在于同时守住“阅读开放”与“资产化闭环”这两个前提。

### Requirement Traceability

- FR21, FR22, FR23, FR28, FR30, FR31, FR32, FR35, FR36
- NFR7, NFR8, NFR18, NFR19
- UX-DR6, UX-DR10, UX-DR11, UX-DR12, UX-DR14, UX-DR15

### Cross-Story Context

- Story 1.3 已经稳定了“按 `sid` 阅读在线便签”的公开查看路径，所以 3.1 绝不能把 note 阅读错误升级成登录前置；收藏门槛只能作用在资产化动作本身。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-3-read-online-note-by-sid.md]
- Story 1.5 已经把对象级反馈主要收口到 `NoteObjectHeader`，因此 3.1 的收藏 CTA 与收藏结果反馈应优先落在对象级状态区，而不是新增与对象脱节的独立工具页。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md]
- Story 2.1 已经打通“登录确认 -> 回跳处理 -> 返回来源页”的最小链路，3.1 应复用这条链路并为 favorite intent 做最小增强，而不是重写一套收藏专用登录流程。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-1-sso-login-callback-recovery.md]
- Story 2.4 已经统一了在线便签页的查看/编辑授权表达，3.1 新增收藏动作时必须与现有“只读查看 / 可编辑 / 需要密钥”的对象状态共存，不能把授权语义重新打散。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-4-unified-view-edit-authorization.md]
- Story 3.2 与 3.3 才分别负责“我的创建”和“我的收藏”列表承接，因此 3.1 的成功标准是对象页收藏闭环，不是提前把个人中心资产层一次性做完。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md]

### Previous Story Intelligence

- 2.1 的实现已经把 `returnTo` 做成站内安全路径，并在 auth pending flow 中保存 `state + returnTo`；3.1 若要恢复 favorite intent，最稳妥的扩展点就是既有 pending flow，而不是放松安全路径校验。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-1-sso-login-callback-recovery.md] [Source: /Users/youranreus/Code/Projects/note/apps/api/src/services/auth-session-service.ts]
- 2.4 把在线便签对象页的文案、按钮、反馈和头部状态统一到了同一套授权视图模型上，这意味着 3.1 最不该做的事，是再造一套只给收藏使用的平行状态机。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-4-unified-view-edit-authorization.md]
- 最近提交顺序仍围绕 auth 与对象授权推进，说明当前仓库节奏适合继续在现有 note/auth 边界上增量加入 favorites，而不是大规模返工页面结构。 [Source: `git log --oneline -5` on 2026-04-06]

### Current Codebase Reality Check

- `apps/api/src/routes/favorites.ts` 目前仍只有 `/shell-status` 占位，没有任何真实收藏写入逻辑；这意味着 3.1 需要第一次把 favorites 从占位模块推进成真实业务入口。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/routes/favorites.ts]
- `apps/api/prisma/schema.prisma` 当前只有 `User` 与 `Note`，尚未建 `note_favorites` 关系模型；收藏幂等的数据库基础目前并不存在。 [Source: /Users/youranreus/Code/Projects/note/apps/api/prisma/schema.prisma]
- `apps/api/src/routes/me.ts` 当前只有 `/session` 和 shell-status，还没有“我的收藏”读取能力；这进一步说明 3.1 应先聚焦收藏写入闭环，而不是提前做列表接口。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/routes/me.ts]
- `packages/shared-types/src/index.ts` 目前没有 favorite DTO、favorite error code 或 note 详情里的 favorite 摘要；如果不先补契约，Web 端很容易再次走向临时布尔值和分散 if/else。 [Source: /Users/youranreus/Code/Projects/note/packages/shared-types/src/index.ts]
- `apps/web/src/features/note/components/OnlineNoteShell.vue` 与 `NoteObjectHeader.vue` 已经承载对象说明、复制反馈、保存状态和授权表达，是当前最适合落收藏 CTA 的对象级位置。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue] [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/NoteObjectHeader.vue]
- `apps/web/src/components/layout/AuthStatusPill.vue` 当前只在匿名态下打开 `SsoConfirmModal`，已登录态仍保留给未来用户中心；3.1 应复用这套 modal 语义，不要在 note 页面上再造第二个“请先登录”弹窗。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/components/layout/AuthStatusPill.vue]
- 当前 `normalizeAuthReturnToPath()` 只保留站内 pathname，因此“登录后自动继续收藏”不能依赖 query 参数回传动作意图；这是一条必须在 story 里提前说明的实现 guardrail。 [Source: /Users/youranreus/Code/Projects/note/packages/shared-types/src/index.ts]

### Architecture Compliance

- 架构已明确规定：核心资源路由围绕 `notes`、`favorites`、`me/session` 与 `auth/callback` 组织，因此 3.1 应优先扩展 `apps/api/src/routes/favorites.ts`，而不是回退到把收藏动作挂在 `notes` 资源下的旧草案。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 架构同时要求 `sid` 是外部访问标识、`id` 是内部实现标识，二者语义不得混用；因此收藏 API 不应要求前端先拿到内部 `note.id` 才能收藏。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 远端状态继续由 Alova 管理，Pinia 只管理 auth/UI；收藏状态与后续“我的收藏”缓存都不应进入 `auth-store` 这类全局会话 store。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]
- 收藏关系在数据层必须走内部主键关联与复合唯一约束，这样才能把重复收藏稳定收敛为幂等 no-op，而不是应用层靠脆弱的“先查后写”猜测。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md] [Source: /Users/youranreus/Code/Projects/note/docs/database-design.md]

### UX Guardrails

- UX 规格已明确把“登录后收藏”归类为 tertiary / ghost action，因此收藏 CTA 不应抢过当前对象页的主任务，也不应和保存动作竞争 primary 层级。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- 收藏成功、登录恢复成功等反馈都应保持轻量且明确，优先 inline status 或轻量 toast，不应阻断当前阅读/编辑流程。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- UX 同时强调“登录是能力升级而不是阅读门槛”，所以 3.1 的未登录收藏流只能在触发收藏时打开登录确认，不得让 note 打开过程本身弹出登录。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md]
- 用户中心最终会以 `UserCenterModal + segmented tabs` 承载“我的创建 / 我的收藏”，因此 3.1 只需要确保收藏成功后对象页能表达“这条内容已经进入你的资产”，无需提前展开完整资产面板。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]

### Recommended API and Data Direction

- 这里需要显式指出一个文档冲突：`docs/tech-solution.md` 早期写过 `POST /api/notes/:id/favorite`，但架构文档与当前 app 装配已经明确 favorites 是独立资源模块，且 `sid` 才是对外稳定标识；3.1 应以后者为准，不把内部 `note.id` 暴露给前端。 [Source: /Users/youranreus/Code/Projects/note/docs/tech-solution.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md] [Source: /Users/youranreus/Code/Projects/note/apps/api/src/app.ts]
- 推荐把“收藏当前 note”设计为 favorites 资源下的最小写入接口，入参只包含 `sid` 或等价外部资源标识；服务端在内部解析到 note 主键后写入 `note_favorites`。
- 如果 note detail 响应要同步收藏结果，优先补最小的收藏摘要字段，而不是在前端根据 auth status、author ownership 和最近一次 mutation 结果做多处推断。
- 若当前故事需要对自己创建的 note 禁止收藏，前后端应共享同一稳定语义：对象页不给 active CTA，服务端也不要默默写入 favorite 再让 3.2 / 3.3 去解释资产重复。

### File Structure Requirements

- 预计至少会修改：
  - `packages/shared-types/src/index.ts`
  - `apps/api/prisma/schema.prisma`
  - `apps/api/src/app.ts`
  - `apps/api/src/routes/favorites.ts`
  - `apps/api/src/routes/notes.ts`
  - `apps/api/src/routes/auth.ts` 或 `apps/api/src/services/auth-session-service.ts`（仅当 favorite intent 恢复必须扩展现有 auth 契约时）
  - `apps/web/src/features/note/components/NoteObjectHeader.vue`
  - `apps/web/src/features/note/components/OnlineNoteShell.vue`
  - `apps/web/src/features/note/use-online-note.ts`
  - `apps/web/src/features/note/online-note.ts`
  - `apps/web/src/components/layout/AuthStatusPill.vue`（仅在收藏入口需要复用其打开行为或共享 trigger helper 时）
- 很可能需要新增：
  - `apps/api/src/services/favorite-service.ts`
  - `apps/api/src/schemas/favorite.ts`
  - `apps/api/src/repositories/favorite-repository.ts` 或等价轻量数据访问层
  - `apps/web/src/services/favorite-methods.ts`
  - `apps/web/src/features/favorite/*` 内的轻量 helper / composable
  - `apps/api/tests/favorites.spec.ts`
  - `apps/web/tests/*favorite*.spec.ts` 或在既有 note/auth 测试中扩展收藏场景
- 一般不应修改：
  - `apps/web/src/features/local-note/*`
  - `apps/web/src/features/home/*`
  - `apps/web/src/features/user-panel/*`（当前仓库里甚至尚未真正落地）
  - Story 3.2 / 3.3 的列表承接逻辑
  - Story 4.x 的删除与终态反馈逻辑

### Testing Requirements

- API / service 层至少覆盖：
  - 未登录用户收藏请求返回稳定 auth-required 语义
  - 已登录用户收藏他人 note 成功
  - 重复收藏同一 note 为幂等 no-op，不产生重复记录
  - 目标不存在、已删除、自己创建的对象等边界语义稳定
  - 若 note detail DTO 新增 favorite 摘要，收藏前后读取结果保持一致
- auth / callback 层至少覆盖：
  - favorite intent 能通过现有登录流保存并在回跳后恢复
  - 恢复逻辑只执行一次，不因重复渲染或刷新出现重复提交
  - `returnTo` 依旧维持站内安全路径约束
- Web / state 层至少覆盖：
  - 匿名点击收藏打开既有登录确认 modal
  - 登录成功回到原 `sid` 后自动继续收藏一次
  - 已登录收藏成功后对象页立即出现“已收藏”结果反馈
  - 收藏失败不会干扰已有保存、复制链接和授权展示
  - 自己创建的 note 不会显示误导性的收藏可用状态
- 回归要求：
  - 1.3 的匿名阅读、1.5 的对象头部复制反馈、2.1 的登录恢复、2.4 的授权文案全部继续通过

### Git Intelligence Summary

- 最近提交依次是 `feat: unify note edit authorization flows`、`feat: add owner-based note edit access`、`feat: add SSO auth flow and story context`，说明仓库主线已经先后打通了对象页、登录恢复和授权表达；3.1 最合理的实现方式是沿着这条主线把 favorites 增量接到现有 note/auth 流程上。 [Source: `git log --oneline -5` on 2026-04-06]
- 当前工作树还没有任何 favorites 真实实现或相关测试，这意味着 3.1 是 favorites 模块第一次落地，story 文件必须把契约、边界和回归重点写清楚，避免后续实现范围失控。

### Latest Technical Notes

- 当前仓库关键版本固定为 `vue@^3.5.13`、`alova@^3.0.6`、`axios@^1.7.9`、`fastify@^5.0.0`、`@prisma/client@^5.22.0`；3.1 应在这些已选版本上完成，不要顺手做依赖升级。 [Source: /Users/youranreus/Code/Projects/note/apps/web/package.json] [Source: /Users/youranreus/Code/Projects/note/apps/api/package.json]
- Alova 官方缓存文档已提供 `invalidateCache()` 这类显式失效能力，适合在收藏成功后刷新当前对象详情与未来“我的收藏”列表缓存；3.1 应优先复用现有 Alova 体系，而不是引入新状态库。 [Source: https://alova.js.org/zh-CN/api/cache/]
- Prisma 官方模型文档继续强调通过单字段唯一键与复合唯一键表达约束；3.1 的 `note_favorites` 关系应利用复合主键/唯一约束来收口幂等，而不是只靠应用层“先查后写”。 [Source: https://docs.prisma.io/docs/orm/prisma-schema/data-model/models]
- Fastify v5 仍强调通过插件和路由模块扩展服务边界，因此 favorites 能力应继续接在现有 `routes/favorites.ts` / service 模块上，而不是创建旁路 app 或绕过 schema 的临时 handler。 [Source: https://fastify.dev/docs/v5.6.x/Reference/Plugins/]

### Project Structure Notes

- 项目上下文明确要求：优先使用 `pnpm`、中文输出、Pinia 只承接 auth/UI、Alova 管远端数据；3.1 必须沿用这套分层，不要把 favorite 状态塞进会话 store。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]
- 项目上下文还要求文档与真实代码冲突时要显式指出并做决定；本 story 已明确选择“favorites 独立资源边界 + `sid` 对外标识”作为后续实现基线。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]
- `docs/database-design.md` 已经给出 `note_favorites` 的目标结构与索引方向，而真实 Prisma schema 还未跟上；这正是 3.1 必须先补的数据层基础。 [Source: /Users/youranreus/Code/Projects/note/docs/database-design.md] [Source: /Users/youranreus/Code/Projects/note/apps/api/prisma/schema.prisma]

### References

- [epics.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md)
- [prd.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md)
- [architecture.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md)
- [ux-design-specification.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md)
- [project-context.md](/Users/youranreus/Code/Projects/note/_bmad-output/project-context.md)
- [tech-solution.md](/Users/youranreus/Code/Projects/note/docs/tech-solution.md)
- [database-design.md](/Users/youranreus/Code/Projects/note/docs/database-design.md)
- [1-3-read-online-note-by-sid.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-3-read-online-note-by-sid.md)
- [1-5-shareable-note-header-feedback.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md)
- [2-1-sso-login-callback-recovery.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-1-sso-login-callback-recovery.md)
- [2-4-unified-view-edit-authorization.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-4-unified-view-edit-authorization.md)
- [schema.prisma](/Users/youranreus/Code/Projects/note/apps/api/prisma/schema.prisma)
- [app.ts](/Users/youranreus/Code/Projects/note/apps/api/src/app.ts)
- [favorites.ts](/Users/youranreus/Code/Projects/note/apps/api/src/routes/favorites.ts)
- [me.ts](/Users/youranreus/Code/Projects/note/apps/api/src/routes/me.ts)
- [auth-session-service.ts](/Users/youranreus/Code/Projects/note/apps/api/src/services/auth-session-service.ts)
- [index.ts](/Users/youranreus/Code/Projects/note/packages/shared-types/src/index.ts)
- [AuthStatusPill.vue](/Users/youranreus/Code/Projects/note/apps/web/src/components/layout/AuthStatusPill.vue)
- [OnlineNoteShell.vue](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue)
- [NoteObjectHeader.vue](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/NoteObjectHeader.vue)
- [online-note.ts](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/online-note.ts)
- [use-online-note.ts](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/use-online-note.ts)
- [Alova Cache Docs](https://alova.js.org/zh-CN/api/cache/)
- [Prisma Models Docs](https://docs.prisma.io/docs/orm/prisma-schema/data-model/models)
- [Fastify Plugins Docs](https://fastify.dev/docs/v5.6.x/Reference/Plugins/)

## Change Log

- 2026-04-06: 创建 Story 3.1 上下文，补齐 favorites 契约与数据模型、登录门槛下的收藏恢复链路、对象页即时反馈边界和 API / Web / auth 回归测试要求，供后续 `dev-story` 直接实现。
- 2026-04-07: 完成 favorites 契约、Prisma `note_favorites` 模型、`POST /api/favorites` 幂等写入、登录后单次恢复收藏、对象页收藏 CTA/反馈与 API/Web/auth 回归测试，并通过 `test`、`typecheck`、`build`、`db:init` 验证。

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 已完整读取 `sprint-status.yaml`，确认当前第一条 backlog story 为 `3-1-favorite-action-with-login-gate`，且这是 Epic 3 的第一张 story。
- 已抽取 Epic 3 中 Story 3.1 的用户故事与 AC，并同时核对 PRD、架构、UX 与数据库设计中关于“登录后收藏”“我的收藏”“favorites 资源边界”的约束。
- 已检查真实代码，确认 `favorites.ts` 仍是 shell、Prisma schema 尚未落 `note_favorites`、`me.ts` 只有 session、在线便签页已有对象头部和登录 modal 落点但尚无 favorite 状态。
- 已显式识别文档冲突：`docs/tech-solution.md` 早期使用 `POST /api/notes/:id/favorite`，而架构文档与当前 `app.ts` 已收敛为独立 `favorites` 模块；本 story 明确以后者为准。
- 已补充官方资料核对，确认可继续沿用当前 `Fastify v5 + Prisma 5 + Vue 3.5 + Alova 3` 选型，不需要为了 3.1 引入新依赖或新状态库。
- 已完成 `favorites` 真实服务落地，新增稳定错误语义、事务内幂等写入与 `favoriteState` 回填到 note detail/save 响应。
- 已扩展 auth pending flow、callback 响应与 Web auth store，支持 `favorite-note` intent 在登录后按原 `sid` 自动恢复且只执行一次。
- 已执行 `pnpm --filter @note/api test`、`pnpm --filter @note/web test`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/web typecheck`、`pnpm --filter @note/api build`、`pnpm --filter @note/web build`、`pnpm --filter @note/api db:init` 并全部通过。

### Completion Notes List

- 已为在线便签补齐收藏共享契约、`favoriteState` 视图字段与 Prisma `note_favorites` 数据模型，确保 API / Web / DB 只围绕 `sid -> note.id -> favorite relation` 这一条事实链路工作。
- 已实现 `POST /api/favorites` 登录门槛、自己创建对象拒绝收藏、重复收藏幂等成功与目标缺失/删除等稳定错误语义。
- 已复用既有 SSO modal 与回跳链路，实现匿名点击收藏后登录、回到原 `sid` 页面并自动单次继续收藏。
- 已在对象页头部接入轻量收藏 CTA 与即时“已收藏”反馈，同时保持既有保存、复制与授权状态不回归。
- 已完成 API、auth、view model 与 composable 回归测试，并额外通过 typecheck、build、`db:init` 验证。

### File List

- _bmad-output/implementation-artifacts/3-1-favorite-action-with-login-gate.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- apps/api/prisma/schema.prisma
- apps/api/src/app.ts
- apps/api/src/routes/auth.ts
- apps/api/src/routes/favorites.ts
- apps/api/src/schemas/favorite.ts
- apps/api/src/schemas/note.ts
- apps/api/src/services/auth-session-service.ts
- apps/api/src/services/favorite-service.ts
- apps/api/src/services/note-read-service.ts
- apps/api/src/services/note-write-service.ts
- apps/api/tests/auth.spec.ts
- apps/api/tests/favorites.spec.ts
- apps/api/tests/note-read-service.spec.ts
- apps/api/tests/note-write-service.spec.ts
- apps/api/tests/notes-read.spec.ts
- apps/api/tests/notes-write.spec.ts
- apps/web/src/features/auth/use-auth-flow.ts
- apps/web/src/features/note/components/NoteObjectHeader.vue
- apps/web/src/features/note/components/OnlineNoteShell.vue
- apps/web/src/features/note/online-note.ts
- apps/web/src/features/note/use-online-note.ts
- apps/web/src/services/auth-methods.ts
- apps/web/src/services/favorite-methods.ts
- apps/web/src/stores/auth-store.ts
- apps/web/tests/auth-status-pill.spec.ts
- apps/web/tests/online-note.spec.ts
- apps/web/tests/use-online-note.spec.ts
- packages/shared-types/src/index.ts
