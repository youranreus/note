# Story 4.1: 删除确认与受权删除

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 有管理权限的用户，
I want 在清楚理解后果的前提下删除便签，
so that 我可以明确结束一条内容的生命周期。

## Acceptance Criteria

1. 用户对某条便签拥有删除权限时，触发删除动作后系统必须先展示阻断式确认对话框，并明确说明删除不可恢复的后果。
2. 用户在确认对话框中最终确认删除时，系统必须执行删除请求，把该便签置为不可再访问的终态，并向用户返回明确成功或失败反馈。
3. 用户没有相应管理权限时，系统必须拒绝删除请求，并明确反馈这是权限问题，而不是泛化错误。

## Tasks / Subtasks

- [x] Task 1: 为删除动作补齐共享 DTO 与 REST 契约，保持 `notes` 资源错误语义一致 (AC: 1, 2, 3)
  - [x] 在 `packages/shared-types/src/index.ts` 中新增删除成功 DTO 与删除错误 DTO，沿用当前 `sid/code/status/message` 风格，不返回原始布尔值、裸字符串或前端自猜结果。
  - [x] 删除错误码优先复用现有 notes 语义，例如 `INVALID_SID`、`NOTE_NOT_FOUND`、`NOTE_DELETED`、`NOTE_FORBIDDEN`、`NOTE_EDIT_KEY_REQUIRED`、`NOTE_EDIT_KEY_INVALID`、`NOTE_SID_CONFLICT`；不要为删除单独发明一套不兼容的错误体系。
  - [x] 若删除需要编辑密钥校验，沿用 `x-note-edit-key` header 传递当前内存中的密钥值，不新增 query 参数，也不把明文密钥落到本地持久化存储。

- [x] Task 2: 在 API 侧实现 `DELETE /api/notes/:sid`，把授权、终态和错误映射收口到服务层 (AC: 1, 2, 3)
  - [x] 在 `apps/api/src/routes/notes.ts` 中新增 `DELETE /:sid` 路由，保持 route 只负责参数读取、header 提取、schema 校验和 HTTP 状态码映射，不在 route handler 内堆权限逻辑。
  - [x] 在 `apps/api/src/schemas/note.ts` 中补齐 delete params、headers、success、error schema，保证成功与失败结构都可被前端稳定识别。
  - [x] 在 `apps/api/src/services/note-write-service.ts` 中新增 `deleteBySid()`，优先复用现有按 `sid` 查找、冲突检测、`resolveNoteAuthorizationContext()`、编辑密钥校验与锁策略；不要新建一套旁路 note-delete 逻辑复制已有授权分支。
  - [x] 当前仓库已经在读写链路中消费 `notes.deleted_at`，因此删除实现应优先采用单记录软删除：对唯一 `sid` 对应记录写入 `deleted_at`，而不是恢复历史 `deleteMany(sid)` 风险写法；对外产品语义仍然是不可恢复终态。
  - [x] 删除权限必须继续遵守“资源所有权 + 编辑密钥”双轨模型：创建者身份可删；密钥可编辑对象在提供正确密钥时也可删；缺失/错误密钥与普通 `NOTE_FORBIDDEN` 必须可区分。
  - [x] 已删除对象再次删除时应返回稳定 `NOTE_DELETED` 终态语义；不存在对象返回 `NOTE_NOT_FOUND`；重复 `sid` 数据异常继续返回 `NOTE_SID_CONFLICT`，不要把这些分支吞成统一 500。

- [x] Task 3: 在在线便签对象层接入删除入口与阻断式确认弹窗，复用现有 foundation 组件与可访问性模式 (AC: 1)
  - [x] 以 `apps/web/src/features/note/components/NoteObjectHeader.vue` 和 `apps/web/src/features/note/components/OnlineNoteShell.vue` 为主入口挂载删除动作，优先把删除放在对象页操作区，而不是额外新增后台页、资产页或路由。
  - [x] 删除按钮仅在当前对象对用户可删时展示，至少覆盖 `owner-editable` 与通过有效密钥进入的 `key-editable`；`forbidden`、`key-required`、`not-found`、`deleted` 状态不得暴露可执行删除动作。
  - [x] 删除确认弹窗必须基于 `apps/web/src/components/ui/Modal.vue` 实现，复用现有 `role="dialog"`、`aria-modal`、焦点陷阱、`Escape` 关闭、关闭后焦点回到触发源等能力，不要回退到 `window.confirm()`。
  - [x] 删除是风险动作，不得与当前页面 primary CTA 混淆；若现有 `Button.vue` 视觉层级不足，优先做最小、一致的 foundation 扩展或使用 `state="error"` / 危险文案组合，不要在业务组件里硬编码临时红色 class。
  - [x] 删除确认对话框的文案必须明确“不可恢复”“原链接将失效”的后果；保存、复制、收藏等普通动作不得被顺手加上重确认。

