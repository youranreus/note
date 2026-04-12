# Story 2.1: SSO 登录入口与回跳恢复

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 需要升级能力的用户，
I want 在需要登录时进入 SSO 并在回跳后恢复当前上下文，
so that 我可以无缝获得账户能力而不必重新开始主流程。

## Acceptance Criteria

1. 未登录用户点击右上状态入口或触发需要登录的操作时，系统应显示 `SsoConfirmModal`，且该弹窗只表达必要的登录升级信息而不打断用户理解当前上下文。
2. 用户确认进行 SSO 登录后，浏览器进入 `/auth/callback` 时，页面应展示 `CallbackLoadingCard` 处理回跳中间态，并在成功建立会话后返回来源页或合理默认页。
3. modal 或回跳页被打开时，焦点管理、关闭行为和状态文本都必须可感知，且登录流程中的状态提示不能只依赖视觉装饰。

## Tasks / Subtasks

- [x] Task 1: 在 Web 端建立登录升级入口与确认弹窗语义 (AC: 1, 3)
  - [x] 将 `apps/web/src/components/layout/AuthStatusPill.vue` 从静态展示升级为可触发交互的状态入口，未登录时触发 `SsoConfirmModal`，已登录时继续为后续用户中心保留扩展位。
  - [x] 在 `apps/web/src/features/auth/components` 内新增 `SsoConfirmModal.vue`（或等价组件），优先复用现有 `Modal`、`Button`、`InlineFeedback`、`StatusPill` 等 foundation 组件，不新造平行弹窗体系。
  - [x] modal 文案只表达“登录是能力升级”“会返回当前上下文”“确认后进入 SSO”这类必要信息，不在 2.1 提前解释收藏、我的创建、编辑密钥或完整权限模型。
  - [x] 弹窗必须具备基础键盘可用性、关闭行为与明确的按钮文本；不能只依赖遮罩、颜色或图标表达当前状态。

- [x] Task 2: 建立前端 auth feature 的回跳承接与上下文恢复链路 (AC: 2, 3)
  - [x] 在 `apps/web/src/features/auth` 中新增或扩展 auth composable / adapter，收口“打开登录确认”“记录来源页”“回调处理中”“成功恢复登录态”“失败反馈与重试”这些状态，不把流程散落进 view 模板。
  - [x] 将 `apps/web/src/features/auth/components/AuthCallbackCard.vue` 从占位壳体推进为 `CallbackLoadingCard` 语义，明确展示“正在完成登录”“建立会话成功 / 失败”的中间态反馈。
  - [x] `apps/web/src/views/AuthCallbackView.vue` 继续保持薄层，只装配 auth feature，不直接拼接 ticket 解析、会话请求和回跳逻辑。
  - [x] 登录成功后优先恢复触发登录前的内部页面上下文；若来源页缺失或不合法，再回退到首页等合理默认页。
  - [x] 前端不得沿用 `docs/tech-solution.md` 中早期“access token 存内存 + localStorage”草案；本故事应遵循架构文档的“服务端会话 / 安全 cookie，前端只感知会话状态”边界。

- [x] Task 3: 在 API 侧落地最小 SSO 回调与会话读取契约 (AC: 2)
  - [x] 扩展 `apps/api/src/routes/auth.ts`，提供最小可用的 `GET /api/auth/callback` 回调入口，负责承接 SSO 回跳参数、调用 facade、建立会话并返回稳定响应语义。
  - [x] 在 `apps/api` 内新增 `plugins/auth`、`services/auth` 或等价最小分层，封装 `@reus-able/sso-utils`，不要把三方 SSO 细节散落在 route handler 中。
  - [x] 如前端恢复登录态需要独立读取当前会话，优先在 `apps/api/src/routes/me.ts` 中补最小 `GET /api/me/session`（或等价契约），只返回当前故事真正需要的会话感知字段，不提前扩展“我的创建 / 我的收藏”列表能力。
  - [x] 会话建立优先使用服务端会话 / 安全 cookie；不得把 Bearer token 方案重新引回前端本地存储。
  - [x] 对 SSO 回调失败、缺少必要参数、非法 state 或会话建立失败，必须返回稳定、可映射到前端反馈的错误语义。

