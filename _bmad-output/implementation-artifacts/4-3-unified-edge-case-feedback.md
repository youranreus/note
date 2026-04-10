# Story 4.3: 边界异常的统一反馈体系

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 任意使用者，
I want 在失效链接、错误密钥、无权限和登录回跳失败时得到清楚反馈，
so that 我能判断当前状态并知道下一步该做什么。

## Acceptance Criteria

1. 用户遇到不存在便签、已删除便签、错误密钥、无编辑权限或 SSO 回跳失败时，页面必须显示可理解的原因说明，并且每种异常至少提供一个明确的下一步建议。
2. 异常反馈在桌面端、移动端或辅助技术下都必须具有可读文本，不得只通过颜色、位置或短暂动画表达错误。
3. 保存、删除、登录和权限校验等边界场景的反馈样式与语气必须保持一致，不能让用户在不同页面看到彼此冲突的状态语义。
4. 页面展示加载中的中间状态时，非回跳场景优先使用内容区域内加载状态，不默认使用全局大遮罩覆盖整个应用。

## Tasks / Subtasks

- [x] Task 1: 收口统一反馈模型与承载组件，先对齐“原因 + 下一步”表达而不是重造全站基础设施 (AC: 1, 2, 3)
  - [x] 以 `apps/web/src/components/ui/InlineFeedback.vue`、`LoadingCard.vue`、`SurfaceCard.vue` 为主要承载器，优先做最小增强；不要为 4.3 引入新的 toast 库、全局事件总线或第二套错误页系统。
  - [x] 若 `InlineFeedback` 需要承载动态状态播报，优先增加可选的无障碍语义配置（例如 `role`、`aria-live`、`aria-atomic`、可关联的 `id`），同时保持现有调用方兼容。
  - [x] 统一反馈最小结构至少包含：`title`、`description`、`tone`、`state`；“下一步建议”可以体现在 `description` 或邻近的次级操作中，但不得缺失。
  - [x] 明确同一语义的 tone 映射：例如“需要进一步动作但不是系统故障”保持 warning；“真正失败或危险终态”保持 danger/error；避免同一种错误在不同页面忽然变成不同 tone。

- [x] Task 2: 对齐在线便签页的异常反馈分支，复用现有 view model / composable / shell 模式 (AC: 1, 2, 3, 4)
  - [x] 以 `apps/web/src/features/note/online-note.ts` 为单一前端反馈映射入口，系统梳理 `invalid-sid`、`not-found`、`deleted`、`key-required`、`key-invalid`、`forbidden`、泛化 `error`、收藏失败、保存失败、删除失败等分支，不要在组件里散落硬编码文案。
  - [x] 对每个异常分支补齐“发生了什么”和“下一步能做什么”，例如：检查 `sid`、输入正确密钥、使用创建者身份重新登录、返回首页重新发起登录、稍后重试。
  - [x] 保持字段级与页面级反馈边界：编辑密钥相关失败优先在输入框邻近区域或当前对象反馈区表达；不存在/已删除/读取失败等页面级终态继续在对象级区域承载。
  - [x] 继续沿用 Story 4.2 的 deleted 终态：`NOTE_DELETED` 与 `NOTE_NOT_FOUND` 绝不能被 4.3 的统一反馈误收敛成同一条泛化错误，也不要新增“恢复删除内容”的表达或入口。
  - [x] 普通在线便签加载继续使用 `OnlineNoteShell` 内容区内 loading + inline feedback 模式；不要把主路径加载改造成全屏遮罩。