- [x] Task 4: 在 Web 请求层与 `useOnlineNote` 中接入删除请求、终态视图和缓存失效，保持 Alova/Pinia 边界清晰 (AC: 2, 3)
  - [x] 在 `apps/web/src/services/note-methods.ts` 中新增 `createDeleteOnlineNoteMethod()`，与现有 `createGetOnlineNoteDetailMethod()`、`createSaveOnlineNoteMethod()` 命名和 `cacheFor` 约定保持一致。
  - [x] 在 `apps/web/src/features/note/use-online-note.ts` 中新增删除请求状态、确认弹窗开关、删除反馈和成功后的终态切换，不把远端 note 详情或删除结果塞进 Pinia。
  - [x] 删除成功后，当前页面必须立刻进入不可继续编辑的终态：清空当前内存中的 `editKey`，停止展示可保存状态，切换到明确的 deleted view model / feedback，而不是继续保留可编辑正文。
  - [x] 删除失败时必须把 `NOTE_FORBIDDEN`、`NOTE_EDIT_KEY_REQUIRED`、`NOTE_EDIT_KEY_INVALID`、`NOTE_DELETED`、`NOTE_NOT_FOUND` 等分支翻译成明确可读反馈，而不是只显示“删除失败，请稍后重试”。
  - [x] 若当前用户已登录，删除成功后必须失效“我的创建”和与该对象相关的收藏缓存，保证用户重新打开个人中心时不会继续看到旧列表。

- [x] Task 5: 明确本故事与后续故事边界，避免一次性把 4.2 / 4.3 的范围全部塞进 4.1 (AC: 2, 3)
  - [x] 4.1 必须完成“确认删除 + 服务端受权删除 + 当前页面终态反馈 + 列表缓存失效”这条主链路。
  - [x] 4.1 不应顺手扩展回收站、恢复入口、批量删除、用户中心列表内直接删除、全站统一 deleted 页面重构或异常文案系统性重写，这些分别属于 Epic 4 后续 story 范围。
  - [x] 4.2 将继续收口“删除后重新访问原链接”的完整产品语义；4.3 将统一异常反馈文案与样式，因此 4.1 只需确保当前对象链路的删除终态正确，不要提前实现过量跨页面状态系统。