- [x] Task 4: 维持 auth / store / route 边界并保护既有匿名主路径 (AC: 1, 2, 3)
  - [x] `apps/web/src/stores/auth-store.ts` 继续只管理 auth 会话与 UI 感知状态；不要把在线便签详情、本地便签草稿或用户中心列表塞进 auth store。
  - [x] 匿名用户对首页、在线便签读取页、本地便签页的既有访问路径不能因 2.1 被登录前置阻断；登录应表现为能力升级而不是门槛。
  - [x] `/auth/callback` 回跳页只承接登录恢复，不与普通页面加载态混成一套“万能加载页”。
  - [x] 恢复来源页时只允许站内、可识别的安全路径；不要把任意外部 URL、危险 query 或错误路由直接当作跳转目标。

- [x] Task 5: 保持 Story 2.1 边界，避免提前吞并 Epic 2/3/4 后续能力 (AC: 1, 2, 3)
  - [x] 不在本故事实现“已登录创建者默认编辑权”“编辑密钥共享编辑”“统一查看/编辑授权状态”；这些分别属于 Story 2.2、2.3、2.4。
  - [x] 不在本故事实现“我的创建 / 我的收藏”列表、收藏动作、用户中心完整弹窗内容或删除动作；这些属于 Epic 3 / Epic 4。
  - [x] 不重做已有在线便签读取、保存、对象头部与本地便签模式，只在需要登录的入口与会话恢复层补齐最小 auth 闭环。
  - [x] 不为了“先跑通”而把 SSO 逻辑硬编码进前端页面、路由守卫或 note feature；应维持 `views + features + services + routes/plugins` 分层。

- [x] Task 6: 为登录确认与回跳恢复链路补齐测试与验收 (AC: 1, 2, 3)
  - [x] Web 测试至少覆盖：未登录状态入口触发 `SsoConfirmModal`、取消登录保留当前页面、确认登录进入回调处理态、回调成功后恢复来源页、回调失败时出现明确反馈。
  - [x] API 测试至少覆盖：`GET /api/auth/callback` 的成功建立会话、缺少参数 / 非法参数失败、统一错误语义，以及（若实现）`GET /api/me/session` 的匿名 / 已登录差异。
  - [x] 可访问性测试至少覆盖：modal 的打开关闭、焦点返回、主按钮键盘触发、回跳页文字状态存在，不只依赖颜色。
  - [x] 至少执行 `pnpm --filter @note/web test`、`pnpm --filter @note/api test`、`pnpm --filter @note/web typecheck`、`pnpm --filter @note/api typecheck`；若 auth 路由与前端装配改动较大，再补跑对应 `build`。

### Review Findings

- [x] [Review][Patch] `Modal` 只设置初始焦点和 `Escape` 关闭，未拦截 `Tab` 或屏蔽背景焦点，导致 `SsoConfirmModal` 打开后键盘焦点仍可逃离对话框，未满足本 story 对 modal 焦点管理的验收要求。 [apps/web/src/components/ui/Modal.vue:37]
- [x] [Review][Patch] 回跳页前端预校验把“缺少 `state`”和“缺少 `code`”合并成同一条 `AUTH_CODE_MISSING` 错误，用户在 `state` 丢失或被篡改时会看到错误原因与后端稳定错误语义不一致的提示。 [apps/web/src/features/auth/use-auth-flow.ts:86]
- [x] [Review][Patch] 服务端会话实现只在 `getSession()` 时按访问路径清理过期记录，未再次访问的过期 session 会永久留在内存 `Map` 中，登录量增长后会持续累积无效会话。 [apps/api/src/services/auth-session-service.ts:20]

## Dev Notes

### Story Intent

Story 2.1 的职责，是把 Epic 2 的“身份升级”从壳体推进成真实可走通的最小闭环。它不是权限模型本身，也不是用户中心本体，而是登录升级路径的入口与回跳承接层：用户在不被阅读或编辑主流程打断的前提下，确认登录、完成回跳、建立会话，然后回到原来的上下文继续做事。

这个故事最重要的 guardrail 不是“能跳去 SSO”，而是“跳出去再回来后仍然知道自己在哪”。如果回跳后把用户扔回陌生首页、丢失当前上下文、或者让登录状态只停留在模糊的视觉提示里，这个故事就没有兑现它的核心价值。

### Requirement Traceability

- FR21, FR22, FR23
- NFR1, NFR14, NFR15, NFR16, NFR17, NFR18, NFR19
- UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR13, UX-DR14, UX-DR15, UX-DR20

### Cross-Story Context