- [x] Task 3: 对齐 SSO 回跳失败与登录恢复反馈，保持回调页与对象页语气一致 (AC: 1, 2, 3, 4)
  - [x] 以 `apps/web/src/features/auth/auth-flow.ts` 与 `AuthCallbackCard.vue` 为主入口，梳理 `AUTH_CODE_MISSING`、`AUTH_STATE_INVALID`、`AUTH_CALLBACK_FAILED` 与成功恢复分支的标题、描述、tone 和下一步动作。
  - [x] 回调失败时必须继续保留明确的恢复动作（例如返回首页、重新发起登录），但不要跳去未知页面或展示无意义的技术报错。
  - [x] `AuthCallbackCard` 应继续使用卡片内 `LoadingCard` / `InlineFeedback` 承载 loading 与 error，不与普通页面混用全局遮罩。
  - [x] 若统一反馈需要抽共享 resolver，优先让 `features/auth` 复用与在线便签一致的 copy / tone 规则，而不是复制一份平行逻辑。

- [x] Task 4: 只按“剩余缺口补齐”原则收口跨页面一致性，不把 4.3 做成无限扩张的收尾重构 (AC: 1, 2, 3)
  - [x] 如果 `features/user-panel`、收藏相关流或其他现有页面存在明显冲突语义，优先通过共享 message resolver 或最小文案对齐修补，而不是顺手重写整套页面结构。
  - [x] 可以复用 `apps/web/src/features/user-panel/user-panel.ts` 中现有的 `resolveUserPanelErrorMessage()` 模式，避免每个页面都手写 `error.response.data.message` 抽取逻辑。
  - [x] 若需要统一后端默认 message，优先在 `apps/api/src/services/note-read-service.ts`、`note-write-service.ts`、`favorite-service.ts`、`routes/auth.ts` 等既有错误源做最小调整，保持 `code + message` 契约稳定。
  - [x] 4.3 的目标是统一表现层和剩余缺口，不是重做 4.1/4.2 的状态机，不是引入全局 store 存远端错误，也不是扩写本地便签 / 用户中心的大规模新交互。

- [x] Task 5: 为动态反馈补齐可访问性语义，确保不是“只看颜色才懂” (AC: 2, 3, 4)
  - [x] 若反馈内容会在不刷新页面的情况下动态变化，默认优先使用非阻断式播报语义（例如 `role="status"` / `aria-live="polite"` / `aria-atomic="true"`），保证辅助技术能读到完整上下文。
  - [x] 仅在真正需要立即打断用户的严重错误上考虑 `role="alert"`；不要为了“更明显”把所有反馈都做成 assertive alert。
  - [x] 输入说明、错误提示与关键状态需要有明确可读文本，并通过 `aria-describedby` 或邻近可读节点与输入关联，避免把完整说明塞进 placeholder。
  - [x] 若增加 live region 语义，必须避免同一消息重复播报或因 role/aria-live 叠加导致双重朗读。

- [x] Task 6: 用 focused regression tests 固化统一反馈语义与范围边界 (AC: 1, 2, 3, 4)
  - [x] Web 测试至少覆盖：`not-found` / `deleted` / `forbidden` / `key-required` / `key-invalid` / 泛化 error 的标题、描述、tone 与下一步建议；并确认同一语义在 note 与 auth callback 里不相互冲突。
  - [x] 若 `InlineFeedback` 增加无障碍语义，补齐对应组件测试或高层集成断言，确认动态反馈具备可读文本和预期 role/`aria-live` 行为。
  - [x] `apps/web/tests/auth-callback.spec.ts` 至少覆盖：缺少 `code`、失效 `state`、回调请求失败、成功恢复四类路径，并断言失败时存在清晰恢复动作。
  - [x] `apps/web/tests/use-online-note.spec.ts` / `online-note.spec.ts` 继续覆盖 Story 4.2 的 deleted 终态，不允许 4.3 的统一反馈把 deleted/not-found/error 混成一类。
  - [x] 若后端默认 message 或 schema 有改动，补齐 `apps/api/tests/auth.spec.ts`、`notes-read.spec.ts`、`note-read-service.spec.ts`、`favorites.spec.ts` 的针对性断言，但不要为了 4.3 做无关的大面积接口重写。
  - [x] 至少执行 `pnpm --filter @note/web test`、`pnpm --filter @note/web typecheck`、`pnpm --filter @note/api test`、`pnpm --filter @note/api typecheck`；若共享 UI / API message 影响构建，再补跑对应 `build`。