- [x] Task 6: 为删除授权、确认弹窗、终态反馈和缓存失效补齐回归测试 (AC: 1, 2, 3)
  - [x] API / service 测试至少覆盖：创建者删除成功、有效编辑密钥删除成功、无权限拒绝、缺失/错误密钥拒绝、已删除对象重复删除、无效 `sid`、不存在对象、重复 `sid` 冲突。
  - [x] API / service 测试还应显式断言：删除落点是单对象 `deleted_at` 终态，而不是 `deleteMany(sid)` 或对历史数据做模糊删除。
  - [x] Web 测试至少覆盖：删除按钮显示条件、打开确认弹窗后的初始焦点、`Escape`/overlay 关闭、确认成功后页面进入 deleted 终态、失败时展示明确权限/密钥原因、登录用户缓存失效函数被调用。
  - [x] Web 测试继续沿用现有 `Vitest + @vue/test-utils + jsdom + data-testid` 风格；涉及焦点断言时使用 `attachTo: document.body` 并检查 `document.activeElement`，不要混入另一套测试框架。
  - [x] 至少执行 `pnpm --filter @note/shared-types build`、`pnpm --filter @note/api test`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/web test`、`pnpm --filter @note/web typecheck`；若 schema 或构建入口变动波及打包，再补跑对应 `build`。

### Review Findings

- [x] [Review][Patch] 删除失败反馈不会在用户修正编辑密钥或执行后续动作后清除 [apps/web/src/features/note/use-online-note.ts:165]
- [x] [Review][Patch] `NOTE_SID_CONFLICT` 删除失败不会切到终态错误视图且仍落回泛化文案 [apps/web/src/features/note/use-online-note.ts:473]
- [x] [Review][Patch] `DELETE` 删除链路的回归测试矩阵仍缺少多条 story 明确要求的分支 [apps/api/tests/notes-write.spec.ts:698]

## Dev Notes

### Story Intent

Story 4.1 是 Epic 4 的第一步，它要先把“删除”从一句产品要求落成一条可信链路：用户只能在有权限时看到删除入口，必须先看见不可恢复警告，确认后服务端真正把对象推进终态，前端也立即给出清楚反馈并停止继续编辑。

这条 story 最容易做坏的地方有三个：第一，把删除实现成纯前端按钮或列表移除，而没有真正的服务端授权与终态写入；第二，沿用旧文档里的 `deleteMany(sid)` 思路，继续留下误删风险；第三，把 `4-2` 的“重新访问失效链接”与 `4-3` 的“统一异常反馈体系”一并塞进当前 story，导致范围失控。本故事必须只聚焦删除主链路，但把后续 story 依赖的关键基础打稳。

### Requirement Traceability

- FR37, FR38, FR39
- NFR5, NFR8, NFR13, NFR14, NFR15, NFR16, NFR17, NFR19
- UX-DR6, UX-DR7, UX-DR12, UX-DR13, UX-DR14, UX-DR17, UX-DR19

### Epic Context

- Story 4.1 负责“删除前确认 + 删除当场权限与反馈”，先把受权删除链路打通。
- Story 4.2 负责“删除后重新访问原 `sid` 链接时的明确失效与不可恢复语义”，避免用户误解为临时失败。
- Story 4.3 负责把不存在、已删除、错误密钥、无权限、SSO 失败等边界异常做成统一反馈体系。
- 因此，4.1 应确保当前对象页在删除成功后进入 deleted 终态，但不要顺手扩写全站统一错误页、回收站或恢复流程。

### Current Codebase Findings

- `apps/api/src/routes/notes.ts` 当前只有 `GET /:sid` 与 `PUT /:sid`，并不存在真正的 `DELETE /:sid` 路由；删除故事的后端入口尚未实现。 [Source: /Users/reuszeng/Code/Projects/note/apps/api/src/routes/notes.ts]
- `apps/api/src/services/note-read-service.ts` 与 `apps/api/src/services/note-write-service.ts` 已经读写 `notes.deleted_at`，并在读取/保存时返回 `NOTE_DELETED` 语义，这说明当前代码天然适合补“软删除为内部细节、对外不可恢复终态”的实现。 [Source: /Users/reuszeng/Code/Projects/note/apps/api/src/services/note-read-service.ts] [Source: /Users/reuszeng/Code/Projects/note/apps/api/src/services/note-write-service.ts]
- `apps/web/src/services/note-methods.ts` 目前只有读取与保存 method，没有 delete method；删除请求层需要在现有 alova 封装上增量扩展，而不是另起 `fetch`/`axios` 旁路。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/services/note-methods.ts]
- `apps/web/src/features/note/use-online-note.ts` 已经具备成功后失效“我的创建 / 我的收藏”缓存、保存失败时进入 deleted terminal view model 等模式；删除动作应复用这套“请求 -> 反馈 -> 终态 -> 缓存失效”链路，而不是写第二套独立状态机。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/features/note/use-online-note.ts]
- `apps/web/src/features/note/online-note.ts` 已经把 `deleted`、`forbidden`、`key-required` 等视图语义建模为 `viewModel` / `objectHeader` / `authorizationUi`；删除成功后应继续落到这套模型，而不是额外引入不一致的页面分支。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/features/note/online-note.ts]
- `apps/web/src/features/note/components/NoteObjectHeader.vue` 是当前在线便签操作区，已经承载复制链接和收藏动作，是删除入口最自然的挂载位置。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/features/note/components/NoteObjectHeader.vue]
- `apps/web/src/components/ui/Modal.vue` 已经实现 `role="dialog"`、`aria-modal`、焦点陷阱、`Escape` 关闭与关闭后回焦；删除确认必须复用它，不要退回 `window.confirm()`。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/Modal.vue]
- `apps/web/src/components/ui/Button.vue` 与 `apps/web/src/components/ui/state-presets.ts` 目前只有 `primary` / `secondary` 视觉变体，没有单独 `danger` 变体；如果删除视觉表达不足，应做最小、一致的 foundation 扩展，不要在 feature 组件里写一次性 class。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/Button.vue] [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/state-presets.ts]
- 当前 `packages/shared-types/src/index.ts` 只覆盖 online note 的 read/save DTO，没有 delete DTO；story 需要补齐共享契约，避免前后端各自猜测成功返回形状。 [Source: /Users/reuszeng/Code/Projects/note/packages/shared-types/src/index.ts]

### Technical Requirements

- API 必须新增 `DELETE /api/notes/:sid`，并继续以 `sid` 作为外部唯一资源标识，不暴露内部 `notes.id`。
- 删除授权必须沿用服务端统一权限入口：创建者身份可删，密钥授权可编辑对象在提供正确密钥时也可删；前端只展示能力与结果，不在前端自行判断“伪删除权限”。
- 若对象受编辑密钥保护，删除请求沿用 `x-note-edit-key` header 传递当前内存中的密钥，不在 URL、localStorage、sessionStorage 中持久化明文密钥。
- 删除实现应优先写 `notes.deleted_at` 终态，而不是物理删除或 `deleteMany(sid)`；一旦删除成功，后续 read / write 必须稳定感知 `NOTE_DELETED`。
- 删除成功后，当前对象页必须立刻停止继续编辑与保存，转入明确 deleted 终态；不要要求用户手动刷新后才看到结果。
- 删除失败时必须至少区分：无效 sid、对象不存在、对象已删除、需要编辑密钥、编辑密钥错误、无权限、重复 sid 冲突。
- 删除成功后，如果当前用户已登录，必须失效“我的创建”与相关 favorites 缓存；如果当前页持有密钥，应清空页面内存里的明文密钥。

### Architecture Compliance

- 保持 REST 资源边界：删除属于 `notes` 资源，不要新增 `/api/delete-note`、`/api/me/delete` 之类旁路接口。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 保持服务端收口授权：route 只做解析，鉴权与删除终态由 service 层统一处理。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 保持 Pinia / Alova 分层：Pinia 只管理会话与 UI 状态；远端对象详情、删除请求与列表失效留在 Alova/composable。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md] [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/project-context.md]
- 保持在线便签 feature 边界：删除入口与当前页终态在 `apps/web/src/features/note` 收口，不要把删除主逻辑散落到 `components/ui` 或新建“后台管理”路径。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 保持产品语义：即使底层采用软删除，对外也必须是不可恢复终态，不新增回收站、恢复按钮或“临时隐藏”表述。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/epics.md] [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]

### Library / Framework Requirements

- 继续沿用当前仓库版本：`vue@^3.5.13`、`vue-router@^4.4.5`、`alova@^3.0.6`、`axios@^1.7.9`、`fastify@^5.0.0`、`@prisma/client@^5.22.0`、`vitest@^2.1.8`；本 story 不需要顺手升级依赖。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/package.json] [Source: /Users/reuszeng/Code/Projects/note/apps/api/package.json]
- 删除确认弹窗继续采用 Vue 3 Composition API / `<script setup>` 与现有 foundation 组件模式，不额外引入 modal / focus-trap 第三方库，除非现有 `Modal.vue` 证明确实无法满足需求。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/Modal.vue]
- Web 测试继续使用仓库现有 `Vitest + @vue/test-utils + jsdom` 风格；如果后续发现 focus trap 只能在真实浏览器复现，再把 Browser Mode 或 e2e 作为增量补充，而不是当前 story 的前置重构。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/tests/user-center-modal.spec.ts] [Source: /Users/reuszeng/Code/Projects/note/apps/web/tests/auth-status-pill.spec.ts]

### File Structure Requirements

- 很可能需要修改：
  - `packages/shared-types/src/index.ts`
  - `apps/api/src/routes/notes.ts`
  - `apps/api/src/schemas/note.ts`
  - `apps/api/src/services/note-write-service.ts`
  - `apps/web/src/services/note-methods.ts`
  - `apps/web/src/features/note/online-note.ts`
  - `apps/web/src/features/note/use-online-note.ts`
  - `apps/web/src/features/note/components/NoteObjectHeader.vue`
  - `apps/web/src/features/note/components/OnlineNoteShell.vue`
  - `apps/web/src/components/ui/Button.vue` 与 `apps/web/src/components/ui/state-presets.ts`（仅当需要统一危险按钮变体时）
- 很可能需要新增：
  - `apps/web/src/features/note/components/DeleteNoteConfirmModal.vue` 或等价业务组件
  - `apps/api/tests/note-delete.spec.ts` 或在现有 notes service / route tests 中扩展删除场景
  - `apps/web/tests/use-online-note.spec.ts`、`apps/web/tests/online-note.spec.ts` 中的删除场景
- 一般不应修改：
  - `apps/web/src/features/local-note/*`
  - `apps/web/src/features/auth/*`
  - `apps/web/src/features/user-panel/components/UserCenterModal.vue`（除非仅为缓存回读结果做最小兼容）
  - 与删除无关的 favorites 写入接口或 SSO 流程

### Testing Requirements

- API / service 层至少覆盖：
  - 创建者删除成功
  - 有效编辑密钥删除成功
  - 缺失编辑密钥被稳定拒绝
  - 错误编辑密钥被稳定拒绝
  - 无权限删除被稳定拒绝
  - 已删除对象重复删除返回 `NOTE_DELETED`
  - 不存在对象返回 `NOTE_NOT_FOUND`
  - 异常重复 `sid` 返回 `NOTE_SID_CONFLICT`
  - 删除最终落为 `deleted_at` 终态，而不是模糊批量删除
- Web / UI 层至少覆盖：
  - 只有可删状态才显示删除入口
  - 打开确认弹窗后焦点进入 dialog，关闭后焦点返回触发按钮
  - `Escape` 与点击 overlay 可关闭确认弹窗
  - 确认删除成功后页面切换到 deleted 终态，保存动作不可继续执行
  - 删除失败时展示明确的权限/密钥/终态原因，而不是泛化错误
  - 登录用户删除成功后会触发“我的创建 / 我的收藏”缓存失效
- 回归要求：
  - 复制链接、收藏、保存更新与现有对象头部状态不回归
  - Story 3.x 的用户中心、列表回焦与缓存策略不回归
  - 既有 `NOTE_DELETED` 读取/保存终态分支不被破坏

### Latest Technical Notes

- Vue 官方可访问性文档仍强调：动态界面必须显式管理焦点、通过 ref/watch 在状态变化后把焦点放到正确位置，并结合 WAI-ARIA Authoring Practices 处理 dialog / tab 等模式。当前 `Modal.vue` 已经遵守这一方向，因此删除确认优先复用现有 modal，而不是新引依赖。 [Source: https://vuejs.org/guide/best-practices/accessibility]
- 官方可访问性资料与 WAI APG 仍要求 modal dialog 在打开时聚焦到 dialog 内、关闭后返回触发源、支持 `Escape` 关闭，并保证焦点不会逃逸到背景内容；这与当前 `Modal.vue` 的实现方向一致。 [Source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/]
- Vitest 当前文档把真实键盘导航、焦点管理和 aria 断言列为组件测试重点；但仓库现有测试仍以 jsdom 为主，因此当前 story 应继续沿用现有风格，在必要时通过 `attachTo: document.body` + `document.activeElement` 做焦点断言。 [Source: https://v4.vitest.dev/guide/browser/component-testing] [Source: https://main.vitest.dev/guide/browser/interactivity-api]
- `docs/tech-solution.md` 已明确给出 `DELETE /api/notes/:sid` 与 `notes.deleted_at` 方向；`docs/database-design.md` 也已明确指出旧 `deleteMany(sid)` 是需要纠正的风险，因此实现时不应回退到批量删除。 [Source: /Users/reuszeng/Code/Projects/note/docs/tech-solution.md] [Source: /Users/reuszeng/Code/Projects/note/docs/database-design.md]

### Project Structure Notes

- 项目上下文明确要求：默认使用 `pnpm`、中文输出、Pinia 只承接会话与 UI、Alova 管远端数据与缓存；删除 story 必须完全遵守这套分层。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/project-context.md]
- 这里存在一个需要显式指出的历史冲突：`docs/database-design.md` 仍记录了旧的 `deleteNote(sid) -> deleteMany` 风险，而真实代码已经围绕唯一 `sid` 和 `deleted_at` 终态演进；本 story 应以“唯一 `sid` + 单记录终态更新”为准，而不是沿用旧批量删除草案。 [Source: /Users/reuszeng/Code/Projects/note/docs/database-design.md] [Source: /Users/reuszeng/Code/Projects/note/apps/api/src/services/note-read-service.ts]
- 架构蓝图里“删除不可恢复”映射到 `apps/web/features/note` 与服务层 note service，这意味着对象页是当前最合理的删除入口；不要把 4.1 误做成用户中心后台故事。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]

### References

- [epics.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/epics.md)
- [prd.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/prd.md)
- [architecture.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md)
- [ux-design-specification.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md)
- [project-context.md](/Users/reuszeng/Code/Projects/note/_bmad-output/project-context.md)
- [tech-solution.md](/Users/reuszeng/Code/Projects/note/docs/tech-solution.md)
- [database-design.md](/Users/reuszeng/Code/Projects/note/docs/database-design.md)
- [notes.ts](/Users/reuszeng/Code/Projects/note/apps/api/src/routes/notes.ts)
- [note.ts](/Users/reuszeng/Code/Projects/note/apps/api/src/schemas/note.ts)
- [note-read-service.ts](/Users/reuszeng/Code/Projects/note/apps/api/src/services/note-read-service.ts)
- [note-write-service.ts](/Users/reuszeng/Code/Projects/note/apps/api/src/services/note-write-service.ts)
- [note-methods.ts](/Users/reuszeng/Code/Projects/note/apps/web/src/services/note-methods.ts)
- [online-note.ts](/Users/reuszeng/Code/Projects/note/apps/web/src/features/note/online-note.ts)
- [use-online-note.ts](/Users/reuszeng/Code/Projects/note/apps/web/src/features/note/use-online-note.ts)
- [NoteObjectHeader.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/features/note/components/NoteObjectHeader.vue)
- [OnlineNoteShell.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue)
- [Modal.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/Modal.vue)
- [Button.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/Button.vue)
- [InlineFeedback.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/InlineFeedback.vue)
- [state-presets.ts](/Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/state-presets.ts)
- [index.ts](/Users/reuszeng/Code/Projects/note/packages/shared-types/src/index.ts)
- [use-online-note.spec.ts](/Users/reuszeng/Code/Projects/note/apps/web/tests/use-online-note.spec.ts)
- [online-note.spec.ts](/Users/reuszeng/Code/Projects/note/apps/web/tests/online-note.spec.ts)
- [auth-status-pill.spec.ts](/Users/reuszeng/Code/Projects/note/apps/web/tests/auth-status-pill.spec.ts)
- [user-center-modal.spec.ts](/Users/reuszeng/Code/Projects/note/apps/web/tests/user-center-modal.spec.ts)
- [Vue Accessibility Guide](https://vuejs.org/guide/best-practices/accessibility)
- [WAI Modal Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [Vitest Component Testing](https://v4.vitest.dev/guide/browser/component-testing)
- [Vitest Interactivity API](https://main.vitest.dev/guide/browser/interactivity-api)

## Change Log

- 2026-04-10: 创建 Story 4.1 上下文，明确删除确认、服务端受权删除、`deleted_at` 终态、对象页删除入口、缓存失效边界与测试要求，供后续 `dev-story` 直接实现。
- 2026-04-10: 完成 `DELETE /api/notes/:sid` 删除链路、对象页确认弹窗与 deleted 终态反馈，补齐 API / Web 回归测试并通过 story 要求的 build、test、typecheck 验证。

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Implementation Plan

- 先补共享类型、notes schema 与 `DELETE /api/notes/:sid` 服务端链路，把删除授权、`deleted_at` 终态和稳定错误码收口到 service 层。
- 再在 `apps/web/src/features/note` 接入删除入口、确认弹窗、删除请求与当前页终态反馈，复用既有 `Modal.vue`、`useOnlineNote`、`InlineFeedback` 与对象头部模式。
- 最后补齐 API / composable / component 回归测试，并验证删除后的缓存失效不会让“我的创建 / 我的收藏”继续展示旧对象。

### Debug Log References

- 已完整读取 `sprint-status.yaml`，确认当前第一条 backlog story 为 `4-1-delete-confirmation-authorized-delete`，且 `epic-4` 仍处于 backlog，需由本次 create-story 推进到 `in-progress`。
- 已抽取 Epic 4 中 Story 4.1、4.2、4.3 的关系，确认 4.1 只负责“确认 + 受权删除 + 当前反馈”，避免与后续 story 叠范围。
- 已核对 `epics.md`、`prd.md`、`architecture.md`、`ux-design-specification.md`、`project-context.md`、`docs/tech-solution.md`、`docs/database-design.md`，确认删除必须是不可恢复语义，且旧 `deleteMany(sid)` 风险不能继续沿用。
- 已检查真实代码，确认 notes API 当前没有 DELETE 路由，但读写服务已围绕 `deleted_at` 和 `NOTE_DELETED` 构建，可在现有服务层增量扩展。
- 已检查 Web 代码，确认 `Modal.vue`、`NoteObjectHeader.vue`、`OnlineNoteShell.vue`、`useOnlineNote`、`InlineFeedback` 与缓存失效函数都是当前 story 的最佳复用点。
- 已补充公开官方资料核对，确认当前无需升级 Vue / Fastify / Vitest 等依赖，重点应放在遵守现有 Composition API、可访问性和测试模式。
- 已先补后端红灯测试并验证失败：`note-write-service.spec.ts` 因缺少 `deleteBySid()` 失败，`notes-write.spec.ts` 因缺少 `DELETE /api/notes/:sid` 返回 404。
- 已实现共享删除 DTO、notes delete schema、`note-write-service.deleteBySid()`、`notes` delete route，以及单记录 `deleted_at` 软删除写入。
- 已补前端删除方法、对象头部危险按钮、`DeleteNoteConfirmModal.vue`、`useOnlineNote` 删除状态机和 deleted 终态/缓存失效逻辑。
- 已完成定向红绿验证与整套故事校验命令：`pnpm --filter @note/shared-types build`、`pnpm --filter @note/api test`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/web test`、`pnpm --filter @note/web typecheck`。

### Completion Notes List

- 已新增共享删除 DTO 与错误语义，前后端统一使用 `sid/code/status/message` 删除契约，并继续沿用 `x-note-edit-key` header 传递当前页内存中的编辑密钥。
- 已在 API 侧实现 `DELETE /api/notes/:sid`，删除逻辑复用既有授权/锁/冲突检测链路，并以单记录 `deleted_at` 终态替代历史 `deleteMany(sid)` 风险做法。
- 已在对象页加入删除入口与确认弹窗，删除按钮只在可删对象显示；弹窗复用 `Modal.vue` 的焦点管理、`Escape`/overlay 关闭和回焦能力。
- 已在 `useOnlineNote` 中接入删除请求、明确的删除失败反馈、删除成功后的 deleted 终态以及“我的创建 / 我的收藏”缓存失效。
- 已补齐 API / service / Web 回归测试，覆盖创建者删除、密钥删除、权限拒绝、焦点进入与回退、overlay/Escape 关闭、deleted 终态与缓存失效。

### File List

- _bmad-output/implementation-artifacts/4-1-delete-confirmation-authorized-delete.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- apps/api/src/routes/notes.ts
- apps/api/src/schemas/note.ts
- apps/api/src/services/note-write-service.ts
- apps/api/tests/note-write-service.spec.ts
- apps/api/tests/notes-write.spec.ts
- apps/web/src/components/ui/Button.vue
- apps/web/src/components/ui/Modal.vue
- apps/web/src/components/ui/state-presets.ts
- apps/web/src/features/note/components/DeleteNoteConfirmModal.vue
- apps/web/src/features/note/components/NoteObjectHeader.vue
- apps/web/src/features/note/components/OnlineNoteShell.vue
- apps/web/src/features/note/online-note.ts
- apps/web/src/features/note/use-online-note.ts
- apps/web/src/services/note-methods.ts
- apps/web/tests/online-note.spec.ts
- apps/web/tests/use-online-note.spec.ts
- packages/shared-types/src/index.ts