- Story 1.1 已经把 `/auth/callback` 路由壳体和 `AuthCallbackView.vue` 建出来，因此 2.1 不需要重新定义回调路由，只需把该路由从占位页推进为真实回跳承接页。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-1-app-shell-starter-template.md]
- Story 1.2 已经把首页和右上状态入口放进统一应用壳体，因此 2.1 的登录入口应优先接到现有 `AuthStatusPill` / `AppShell` 上，而不是另起新的登录页。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-2-home-sid-entry-mode-selection.md]
- Story 1.4、1.5、1.6 已经稳定了在线便签保存、对象头部反馈和本地便签独立模式，因此 2.1 需要避免为了登录流程去污染这些已稳定的主路径。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-6-local-note-standalone-mode.md]
- Story 2.2 之后才会接入“已登录创建者默认编辑权”，所以 2.1 当前只负责建立身份和恢复会话，不提前实现真正的资源授权判断。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md]

### Previous Story Intelligence

- Story 1.5 刚刚把右上状态入口与对象级反馈语言稳定下来，这意味着 2.1 最合适的接入点是复用现有 `AuthStatusPill`、`InlineFeedback`、`StatusPill` 等基础语义，而不是重做一套 auth 专用视觉体系。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md]
- Story 1.6 进一步强化了“状态文案收口到 feature 内 composable / adapter，而不是堆在模板里”的实现习惯，2.1 也应沿用 `feature + composable + view model` 的组织方式。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-6-local-note-standalone-mode.md]
- 最近提交 `313f1c1 feat: finish story 1.6 local note mode`、`903476d feat: finish story 1.5 note header feedback`、`37e8f4b fix story 1.4 review follow-ups` 说明当前实现节奏已经稳定在“围绕现有 feature 增量推进”的方向，2.1 应继续增量接入 auth 闭环，而不是回退到大改脚手架。 [Source: `git log --oneline -5` on 2026-04-04]

### Current Codebase Reality Check

- `apps/web/src/components/layout/AuthStatusPill.vue` 当前只是把 `auth-store` 的标签渲染成一个静态 `StatusPill`，还不能点击，也没有打开 modal 或进入用户中心的行为。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/components/layout/AuthStatusPill.vue]
- `apps/web/src/stores/auth-store.ts` 目前只有 `anonymous / recovering / authenticated` 三态和占位文案，且标签仍是英文占位；这说明 2.1 需要在不破坏 Pinia 边界的前提下把它推进成最小可用的会话感知 store。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/stores/auth-store.ts]
- `apps/web/src/features/auth/components/AuthCallbackCard.vue` 目前仍是“SSO 回调壳体已就位”的占位卡片，尚未承接 ticket / state 解析、会话恢复或错误反馈。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/auth/components/AuthCallbackCard.vue]
- `apps/web/src/views/AuthCallbackView.vue` 目前保持薄层，这符合架构方向；2.1 应延续这种“view 只装配 feature”的模式。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/views/AuthCallbackView.vue]
- `apps/api/src/routes/auth.ts` 当前只有 `/shell-status` 占位入口，说明 2.1 需要第一次把真实 auth API 闭环接进来。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/routes/auth.ts]
- `apps/api/src/routes/me.ts` 当前也只有 `/shell-status`，如果 2.1 需要前端单独确认当前会话，应在这里补最小 `me/session` 契约，而不是一口气进入“我的创建 / 我的收藏”能力。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/routes/me.ts]
- 当前 `packages/shared-types` 只有 `AuthStatus` 三态，没有 auth callback / session DTO，这意味着 2.1 最好把前后端 auth 契约补到 shared types 中，而不是只在单端本地声明。 [Source: /Users/youranreus/Code/Projects/note/packages/shared-types/src/index.ts]

### Technical Requirements