### Review Findings

- [x] [Review][Patch] Auth callback card lacks a safe fallback for unexpected callback error codes [`apps/web/src/features/auth/auth-flow.ts:136`]
- [x] [Review][Patch] Anonymous first-save edit-key risk feedback is dynamic but missing polite live-region semantics [`apps/web/src/features/note/components/OnlineNoteShell.vue:195`]

## Dev Notes

### Story Intent

Story 4.3 的目标不是“再造一个全局错误系统”，而是在现有 `note` 产品已经成型的对象页、回调页和权限流之上，把剩余边界异常收口成同一套可理解、可信、可访问的反馈语言。

最容易做坏的地方有三个：第一，把 4.3 做成无限扩张的“统一收尾 story”，顺手重写太多页面；第二，把 4.2 已经稳定的 deleted 终态重新打散，导致 deleted / not-found / generic error 重新混淆；第三，只追求视觉统一，却忽略“原因 + 下一步 + 可访问性”这三个真正的验收核心。本 story 必须优先补齐缺口并固化规则，而不是追求炫技式重构。

### Requirement Traceability

- FR42
- NFR13, NFR14, NFR17, NFR19, NFR20
- UX-DR6, UX-DR7, UX-DR20

### Epic Context

- Story 4.1 已完成删除确认、受权删除、当前对象页删除反馈和缓存失效，建立了“结构化错误码 -> 明确 feedback / terminal state”的主链路。
- Story 4.2 已完成 deleted 链接重访与不可恢复语义，把 `NOTE_DELETED` 稳定落到 deleted 终态，并明确与 `NOTE_NOT_FOUND`、generic error 分离。
- Story 4.3 现在要把不存在、已删除、错误密钥、无权限、登录回跳失败、加载态等剩余边界场景收口成统一体系，但不重做 4.1/4.2 的领域逻辑。
- `implementation-readiness-report-2026-04-02.md` 已明确提醒 4.3 范围偏宽；实施时应按“统一反馈规范与剩余缺口补齐”的心态推进，必要时在 dev-story 内继续按异常来源拆执行子任务。

### Current Codebase Findings

- `apps/web/src/components/ui/InlineFeedback.vue` 已经是仓库内统一内联反馈承载器，支持 `title`、`description`、`tone`、`state`，但当前还没有显式 live-region 或下一步建议抽象，是 4.3 最自然的增强点。
- `apps/web/src/features/note/online-note.ts` 已经集中处理在线便签的 view model、保存/删除反馈、对象头状态和复制/收藏成功反馈，是在线异常反馈的单一前端映射入口，不应把这些逻辑再分散到多个组件。
- `apps/web/src/features/note/use-online-note.ts` 已经负责远端请求、deleted 终态、缓存失效和反馈清理；它说明 4.3 应继续依赖 composable + Alova，而不是把远端错误塞进 Pinia。
- `apps/web/src/features/note/components/OnlineNoteShell.vue` 已经形成“内容区 loading / editable shell / terminal feedback”三态承载，是非回跳场景加载模式的现成实现。
- `apps/web/src/features/auth/components/AuthCallbackCard.vue` 与 `auth-flow.ts` 已经采用 `SurfaceCard + LoadingCard + InlineFeedback + 返回首页` 的回调失败模型，适合作为统一反馈体系中 auth 侧的基线，而不是新建一张独立错误页。
- `apps/web/src/features/user-panel/user-panel.ts` 已有 `resolveUserPanelErrorMessage()` 这种“优先复用后端 message”的轻量模式；如 4.3 需要触达跨页面一致性，可在这个方向上抽共用 resolver，而不是复制更多 `axios` 错误解析代码。
- API 侧已经稳定返回结构化 `code + message`：例如 `apps/api/src/services/note-read-service.ts` 的 `NOTE_NOT_FOUND` / `NOTE_DELETED`，以及 `apps/api/src/routes/auth.ts` 的 `AUTH_CODE_MISSING` / `AUTH_STATE_INVALID` / `AUTH_CALLBACK_FAILED`，说明 4.3 可以在现有契约上最小修文案与前端映射，不需要推翻接口形状。
- 仓库内未发现全局 toast / message bus 体系；当前产品主要依赖 inline feedback、对象头状态和回调卡片，这正符合 PRD/UX 的“轻量但明确”方向。

### Technical Requirements

- 每个异常分支都必须回答两个问题：发生了什么、用户下一步能做什么；不允许回退成“操作失败，请稍后重试”一刀切文案。
- 必须明确区分至少这些语义：`NOTE_NOT_FOUND`、`NOTE_DELETED`、`NOTE_EDIT_KEY_REQUIRED`、`NOTE_EDIT_KEY_INVALID`、`NOTE_FORBIDDEN`、泛化 read/save/delete/favorite error、`AUTH_CODE_MISSING`、`AUTH_STATE_INVALID`、`AUTH_CALLBACK_FAILED`。
- `NOTE_DELETED` 继续保持 Story 4.2 的 deleted 终态契约，不得被统一反馈逻辑降级成 not-found，也不得重新暴露恢复路径。
- 普通页面的加载必须继续在内容区内承载；`/auth/callback` 回调页维持独立 loading card，不能回退成默认全局大遮罩。
- 输入相关异常应尽量在输入附近或当前对象反馈区表达，尤其是编辑密钥相关失败；不要把所有错误都丢到页面最顶部，导致用户无法判断和哪个输入有关。
- 可恢复错误应尽量保留用户当前输入，避免二次挫败；只有 deleted 这类终态才按 4.2 约定清空不应再使用的正文/密钥内存。
- 若统一文案需要调整 API 默认 message，必须保持既有错误 code、HTTP 契约和测试基线稳定；不要顺手发明新的错误码枚举。
- 若增强 `InlineFeedback` 无障碍语义，新增 props 必须向后兼容现有调用点，避免引入全仓库破坏性改动。
- 统一 feedback copy 时，必须同时检查标题、描述、tone、state、按钮/动作文案与加载语义，而不是只改标题字符串。

### Architecture Compliance

- 保持 REST 资源边界：notes 异常继续由 `notes` 读取/写入链路返回，auth 回跳异常继续由 `auth` 路由与 `auth-flow` 收口；不要新增 `/api/errors/*` 之类旁路接口。
- 保持服务端错误收口：route 负责参数读取与 HTTP 状态映射，稳定 `code + message` 仍由服务层或 route 的既有错误工厂统一生成。
- 保持前端状态边界：Pinia 只管理会话与 UI；远端详情、错误、反馈与缓存失效继续由 Alova/composable 管理，不增加新的全局 error store。
- 保持在线 / 本地模式边界：4.3 统一的是反馈语言和承载模式，不是把在线 API 异常模型硬套到本地便签数据流。
- 保持 4.3 范围边界：这是一个“统一反馈与补缺口”的 story，不是删除系统、用户中心、SSO、设计系统的全面重写。

### Library / Framework Requirements

- 继续沿用当前仓库技术栈：Vue 3 Composition API + `<script setup>`、Tailwind、alova、axios、Fastify、Vitest；4.3 不需要新增 toast 库、状态机库或第三方无障碍消息框库。
- UI 优先复用 `InlineFeedback`、`LoadingCard`、`SurfaceCard`、`TextInput`、`Button` 等 foundation 组件，而不是为了统一反馈重新做一套 feature 级基础组件。
- Vue 官方可访问性文档继续建议使用真实语义结构、显式 label/description 关联和合适的焦点管理；如果 4.3 需要把错误与输入关联，应优先使用 `aria-describedby` 等原生方式，而不是依赖 placeholder 承载完整说明。 [Source: `https://vuejs.org/guide/best-practices/accessibility`]
- MDN 当前 live region 指南建议：普通动态状态优先使用 `aria-live="polite"`；只有真正时效性/中断型告警才用 assertive/`role="alert"`；若需要播报完整文本，可结合 `aria-atomic="true"`。 [Source: `https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions`]
- MDN 还提醒 `role="alert"` 与冗余 `aria-live` 叠加在部分浏览器/读屏组合上可能造成双重朗读，因此若增强 `InlineFeedback`，应优先用清晰、可配置的语义策略，而不是“一律 alert”。 [Source: `https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions`]