- 前端继续使用 `Vue 3 + Tailwind CSS + alova + axios + Pinia`，后端继续使用 `Fastify + Prisma`；不要为 2.1 额外引入新的状态库、认证 UI 库或路由状态库。 [Source: /Users/youranreus/Code/Projects/note/apps/web/package.json] [Source: /Users/youranreus/Code/Projects/note/apps/api/package.json]
- SSO 集成依赖 `@reus-able/sso-utils`，但必须通过 API 侧 facade / plugin 收口，前端页面与业务路由不得直接耦合三方库细节。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md] [Source: /Users/youranreus/Code/Projects/note/docs/tech-solution.md]
- 前端状态分层继续遵守“Pinia 只管理 auth 与 UI 状态，远端请求状态由 alova 管理”，不要把 note 详情、本地草稿或用户中心列表混入 auth store。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]
- 登录成功后的恢复目标必须限定为站内安全路径；不要把外部 URL 或不可信参数直接作为 redirect 目标。
- 匿名阅读路径必须保持可用，不能因为 2.1 的引入让 `/`、`/note/o/:sid`、`/note/l/:sid` 需要先登录才可访问。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md]
- 需要显式指出一个文档冲突：`docs/tech-solution.md` 早期写过“access token 存内存 + localStorage”，但当前架构文档已经收敛为“服务端会话 / 安全 cookie，前端只感知会话状态”；本故事应以后者为准。 [Source: /Users/youranreus/Code/Projects/note/docs/tech-solution.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]

### Architecture Compliance Guardrails

- `views` 继续只做路由级装配，auth 流程逻辑放在 `apps/web/src/features/auth`，不要把回调处理逻辑塞回 `AuthCallbackView.vue`。
- `routes` 只做参数读取、schema 校验与响应映射；SSO code exchange、state 校验、session 建立放在 `plugins/auth`、`services/auth` 或等价封装层。
- `packages/shared-types` 继续作为前后端 auth DTO 的契约收口点，避免 callback / session 返回体只在单端本地类型里“暗约定”。
- `apps/api/src/routes/me.ts` 若需补 `me/session`，只提供最小会话感知能力；不要在 2.1 提前把“我的创建 / 我的收藏”接口一并做掉。
- `/auth/callback` 回跳页必须保持独立中间态语义，不要和首页、在线页或通用加载态混成一个“万能 loading card”。
- 不允许把 SSO 与权限逻辑直接散落到 note feature 或普通 route handler 中。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]

### Library / Framework Requirements

- 当前前端版本固定为：`vue@^3.5.13`、`vue-router@^4.4.5`、`pinia@^2.3.0`、`alova@^3.0.6`、`axios@^1.7.9`、`vitest@^2.1.8`，故事实现应在这些版本范围内完成。 [Source: /Users/youranreus/Code/Projects/note/apps/web/package.json]
- 当前后端版本固定为：`fastify@^5.0.0`、`@fastify/cookie@^10.0.1`、`@fastify/cors@^10.0.1`、`@prisma/client@^5.22.0`、`@reus-able/sso-utils@^1.0.0`、`vitest@^2.1.8`。 [Source: /Users/youranreus/Code/Projects/note/apps/api/package.json]
- 现有 foundation 组件已经包含 `Modal`、`LoadingCard`、`InlineFeedback`、`Button`、`StatusPill`，2.1 应优先复用这些组件来实现 `SsoConfirmModal` 与 `CallbackLoadingCard`。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/components/ui/Modal.vue] [Source: /Users/youranreus/Code/Projects/note/apps/web/src/components/ui/LoadingCard.vue]
- 现有 workspace 统一通过 `pnpm` 管理脚本、`prepare:types` 和 `sync:env`，新增 auth 契约或环境变量说明时也应沿用这套工作流。 [Source: /Users/youranreus/Code/Projects/note/package.json]

### UX Guidance

- UX 已明确把登录升级拆成“三段式”：登录确认 modal、回跳加载页、恢复登录态后的原上下文，因此 2.1 应严格遵循这条旅程，而不是退化成直接跳转说明页或满屏错误页。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- 登录必须表现为“能力升级”，不是强制切断主流程；确认 modal 应简洁直接，不堆叠说明文案。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- 回跳页必须具备明确中间态，让用户知道系统正在做什么；成功后优先恢复原上下文，失败时提供清楚的下一步建议。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- 所有状态提示不能只依赖颜色，尤其是 SSO 失败、正在恢复、已登录这些高风险状态。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- modal 的焦点管理、关闭行为和返回触发源，是 2.1 的基础可访问性门槛，不是后补项。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]

### Data and API Notes