### File Structure Requirements

- 很可能需要修改：
  - `apps/web/src/components/ui/InlineFeedback.vue`
  - `apps/web/src/features/note/online-note.ts`
  - `apps/web/src/features/note/use-online-note.ts`
  - `apps/web/src/features/note/components/OnlineNoteShell.vue`
  - `apps/web/src/features/auth/auth-flow.ts`
  - `apps/web/src/features/auth/components/AuthCallbackCard.vue`
  - `apps/api/src/services/note-read-service.ts`
  - `apps/api/src/services/note-write-service.ts`
  - `apps/api/src/services/favorite-service.ts`
  - `apps/api/src/routes/auth.ts`
- 可能按最小需要修改：
  - `apps/web/src/features/user-panel/user-panel.ts`
  - `apps/web/src/features/user-panel/use-user-panel.ts`
  - `apps/api/tests/auth.spec.ts`
  - `apps/api/tests/notes-read.spec.ts`
  - `apps/api/tests/note-read-service.spec.ts`
  - `apps/api/tests/favorites.spec.ts`
  - `apps/web/tests/auth-callback.spec.ts`
  - `apps/web/tests/online-note.spec.ts`
  - `apps/web/tests/use-online-note.spec.ts`
- 必要时可新增：
  - `apps/web/src/components/ui/inline-feedback.ts` 或同目录轻量 helper，用于统一 feedback semantic props / resolver；只有在 `InlineFeedback.vue` 无法再保持清晰时才新增。
- 一般不应修改：
  - `apps/web/src/features/local-note/*` 的主要存储逻辑
  - `apps/web/src/stores/auth-store.ts`
  - `apps/web/src/router/*`
  - `apps/api/src/routes/notes.ts` 的 HTTP 契约形状
  - 任何“恢复已删除内容”或“全局错误总线”类新基础设施

### Testing Requirements

- Web / UI 层至少覆盖：
  - 在线便签 `not-found`、`deleted`、`forbidden`、`key-required`、`key-invalid`、generic error 的标题、描述、tone、state 与下一步建议保持清晰可区分。
  - 统一反馈不破坏 Story 4.2 的 deleted 终态：deleted 不显示 editor / object header / delete / favorite / share action，且不会退回 not-found。
  - 编辑密钥相关失败仍保留用户输入与输入邻近说明，不因为统一反馈而失去上下文。
  - `AuthCallbackCard` 的 success / loading / missing-code / invalid-state / callback-failed 分支文案与动作清晰，失败时仍可返回首页或重新发起登录。
  - 若 `InlineFeedback` 增加 live-region 语义，断言其具备预期的 role / `aria-live` / `aria-atomic` 或其他可访问性输出，而不是只断言 class。
- API / service 层至少覆盖：
  - 若调整了 notes / auth / favorites 默认 message，原有错误 code、status 与 HTTP 状态码不回归。
  - `NOTE_DELETED`、`NOTE_NOT_FOUND`、`AUTH_CODE_MISSING`、`AUTH_STATE_INVALID`、`AUTH_CALLBACK_FAILED` 等代表性分支保持稳定契约。
- 回归要求：
  - Story 4.1 的删除确认与删除失败反馈不回归。
  - Story 4.2 的 deleted 链接重访、刷新、重挂载和登录态切换不回归。
  - 现有 `AuthCallbackCard` 的路由恢复与“返回首页”动作不回归。
- 最少验证命令：
  - `pnpm --filter @note/web test`
  - `pnpm --filter @note/web typecheck`
  - `pnpm --filter @note/api test`
  - `pnpm --filter @note/api typecheck`
  - 如修改了构建入口、共享 UI 或服务端响应默认文案影响打包，再补跑 `pnpm --filter @note/web build` / `pnpm --filter @note/api build`