- 架构明确规定 SSO 登录由“前端触发跳转 / 回调承接 + 服务端 code exchange / userinfo / session establish”组成，前端不负责解析 token 或直接耦合三方 SSO。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- `GET /api/auth/callback?ticket=` 已在技术方案中被定义为回调换取会话的建议入口，2.1 可直接沿用这一路径语义。 [Source: /Users/youranreus/Code/Projects/note/docs/tech-solution.md]
- 如果实现 `GET /api/me/session`，返回体应只覆盖当前故事需要的最小会话感知，例如匿名 / 已登录状态、用户最小身份信息、可安全恢复的上下文所需字段；不要提前扩成完整用户中心 DTO。
- 跟踪 return-to 上下文时，前端可使用站内路由路径作为最小恢复线索，但 SSO 防伪 / CSRF 相关 state 校验应由服务端 auth facade 收口。

### File Structure Requirements

- 预计至少会修改：
  - `apps/web/src/components/layout/AuthStatusPill.vue`
  - `apps/web/src/stores/auth-store.ts`
  - `apps/web/src/views/AuthCallbackView.vue`
  - `apps/web/src/features/auth/components/AuthCallbackCard.vue`
  - `apps/api/src/routes/auth.ts`
  - `apps/api/src/routes/me.ts`
  - `packages/shared-types/src/index.ts`
- 预计会新增：
  - `apps/web/src/features/auth/components/SsoConfirmModal.vue`
  - `apps/web/src/features/auth/use-auth-flow.ts` 或等价 composable
  - `apps/web/src/features/auth/auth-flow.ts` 或等价状态适配文件
  - `apps/web/src/services/auth-methods.ts`
  - `apps/api/src/services/auth-session-service.ts` 或等价 auth service
  - `apps/api/src/plugins/auth/*` 或 `apps/api/src/services/auth/*`
  - `apps/web/tests/auth-callback.spec.ts`
  - `apps/web/tests/auth-status-pill.spec.ts`
  - `apps/api/tests/auth.spec.ts`
- 一般不应修改：
  - `apps/web/src/features/note/*`
  - `apps/web/src/features/local-note/*`
  - 收藏、删除、编辑密钥相关 feature
  - 用户中心完整弹窗与列表逻辑

### Testing Requirements

- Web 组件/页面测试至少覆盖：
  - 未登录状态入口点击后打开 `SsoConfirmModal`
  - 取消登录后 modal 关闭且焦点返回触发源
  - 确认登录后进入回调处理中间态
  - 回调成功后恢复到来源页或默认页
  - 回调失败时显示明确失败反馈与下一步建议
  - `AuthStatusPill` 文本与 tone 随匿名 / 恢复中 / 已登录状态正确变化
- API 测试至少覆盖：
  - `GET /api/auth/callback` 成功建立会话
  - 缺少必要参数返回稳定错误
  - 非法 state / 会话建立失败返回稳定错误语义
  - 若补了 `GET /api/me/session`，匿名态与已登录态返回结构可区分
- 回归测试至少覆盖：
  - 现有 `/auth/callback` 路由仍被注册
  - 匿名访问 `/`、`/note/o/:sid`、`/note/l/:sid` 不被登录前置阻断
  - 现有在线便签 / 本地便签测试不因 auth store 或 AppShell 改动回归
- 至少执行：
  - `pnpm --filter @note/web test`
  - `pnpm --filter @note/api test`
  - `pnpm --filter @note/web typecheck`
  - `pnpm --filter @note/api typecheck`
  - 如改动范围涉及路由和 auth API，补跑 `pnpm --filter @note/web build` 与 `pnpm --filter @note/api build`

### Git Intelligence Summary

- 最近的实现主线是“在线保存 -> 对象头部反馈 -> 本地模式”，说明 Epic 1 的内容主路径已经稳定，2.1 现在最适合补 auth 升级闭环，而不是再去返工 note 主流程。 [Source: `git log --oneline -5` on 2026-04-04]
- 当前分支里尚未出现真实 auth callback、session facade 或 SSO modal 实现，这意味着 2.1 是第一次把 auth 从壳体推进为真实能力，文档里必须把边界和落点写清楚，避免后续实现漫到 Epic 2 其它故事。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/routes/auth.ts] [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/auth/components/AuthCallbackCard.vue]

### Project Structure Notes

- 本项目约定规划类产物位于 `_bmad-output/planning-artifacts/`，实施类产物位于 `_bmad-output/implementation-artifacts/`；当前 story 文件只作为后续 dev-story 的实现上下文，不回写 PRD/Architecture/UX 主文档。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]
- 项目上下文明确要求：优先用 `pnpm`、优先中文输出、前端远端状态交给 alova、本地 UI/auth 状态才进入 Pinia；2.1 必须遵循这些规则。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]
- 检测到一个文档冲突：`docs/tech-solution.md` 早期 token 方案与当前 architecture 的安全 cookie 方案不一致。本故事已明确以后者为准，后续实现如需偏离，必须先显式说明。 [Source: /Users/youranreus/Code/Projects/note/docs/tech-solution.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]

### References

- [epics.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md)
- [prd.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md)
- [architecture.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md)
- [ux-design-specification.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md)
- [project-context.md](/Users/youranreus/Code/Projects/note/_bmad-output/project-context.md)
- [tech-solution.md](/Users/youranreus/Code/Projects/note/docs/tech-solution.md)
- [1-4-online-note-save-and-update.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md)
- [1-5-shareable-note-header-feedback.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md)
- [1-6-local-note-standalone-mode.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-6-local-note-standalone-mode.md)
- [AuthStatusPill.vue](/Users/youranreus/Code/Projects/note/apps/web/src/components/layout/AuthStatusPill.vue)
- [auth-store.ts](/Users/youranreus/Code/Projects/note/apps/web/src/stores/auth-store.ts)
- [AuthCallbackView.vue](/Users/youranreus/Code/Projects/note/apps/web/src/views/AuthCallbackView.vue)
- [AuthCallbackCard.vue](/Users/youranreus/Code/Projects/note/apps/web/src/features/auth/components/AuthCallbackCard.vue)
- [router/index.ts](/Users/youranreus/Code/Projects/note/apps/web/src/router/index.ts)
- [auth.ts](/Users/youranreus/Code/Projects/note/apps/api/src/routes/auth.ts)
- [me.ts](/Users/youranreus/Code/Projects/note/apps/api/src/routes/me.ts)
- [index.ts](/Users/youranreus/Code/Projects/note/packages/shared-types/src/index.ts)

## Change Log