### Previous Story Intelligence

- Story 4.1 已经建立“结构化错误码 -> 明确删除反馈 / terminal state”的实现模式，并把删除确认固定在 `Modal.vue` 基础上；4.3 应复用这套错误映射和交互节奏，而不是再造新的危险操作反馈体系。 [Source: `_bmad-output/implementation-artifacts/4-1-delete-confirmation-authorized-delete.md`]
- Story 4.2 已经明确 deleted 终态边界：deleted 与 not-found / generic error 必须分开，deleted 成功后要清理不应继续使用的正文与密钥状态，且默认保持 `404 + NOTE_DELETED` 契约。4.3 不得破坏这些约束。 [Source: `_bmad-output/implementation-artifacts/4-2-deleted-link-irreversible-semantics.md`]
- 4.2 的 code review 暴露过 stale data、自动收藏误触发、缺失 focused regression 等问题，说明 4.3 做统一反馈时必须同时关注“状态清理”和“回归矩阵”，不能只改页面文案。 [Source: `_bmad-output/implementation-artifacts/4-2-deleted-link-irreversible-semantics.md`]
- 当前代码已存在足够多的复用点：`InlineFeedback`、`resolveOnlineNote*` 工厂、`AuthCallbackCard`、`resolveUserPanelErrorMessage()`；最危险的反模式是为了统一反馈再引入第二套 message resolver 或第二个全局状态源。

### Git Intelligence Summary

- 最近的 Epic 4 提交都采用“垂直切片 + 配套 focused tests”的风格：先在现有 feature 上做最小闭环，再补回归，而不是先抽一套宏大的基础设施。
- 提交信息显示当前仓库更偏向在 `feat(note)` / `feat(web)` 中直接落业务改动，并在 `fix(...)` 中处理 review findings；4.3 也应延续这种“小步收口、测试先行”的节奏。
- Story 3.4 和 Epic 4 最近提交都强调可访问性、焦点管理和 review-driven 修补，说明 4.3 在做“统一反馈”时必须把 a11y 作为一等要求，而非纯视觉对齐。

### Latest Technical Notes

- Vue 官方可访问性指南仍强调：使用真实 heading / label / description 结构、必要时在路由变化或动态界面变化后显式管理焦点，而不是依赖视觉位置暗示用户当前状态。 [Source: `https://vuejs.org/guide/best-practices/accessibility`]
- Vue 官方还建议把输入说明放在输入外部可读节点，并通过 `aria-describedby` 等方式与控件关联；这与本项目“编辑密钥错误应出现在输入附近，而不是页面顶部统一报错”的 UX 规则一致。 [Source: `https://vuejs.org/guide/best-practices/accessibility`]
- MDN live region 指南指出，动态内容如果要被辅助技术读到，相关 `aria-live` 或 live-region role 需要在内容变化前就存在；如果只是在视觉上替换文本而没有正确 live region，读屏用户可能感知不到变化。 [Source: `https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions`]
- MDN 还指出 `aria-atomic="true"` 适合在状态消息每次变更时播报完整上下文，而不是只播报最后几个变更片段；这对“标题 + 描述”的反馈组件尤其重要。 [Source: `https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions`]

### Project Structure Notes

- 项目上下文要求默认使用 `pnpm`，并把远端请求缓存交给 Alova、把会话和 UI 状态交给 Pinia；4.3 必须完全遵守，不得新增第三个远端状态来源。 [Source: `_bmad-output/project-context.md`]
- `project-context.md` 明确要求：当真实代码与旧 `docs/` 蓝图存在冲突时，先显式指出冲突，再决策。对 4.3 来说，这意味着异常反馈应优先贴近当前 `apps/web` / `apps/api` 已经落地的结构化错误契约，而不是回退到过时草案。 [Source: `_bmad-output/project-context.md`]
- `implementation-readiness-report-2026-04-02.md` 已提醒 Story 4.3 接近“统一收尾 story”；因此 dev 阶段若发现范围继续膨胀，应主动按异常来源拆子任务，而不是一次性扩写全站。 [Source: `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-02.md`]
- UX 方向明确偏向“轻量但明确”的反馈，优先 inline status / 轻量卡片，而不是嘈杂的后台式错误体系；这与当前代码里的 `InlineFeedback` / `LoadingCard` / `SurfaceCard` 基础一致。 [Source: `_bmad-output/planning-artifacts/ux-design-specification.md`]