- 2026-04-04: 创建 Story 2.1 上下文，补齐 SSO 登录确认、回跳恢复、会话建立边界、文件落点与测试要求，供后续 `dev-story` 直接实现。
- 2026-04-04: 完成 Story 2.1 实现，落地 Web 登录升级入口、回跳恢复链路、API auth callback/session 契约，以及对应 Web/API/可访问性测试。
- 2026-04-05: 根据 `SSO Endpoint.json` 修正真实 OAuth 响应结构解析，兼容 `code/msg/data` 包装返回，并补充 facade 级单测。

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 已完整读取 `sprint-status.yaml`，确认 Epic 1 已完成且下一条 backlog story 为 `2-1-sso-login-callback-recovery`。
- 已分析 `epics.md`、`prd.md`、`architecture.md`、`ux-design-specification.md`、`project-context.md` 与 `docs/tech-solution.md`，提取 Story 2.1 的登录升级、回跳恢复和会话建立边界。
- 已复盘 Story 1.4 / 1.5 / 1.6 的实施产物，确认当前项目已形成“feature 内 composable + adapter 收口状态，view 保持薄层”的稳定模式。
- 已检查当前代码库中的 `AuthStatusPill.vue`、`auth-store.ts`、`AuthCallbackView.vue`、`AuthCallbackCard.vue`、`apps/api/src/routes/auth.ts` 与 `apps/api/src/routes/me.ts`，确认 auth 相关实现目前仍以壳体为主，适合在既有位置增量落地。
- 已显式记录 `docs/tech-solution.md` 与 `architecture.md` 在 token / session 策略上的冲突，并将 Story 2.1 约束收敛到“服务端会话 / 安全 cookie，前端只感知会话状态”。
- 已将 Epic 2 的首条故事设为 `ready-for-dev`，并把 sprint tracking 同步到 `epic-2: in-progress`。
- 2026-04-04 11:49: 已将 `2-1-sso-login-callback-recovery` 的 sprint 状态切换为 `in-progress`，并先补上 Web/API auth 失败测试，作为后续实现的验收边界。
- 2026-04-04 11:56: 已完成 `SsoConfirmModal`、`use-auth-flow`、`AuthCallbackCard`、API auth plugin/service、`/api/auth/login`、`/api/auth/callback` 与 `/api/me/session` 的最小闭环实现。
- 2026-04-04 11:56: 已执行并通过 `pnpm --filter @note/web test`、`pnpm --filter @note/api test`、`pnpm --filter @note/web typecheck`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/web build`、`pnpm --filter @note/api build`。
- 2026-04-04 12:51: 根据补充约定修正 auth 链路：将 SSO 浏览器跳转地址与服务端端点拆分为 `VITE_SSO_URL` / `SSO_URL`，并将 callback query 参数从 `ticket` 统一收敛为 `code`。
- 2026-04-05 10:01: 根据 `docs/SSO Endpoint.json` 修正 SSO facade，支持 `/oauth/token` 与 `/oauth/user` 的 `code/msg/data` 包装响应，并补充 `auth-sso-service` 单测覆盖真实返回结构。

### Implementation Plan

- 先在 `packages/shared-types` 补齐 auth callback、session DTO 与安全 `returnTo` 归一化工具，统一前后端契约。
- Web 侧在 `features/auth` 中新增 auth flow composable / adapter 与 `SsoConfirmModal`，让 `AuthStatusPill` 负责打开确认弹窗并通过 API 登录入口发起升级。
- Web 侧把 `AuthCallbackCard` 推进为真实 `CallbackLoadingCard` 语义，负责解析 query、调用 callback 契约、写回 auth store 并恢复来源页。
- API 侧新增最小 auth plugin / service 分层，收口 SSO authorize URL、ticket 交换、服务端 session cookie 与 callback state 校验。
- 最后补全 auth 测试、跑 typecheck/test/build，并仅在验收全部通过后回写任务完成状态、文件列表、变更日志和 completion notes。

### Completion Notes List

- 已将右上状态入口升级为真实登录升级入口：未登录时打开 `SsoConfirmModal`，并复用 `Modal`、`Button`、`InlineFeedback`、`StatusPill` 表达必要登录语义与可访问性反馈。
- 已在 `apps/web/src/features/auth` 落地 `auth-flow.ts` 与 `use-auth-flow.ts`，把登录确认、回跳处理中、失败反馈、成功恢复与安全来源页回退都收口到 feature 层。
- 已将 `AuthCallbackCard.vue` 推进为真实 callback 中间态卡片，并在成功时恢复来源页、在失败时展示清晰错误文案与返回首页动作。
- 已在 API 侧新增 `plugins/auth.ts`、`auth-session-service.ts`、`auth-sso-service.ts`，通过服务端会话 cookie、state cookie 与 `@reus-able/sso-utils` facade 完成最小 SSO 闭环。
- 已新增 `/api/auth/login`、`/api/auth/callback`、`/api/me/session` 契约，并把 auth DTO 与 `returnTo` 安全归一化工具收口到 `packages/shared-types/src/index.ts`。
- 已补齐并通过 Web/API auth 测试与全量回归验证，确认匿名访问 `/`、`/note/o/:sid`、`/note/l/:sid` 不会被登录前置阻断。
- 已修正环境约定：浏览器授权跳转使用 `VITE_SSO_URL`，服务端 code exchange / userinfo 继续使用 `SSO_URL`，并将回跳参数口径统一为 `code`。
- 已按真实 SSO 文档兼容 `data` 包装响应，修复“SSO token 响应缺少可用的访问凭据”问题，并覆盖 token envelope / user envelope 的自动解包。

### File List

- `_bmad-output/implementation-artifacts/2-1-sso-login-callback-recovery.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `.env.example`
- `apps/api/src/app.ts`
- `apps/api/src/infra/config.ts`
- `apps/api/src/plugins/auth.ts`
- `apps/api/src/routes/auth.ts`
- `apps/api/src/routes/me.ts`
- `apps/api/src/services/auth-session-service.ts`
- `apps/api/src/services/auth-sso-service.ts`
- `apps/api/tests/auth.spec.ts`
- `apps/api/tests/auth-sso-service.spec.ts`
- `apps/web/src/components/layout/AuthStatusPill.vue`
- `apps/web/src/components/ui/Modal.vue`
- `apps/web/src/features/auth/auth-flow.ts`
- `apps/web/src/features/auth/components/AuthCallbackCard.vue`
- `apps/web/src/features/auth/components/SsoConfirmModal.vue`
- `apps/web/src/features/auth/use-auth-flow.ts`
- `apps/web/src/services/auth-methods.ts`
- `apps/web/src/stores/auth-store.ts`
- `apps/web/tests/auth-callback.spec.ts`
- `apps/web/tests/auth-status-pill.spec.ts`
- `packages/shared-types/src/index.ts`
- `scripts/sync-env.mjs`