### References

- `_bmad-output/planning-artifacts/epics.md`
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-02.md`
- `_bmad-output/project-context.md`
- `_bmad-output/implementation-artifacts/4-1-delete-confirmation-authorized-delete.md`
- `_bmad-output/implementation-artifacts/4-2-deleted-link-irreversible-semantics.md`
- `apps/web/src/components/ui/InlineFeedback.vue`
- `apps/web/src/components/ui/LoadingCard.vue`
- `apps/web/src/features/note/online-note.ts`
- `apps/web/src/features/note/use-online-note.ts`
- `apps/web/src/features/note/components/OnlineNoteShell.vue`
- `apps/web/src/features/auth/auth-flow.ts`
- `apps/web/src/features/auth/components/AuthCallbackCard.vue`
- `apps/web/src/features/user-panel/user-panel.ts`
- `apps/api/src/services/note-read-service.ts`
- `apps/api/src/services/note-write-service.ts`
- `apps/api/src/services/favorite-service.ts`
- `apps/api/src/routes/auth.ts`
- `apps/api/tests/auth.spec.ts`
- `apps/api/tests/notes-read.spec.ts`
- `apps/api/tests/note-read-service.spec.ts`
- `apps/api/tests/favorites.spec.ts`
- `apps/web/tests/auth-callback.spec.ts`
- `apps/web/tests/online-note.spec.ts`
- `apps/web/tests/use-online-note.spec.ts`
- [Vue Accessibility Guide](https://vuejs.org/guide/best-practices/accessibility)
- [MDN ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)

## Change Log

- 2026-04-10: 创建 Story 4.3 上下文，明确“统一反馈体系”以最小复用方式收口在线便签、权限、删除终态与 SSO 回跳失败，并补充范围控制、无障碍语义与 focused regression 测试要求，供后续 `dev-story` 直接实现。
- 2026-04-10: 完成 Story 4.3 实现，新增统一 inline feedback model 与 live-region 语义，收口 note/auth 异常反馈 copy 与 tone 规则，补齐编辑密钥 `aria-describedby` 关联与 focused regression tests，并通过 web/api test、typecheck 与 web build 验证。

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Implementation Plan

- 先在现有 `InlineFeedback` / `LoadingCard` / `resolveOnlineNote*` / `AuthCallbackCard` 之上确认统一 feedback contract，决定哪些能力通过轻量 props 增强，哪些继续放在 feature resolver 内。
- 再对齐在线便签与 auth callback 的异常分支，补齐“原因 + 下一步 + tone/state 一致性”，同时严格保持 Story 4.2 的 deleted 语义和 Story 4.1 的删除反馈不回归。
- 最后补齐 focused API / Web regression tests，并用 `pnpm` 过滤命令完成 test / typecheck / 必要 build 验证。

### Debug Log References

- 已完整读取 `sprint-status.yaml`，确认 `4-3-unified-edge-case-feedback` 是当前第一条 `ready-for-dev` 的 story，随后已按流程把 story 与 sprint 状态推进到 `in-progress`，并在完成后更新到 `review`。
- 已抽取 `epics.md`、`prd.md`、`architecture.md`、`ux-design-specification.md` 与 `project-context.md` 中和 4.3 直接相关的 FR / NFR / UX / 分层约束，并核对 Epic 4 与 Story 4.1 / 4.2 的边界。
- 已检查 `InlineFeedback.vue`、`OnlineNoteShell.vue`、`online-note.ts`、`use-online-note.ts`、`AuthCallbackCard.vue`、`auth-flow.ts` 与 `user-panel.ts`，确认仓库已有足够复用点，不需要新增全局 toast 或 error bus。
- 已核对 `apps/api/src/services/note-read-service.ts` 与 `apps/api/src/routes/auth.ts` 的默认错误 message，确认 notes / auth 已具备稳定 `code + message` 契约，4.3 可以在现有契约上做最小对齐。
- 已参考最近提交 `feat(note): 收口已删除在线便签终态与回访语义`、`feat(note): 在线便签受权删除与确认弹窗`、`feat(web): 强化个人中心可访问性与焦点管理`，确认当前仓库风格偏向“最小垂直切片 + focused tests + review-driven 修补”。
- 已参考最新公开文档，补充 live region、`aria-describedby` 与动态反馈播报策略，确保 story 对可访问性要求不是抽象口号而是可落地 guardrail。
- 已在 `apps/web/src/components/ui/inline-feedback.ts` 中收口共享 feedback model，并为 `InlineFeedback.vue`、`TextInput.vue`、`OnlineNoteShell.vue`、`AuthCallbackCard.vue` 补齐动态播报与输入关联语义。
- 已将在线便签的保存 / 删除 / 收藏 / 复制反馈统一收口到 `apps/web/src/features/note/online-note.ts`，同时保留 Story 4.2 的 deleted 终态边界，不把 deleted/not-found/generic error 混成一类。
- 已在 `apps/web/src/features/auth/auth-flow.ts` 与 `use-auth-flow.ts` 中补齐 `AUTH_CODE_MISSING`、`AUTH_STATE_INVALID`、`AUTH_CALLBACK_FAILED`、success 分支的统一标题、描述、tone 与恢复建议。
- 已执行验证：`pnpm --filter @note/web test`、`pnpm --filter @note/web typecheck`、`pnpm --filter @note/web build`、`pnpm --filter @note/api test`、`pnpm --filter @note/api typecheck` 全部通过。

### Completion Notes List

- 已新增共享 `InlineFeedbackModel`，把 note/auth 的动态 inline feedback 统一为 `title + description + tone + state + a11y` 结构，并默认使用非阻断式 `status/polite/atomic` 播报。
- 已增强 `TextInput.vue`，为动态错误和说明补齐 `id`、`aria-invalid`、`aria-describedby`；编辑密钥相关反馈现在会与密码输入建立可访问性关联。
- 已收口在线便签反馈映射：`invalid-sid`、deleted、key-required、key-invalid、forbidden、favorite failure、save failure、delete failure 都提供“发生了什么 + 下一步建议”，且保留 4.2 deleted 不可恢复语义。
- 已收口 auth callback 反馈映射：缺少 code、失效 state、callback 失败、success 恢复都统一通过 `AuthCallbackCard` 的 `InlineFeedback` 呈现，并保留明确恢复动作。
- 已补齐 focused regression tests，包括 `InlineFeedback` 语义、auth callback 四类路径，以及 note shell / composable 的编辑密钥关联与 deleted 回归边界。

### File List

- _bmad-output/implementation-artifacts/4-3-unified-edge-case-feedback.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- apps/web/src/components/ui/InlineFeedback.vue
- apps/web/src/components/ui/TextInput.vue
- apps/web/src/components/ui/inline-feedback.ts
- apps/web/src/features/auth/auth-flow.ts
- apps/web/src/features/auth/components/AuthCallbackCard.vue
- apps/web/src/features/auth/use-auth-flow.ts
- apps/web/src/features/note/components/OnlineNoteShell.vue
- apps/web/src/features/note/online-note.ts
- apps/web/src/features/note/use-online-note.ts
- apps/web/tests/auth-callback.spec.ts
- apps/web/tests/inline-feedback.spec.ts
- apps/web/tests/online-note.spec.ts
- apps/web/tests/use-online-note.spec.ts
