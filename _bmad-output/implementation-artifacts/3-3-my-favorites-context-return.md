# Story 3.3: 我的收藏列表与上下文返回

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 已登录用户，
I want 在个人中心查看我的收藏并返回目标便签，
so that 我可以从收藏资产中快速回到需要继续阅读的内容。

## Acceptance Criteria

1. 用户已登录且存在收藏记录时，切换到“我的收藏”tab，系统必须展示该用户的收藏列表，并保持与“我的创建”一致的排序反馈、列表样式和点击区域规范。
2. 用户在个人中心点击某条收藏记录时，系统必须关闭 `UserCenterModal` 并进入对应便签页面，让用户感知为从资产层回到对象层，而不是进入新的后台流程。
3. 当“我的收藏”列表为空时，界面必须明确说明当前没有收藏内容，并提示用户可以在阅读便签时执行收藏，而不是只展示占位空白。

## Tasks / Subtasks

- [x] Task 1: 为“我的收藏”补齐共享 DTO 与分页契约，避免直接复用“我的创建”响应导致语义丢失 (AC: 1, 3)
  - [x] 在 `packages/shared-types/src/index.ts` 中新增“我的收藏”最小共享 DTO，例如 `MyFavoriteSummaryDto`、`MyFavoritesResponseDto`、必要的错误或 tab 细化类型；不要让前后端继续把 favorites 列表伪装成 created 列表。
  - [x] 收藏列表项至少应包含 `sid`、正文摘要/识别信息、对象最近更新时间 `updatedAt`，并额外提供收藏关系时间 `favoritedAt`，因为本 story 的排序基准是“收藏时间”而不是“对象更新时间”。
  - [x] 继续沿用 `page` / `limit` 的稳定分页输入，默认 `page=1`、`limit=20`、上限 `limit<=100`，保持 `camelCase` 字段命名，并统一返回 ISO 8601 字符串。
  - [x] 保持 `sid` 为前端唯一外部标识，不在 favorites 列表 DTO 中暴露内部 `notes.id` 或 `note_favorites` 复合键。

- [x] Task 2: 在 API 侧扩展 `/api/me/favorites`，复用现有 `me` 资源边界与 `note_favorites` 数据模型，而不是新增旁路 favorites-list 模块 (AC: 1, 3)
  - [x] 在 `apps/api/src/routes/me.ts` 中新增 `GET /api/me/favorites`，继续与 `/api/me/notes` 共用 `me` 资源边界，未登录时返回稳定 `401` 与 `ME_AUTH_REQUIRED`，不要把“我的收藏”挂到新的后台路由或错误地塞回 `/api/favorites` 写入路由。
  - [x] 在 `apps/api/src/schemas/me.ts` 中为 favorites 查询与响应补齐 schema；如果查询参数完全一致，可以复用 query schema，但响应 schema 必须覆盖 `favoritedAt` 等 favorites 专有字段。
  - [x] 在 `apps/api/src/services/me-service.ts` 中新增 favorites 查询能力，基于当前 session 对应的内部 `users.id` 联表 `note_favorites -> notes` 查询，且只返回 `notes.deleted_at IS NULL` 的对象。
  - [x] 收藏列表排序必须以 `note_favorites.created_at DESC` 为主、再以稳定次序如 `note_id DESC` 补足，避免错误按 `notes.updated_at` 排序而让“最近收藏”语义失真。
  - [x] 软删除或不存在的 note 不应继续出现在“我的收藏”中；空列表必须返回稳定成功结构，而不是 404 或“收藏不存在”异常。

- [x] Task 3: 在 Web 请求层与 `useUserPanel` 中为 favorites 建立独立数据通路，保持与 created 同构但不复制脆弱逻辑 (AC: 1, 3)
  - [x] 在 `apps/web/src/services/me-methods.ts` 中新增 `createGetMyFavoritesMethod` 与对应缓存命名/失效策略；不要把 favorites 请求复用成 `me-notes:*`，避免 created/favorites 缓存互相污染。
  - [x] 在 `apps/web/src/features/user-panel/use-user-panel.ts` 中补齐 favorites 的列表状态、分页状态、错误态、并发 token 与 `loadMore` 能力；优先沿用 3.2 为 created 建好的 request token 防过期回写模式，不要手写第二套更脆弱的异步状态机。
  - [x] 切换到 favorites tab 时应懒加载收藏列表；关闭 modal、切回其他 tab 或用户身份切换时，要正确中止请求并清理对应状态，保持与 created tab 一致的生命周期。
  - [x] 若当前实现中 created/favorites 两套状态大量重复，可以抽取“用户资产分页列表”级辅助函数，但范围只限 `features/user-panel`，不要把它升级为全局 store 或跨业务的抽象框架。

- [x] Task 4: 在 `UserCenterModal` 中把“我的收藏”从占位态替换为真实资产列表，并维持对象层返回语义 (AC: 1, 2, 3)
  - [x] 更新 `apps/web/src/features/user-panel/components/UserCenterModal.vue`，让 favorites tab 复用现有 `ListItem`、`SurfaceCard`、`EmptyState`、`Button` 等 foundation 组件，不要为 favorites 再造一套只服务单故事的列表原子件。
  - [x] 收藏列表项的布局、点击热区和 CTA 风格应与“我的创建”保持一致，但元信息文案需要体现“收藏于 ……”或等价 favorites 语义，避免用户误把其理解为自己创建的对象。
  - [x] 点击某条收藏记录后，必须关闭 `UserCenterModal` 并通过既有路由进入 `/note/o/:sid`；不要新增“收藏详情页”“管理后台页”或夹带内部数据库主键。
  - [x] 空状态必须明确说明“当前没有收藏内容”，并提示用户可以在阅读在线便签时执行收藏；如提供 CTA，优先关闭 modal 并回到可继续浏览/收藏的既有主路径，而不是跳转到新页面。

- [x] Task 5: 把收藏写入与收藏列表读取的缓存闭环补齐，确保 3.1 与 3.3 真正连成一条资产链路 (AC: 1, 2)
  - [x] 在 `apps/web/src/features/note/use-online-note.ts` 的收藏成功路径上，同时失效当前用户的“我的收藏”缓存；不要只更新对象页 `favoriteState`，否则 favorites tab 会继续显示旧数据。
  - [x] 保持 Story 3.1 已落地的 `pendingPostLoginAction` 单次消费逻辑不回归；匿名用户登录后完成收藏时，后续打开个人中心应能看到最新收藏，而不是要求刷新页面或重复登录。
  - [x] 不要把 favorites 列表放入 `auth-store` / Pinia 成为第二真值源；远端资产列表继续由 Alova 请求缓存或现有方法命名策略负责。
  - [x] 本故事只负责“查看我的收藏并返回对象”，不要提前实现取消收藏、批量管理、删除入口或更复杂的筛选排序控件。

- [x] Task 6: 为 favorites API、modal tab 行为、上下文返回与缓存失效补齐回归测试 (AC: 1, 2, 3)
  - [x] API 测试至少覆盖：未登录访问 `/api/me/favorites` 被稳定拒绝；已登录时仅返回当前用户收藏的未删除对象；排序按 `favoritedAt DESC`；空列表返回稳定成功结构。
  - [x] API 测试还应覆盖一个容易做错的分支：当 note 的 `updated_at` 更新较新，但收藏时间更早时，列表仍按收藏时间排序，防止误把“最近编辑”当作“最近收藏”。
  - [x] Web 测试至少覆盖：favorites tab 切换后渲染真实收藏列表；列表项展示可识别信息并点击进入 `/note/o/:sid`；关闭 modal 后焦点回到 `AuthStatusPill`；空状态给出“去阅读并收藏”的明确指引。
  - [x] 回归测试必须确认“我的创建”tab、匿名登录入口、favorite 登录恢复、对象页收藏按钮与既有 `UserCenterModal` 关闭/回焦行为都不回归。
  - [x] 至少执行 `pnpm --filter @note/api test`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/web test`、`pnpm --filter @note/web typecheck`；若 schema、构建入口或 DTO 变化波及编译，再补跑对应 `build`。

## Dev Notes

### Story Intent

Story 3.3 的核心，不是“把 3.2 里黄色占位提示换成真实数据”，而是把 Story 3.1 的收藏动作真正承接到用户资产层。用户已经可以在对象页完成收藏，也已经有一个轻量的 `UserCenterModal`；现在需要的是让这两条链路合成一个完整闭环，让“刚刚收藏的内容”可以在账户视角下被重新进入，而且进入后仍然回到同一条在线对象路径。

这个故事最容易做坏的地方有三个：第一，误把 favorites 列表做成“我的创建”的复制品，只换 tab 标题却丢失“收藏时间”语义；第二，错误按 `notes.updated_at` 排序，导致用户刚收藏的内容反而找不到；第三，只做列表渲染，不补缓存失效闭环，结果对象页显示“已收藏”，个人中心却还是空的。实现时必须把“favorites 关系时间”“对象层返回”“缓存闭环”这三件事写死。

### Requirement Traceability

- FR32, FR35, FR36
- NFR7, NFR8, NFR18, NFR19
- UX-DR9, UX-DR10, UX-DR11, UX-DR15, UX-DR17, UX-DR19

### Cross-Story Context

- Story 3.1 已经完成 `POST /api/favorites`、对象页 `favoriteState` 与登录后单次恢复收藏，因此 3.3 不能重新发明 favorites 写入链路；它应该建立在既有 favorite relation 与对象页即时反馈之上。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/3-1-favorite-action-with-login-gate.md]
- Story 3.2 已经把 `AuthStatusPill -> UserCenterModal -> 我的创建` 的入口、焦点回归与分页请求状态跑通，3.3 应沿着同一套 modal、tabs 与 request token 模式扩展“我的收藏”，而不是额外创建收藏面板或后台页。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/3-2-user-center-my-created-notes.md]
- Story 1.3 已经稳定了 `/note/o/:sid` 的对象页读取路径，Story 3.3 点击收藏记录后的返回动作必须复用这条路由，而不是新增详情协议。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-3-read-online-note-by-sid.md]
- Story 3.4 会继续收口个人中心完整可访问性与状态一致性，因此 3.3 需要保持 tab 键盘切换、modal 关闭回焦和点击进入后的上下文连续性，但不在本故事里扩展更多交互花样。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md]

### Previous Story Intelligence

- 3.2 的 `useUserPanel` 已经通过 `createdRequestToken` + `cacheScope` + `abort()` 组合解决了并发请求回写过期结果的问题；3.3 最稳妥的做法是复用这一模式到 favorites，而不是写一套只靠 `loading` 布尔值的并发控制。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/user-panel/use-user-panel.ts]
- 3.2 的 `UserCenterModal.vue` 已经把 “我的收藏” 放入 `SegmentedTabs`，但当前内容仍是 warning 占位态；这意味着 3.3 主要是替换 favorites 面板内容而不是重新设计 tab 结构。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/user-panel/components/UserCenterModal.vue]
- 3.2 的 `AuthStatusPill.vue` 已经处理了 modal 关闭后二次 `nextTick()` 回焦与“打开后若导航未发生则回焦 trigger”的细节，3.3 点击 favorites 条目后应继续兼容这套逻辑。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/components/layout/AuthStatusPill.vue]
- 最近提交是 `fix: address story 3.2 review findings`、`feat: add user center created notes flow`、`fix: preserve favorite state across note updates`、`feat: add favorite action login recovery`，说明仓库主线正在把 favorite 与 user-panel 两条线汇合。3.3 应继续走“增量拼接”路线，而不是大改结构。 [Source: `git log --oneline -5` on 2026-04-09]

### Current Codebase Findings

- `apps/web/src/features/user-panel/components/UserCenterModal.vue` 当前只接收 created 相关 props，favorites tab 仍固定显示“稍后接入”提示；真实 favorites 列表 UI 目前完全缺失。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/user-panel/components/UserCenterModal.vue]
- `apps/web/src/features/user-panel/use-user-panel.ts` 当前只有 `loadCreatedNotes()`、`loadMoreCreatedNotes()` 与 created 状态；favorites 没有自己的请求、错误态、缓存 scope 或分页状态。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/user-panel/use-user-panel.ts]
- `apps/api/src/routes/me.ts` 和 `apps/api/src/services/me-service.ts` 当前只支持 `/api/me/notes`，这为 3.3 提供了天然的扩展位：继续在 `me` 模块内补 `/favorites`，而不是再开新的资产路由模块。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/routes/me.ts] [Source: /Users/youranreus/Code/Projects/note/apps/api/src/services/me-service.ts]
- `apps/api/prisma/schema.prisma` 已经存在 `NoteFavorite` / `note_favorites` 与 `created_at` 字段，说明 3.3 无需再改数据模型，只需正确利用这条关系做查询。 [Source: /Users/youranreus/Code/Projects/note/apps/api/prisma/schema.prisma]
- `apps/api/src/services/favorite-service.ts` 已经把 favorites 写入收口到 `note_favorites`，而 `apps/api/src/services/note-read-service.ts` 已能根据当前用户判断 `favoriteState`；3.3 不应重复造 favorite relation 或重新判断“是否已收藏”。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/services/favorite-service.ts] [Source: /Users/youranreus/Code/Projects/note/apps/api/src/services/note-read-service.ts]
- `apps/web/src/features/note/use-online-note.ts` 当前收藏成功后只更新对象页 `favoriteState`，并没有同步失效“我的收藏”列表缓存；这是 3.3 必须补上的关键闭环。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/use-online-note.ts]
- `apps/web/src/services/me-methods.ts` 当前仅有 `createGetMyNotesMethod` 与 created 缓存 revision map；favorites 最合理的落点就是在同一文件中补齐对应 method，而不是另起新请求栈。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/services/me-methods.ts]

### Technical Requirements

- `GET /api/me/favorites` 必须是受保护接口，依据当前 session 识别用户，不允许前端传 user id / sso id。
- favorites 查询必须联表 `note_favorites` 与 `notes`，并过滤 `notes.deleted_at IS NOT NULL` 的对象。
- 排序必须以收藏关系时间优先，推荐 `note_favorites.created_at DESC, note_favorites.note_id DESC` 或等价稳定次序；不要错误复用 created 列表的 `updated_at DESC`。
- favorites 列表项至少需要：
  - `sid`
  - 正文摘要/首行片段 `preview`
  - 对象更新时间 `updatedAt`
  - 收藏时间 `favoritedAt`
- 时间字段统一返回 ISO 8601 字符串；UI 可格式化展示，但 DTO 不应混入本地化字符串。
- 点击 favorites 条目进入对象页时，必须走 `/note/o/:sid`，不得暴露内部数据库主键。
- 空列表响应必须是稳定成功结构；不要把“没有收藏”实现成 404。

### Architecture Compliance

- 保持 REST 资源边界：`/api/me/favorites` 属于“我的资产”读取资源，`/api/favorites` 继续只负责收藏写入，不要混用。
- 保持 SPA + modal 语义：favorites 仍属于 `UserCenterModal` 的后置资产层，不升级为独立后台页、侧栏或新 layout。
- 保持 Pinia / Alova 分层：`auth-store` 继续只管理会话与登录恢复，favorites 列表与分页状态留在 feature 内请求缓存。
- 保持对象语义：无论从 created 还是 favorites 返回，最终都回到同一个 `/note/o/:sid` 对象页，而不是产生“资产详情页”。
- 保持 `features/user-panel` 聚合职责：列表展示、分页、tab、返回对象都在此 feature 内收口，`components/ui` 不承担业务判断。

### Library / Framework Requirements

- 继续沿用当前仓库版本：`vue@^3.5.13`、`vue-router@^4.4.5`、`alova@^3.0.6`、`fastify@^5.0.0`、`@prisma/client@^5.22.0`。本 story 不需要顺手升级依赖。 [Source: /Users/youranreus/Code/Projects/note/apps/web/package.json] [Source: /Users/youranreus/Code/Projects/note/apps/api/package.json]
- Vue 官方当前仍说明没有固定发布周期，且 TypeScript 用户可锁定当前 minor 版本后手动升级；因此 3.3 应避免为了 favorites 做 opportunistic Vue minor 升级。 [Source: https://vuejs.org/about/releases]
- Vue Router 官方文档强调 `router.push()` 会压入 history 栈，符合“从资产层进入对象层后，用户仍可用浏览器返回回到原上下文”的预期；favorites 条目导航应继续使用现有 programmatic navigation。 [Source: https://router.vuejs.org/guide/essentials/navigation]
- Fastify 官方当前 latest 文档为 `v5.8.x`，并继续强调通过 `register`/plugin 扩展 routes 与作用域封装；3.3 应在现有 `meRoutes` / `meService` 结构内增量扩展。 [Source: https://fastify.dev/docs/latest/Reference/Plugins/]
- Prisma 官方模型文档继续支持 composite IDs；当前 `note_favorites` 已采用复合主键语义，3.3 应复用这条关系做 favorites 查询，而不是发明新的唯一键。 [Source: https://www.prisma.io/docs/orm/prisma-schema/data-model/models#composite-ids]
- WAI-ARIA APG 对 modal dialog 和 tabs 的建议仍要求打开后聚焦到 dialog 内、关闭后返回触发元素、水平 tab 支持左右方向键；3.3 不能因为接入 favorites 内容而破坏 3.2 已建立的 modal/tab 可访问性。 [Source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/] [Source: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/]

### File Structure Requirements

- 很可能需要修改：
  - `packages/shared-types/src/index.ts`
  - `apps/api/src/routes/me.ts`
  - `apps/api/src/schemas/me.ts`
  - `apps/api/src/services/me-service.ts`
  - `apps/web/src/services/me-methods.ts`
  - `apps/web/src/features/user-panel/user-panel.ts`
  - `apps/web/src/features/user-panel/use-user-panel.ts`
  - `apps/web/src/features/user-panel/components/UserCenterModal.vue`
  - `apps/web/src/components/layout/AuthStatusPill.vue`（仅在 props 接线或 favorites 打开回焦细节需要同步时）
  - `apps/web/src/features/note/use-online-note.ts`
- 很可能需要新增：
  - `apps/api/tests/me-favorites.spec.ts` 或直接在 `apps/api/tests/me.spec.ts` 扩展 favorites 场景
  - `apps/web/tests/user-center-modal.spec.ts` 中的 favorites 场景
  - 如需拆分 request helper，可新增 `apps/web/src/features/user-panel/user-panel-queries.ts` 等局部文件，但应保持在 `features/user-panel` 边界内
- 一般不应修改：
  - `apps/api/src/routes/favorites.ts` 的写入语义
  - `apps/web/src/features/auth/*`
  - `apps/web/src/features/local-note/*`
  - Story 4.x 的删除与终态反馈逻辑
  - 未经需求支持的取消收藏、筛选排序 UI、独立资产页

### Testing Requirements

- API / service 层至少覆盖：
  - 匿名请求 `/api/me/favorites` 返回稳定 auth-required 语义
  - 已登录用户只看到自己收藏的对象
  - 已删除对象不会出现在 favorites 列表
  - 排序按 `favoritedAt` 倒序，而不是 `updatedAt`
  - 空列表返回成功结构与空数组/空分页
- Web / UI 层至少覆盖：
  - favorites tab 切换后展示真实列表
  - 列表项展示 `sid`、摘要与 favorites 语义时间
  - 点击 favorites 项会关闭 modal 并进入 `/note/o/:sid`
  - favorites 空状态展示原因与下一步指引
  - modal 关闭/切换后焦点和 tab 行为不回归
- 回归要求：
  - “我的创建”tab 仍可正常请求和分页
  - Story 3.1 的 favorite 登录恢复与对象页收藏反馈不回归
  - Story 3.2 的 `AuthStatusPill` 行为、关闭回焦与 created 列表不回归

### Git Intelligence Summary

- 最近提交依次为 `fix: address story 3.2 review findings`、`feat: add user center created notes flow`、`fix: preserve favorite state across note updates`、`feat: add favorite action login recovery`、`chore: sync epic 2 sprint status`。这说明当前主线已经先后打通了 favorites 写入和 user-panel created 面板，Story 3.3 正好是把两条线在 `me/favorites` 和 `UserCenterModal` 中汇合。 [Source: `git log --oneline -5` on 2026-04-09]
- 当前工作树只有 `_bmad-output/implementation-artifacts/review-prompts/` 的未跟踪目录，与本 story 无关；实现 Story 3.3 时不应顺手清理或改动这部分内容。 [Source: `git status --short` on 2026-04-09]

### Latest Technical Notes

- `docs/tech-solution.md` 已把“我的创建 / 我的收藏”定义为对称的分页资产列表，并明确建议通过 cache invalidation 让保存、删除、收藏后对应列表缓存失效；3.3 需要把这条建议真正落实到 favorites 列表。 [Source: /Users/youranreus/Code/Projects/note/docs/tech-solution.md]
- `docs/database-design.md` 已把 favorites 索引方向定义为 `note_favorites.idx_user_created (user_id, created_at DESC)`，这意味着 favorites 列表的“最近性”来自收藏关系时间，而不是 note 更新时间。 [Source: /Users/youranreus/Code/Projects/note/docs/database-design.md]
- Alova 官方缓存文档当前仍提供 `invalidateCache()` 与 method matcher 模式；即使仓库当前使用自定义 revision map，也应保证收藏成功后能失效 favorites 方法缓存，而不是依赖手动刷新。 [Source: https://alova.js.org/zh-CN/api/cache/]
- WAI APG 继续要求 modal 关闭后把焦点返回触发元素，并要求 tablist 支持左右箭头切换；Story 3.3 的 favorites 面板内容应遵守已有模式，不要因多一个列表分支就破坏交互连续性。 [Source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/] [Source: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/]

### Project Structure Notes

- 项目上下文明确要求：默认 `pnpm`、中文输出、Pinia 只承接会话/UI、Alova 管远端列表；3.3 必须完全遵守这套分层，不要把 favorites 资产列表塞进 `auth-store`。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]
- 这里需要显式指出一个文档冲突：`docs/tech-solution.md` 早期仍保留 `POST /api/notes/:id/favorite` 的旧草案，但真实代码与 Story 3.1 已经收敛到 `POST /api/favorites`；Story 3.3 应以真实 favorites 资源边界为准，同时在 `me` 模块下补只读列表接口。 [Source: /Users/youranreus/Code/Projects/note/docs/tech-solution.md] [Source: /Users/youranreus/Code/Projects/note/apps/api/src/routes/favorites.ts]
- 架构蓝图已明确 `features/user-panel` 负责“我的创建 / 我的收藏”聚合面板；真实仓库当前已落地 created lane，因此 3.3 的最佳策略是继续把 favorites 放进同一 feature，而不是新开 `features/favorites-panel`。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]

### References

- [epics.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md)
- [prd.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md)
- [architecture.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md)
- [ux-design-specification.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md)
- [project-context.md](/Users/youranreus/Code/Projects/note/_bmad-output/project-context.md)
- [tech-solution.md](/Users/youranreus/Code/Projects/note/docs/tech-solution.md)
- [database-design.md](/Users/youranreus/Code/Projects/note/docs/database-design.md)
- [3-1-favorite-action-with-login-gate.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/3-1-favorite-action-with-login-gate.md)
- [3-2-user-center-my-created-notes.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/3-2-user-center-my-created-notes.md)
- [me.ts](/Users/youranreus/Code/Projects/note/apps/api/src/routes/me.ts)
- [me-service.ts](/Users/youranreus/Code/Projects/note/apps/api/src/services/me-service.ts)
- [favorite-service.ts](/Users/youranreus/Code/Projects/note/apps/api/src/services/favorite-service.ts)
- [note-read-service.ts](/Users/youranreus/Code/Projects/note/apps/api/src/services/note-read-service.ts)
- [schema.prisma](/Users/youranreus/Code/Projects/note/apps/api/prisma/schema.prisma)
- [index.ts](/Users/youranreus/Code/Projects/note/packages/shared-types/src/index.ts)
- [AuthStatusPill.vue](/Users/youranreus/Code/Projects/note/apps/web/src/components/layout/AuthStatusPill.vue)
- [UserCenterModal.vue](/Users/youranreus/Code/Projects/note/apps/web/src/features/user-panel/components/UserCenterModal.vue)
- [use-user-panel.ts](/Users/youranreus/Code/Projects/note/apps/web/src/features/user-panel/use-user-panel.ts)
- [user-panel.ts](/Users/youranreus/Code/Projects/note/apps/web/src/features/user-panel/user-panel.ts)
- [me-methods.ts](/Users/youranreus/Code/Projects/note/apps/web/src/services/me-methods.ts)
- [use-online-note.ts](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/use-online-note.ts)
- [me.spec.ts](/Users/youranreus/Code/Projects/note/apps/api/tests/me.spec.ts)
- [user-center-modal.spec.ts](/Users/youranreus/Code/Projects/note/apps/web/tests/user-center-modal.spec.ts)
- [Vue Releases](https://vuejs.org/about/releases)
- [Vue Router Programmatic Navigation](https://router.vuejs.org/guide/essentials/navigation)
- [Fastify Plugins](https://fastify.dev/docs/latest/Reference/Plugins/)
- [Prisma Composite IDs](https://www.prisma.io/docs/orm/prisma-schema/data-model/models#composite-ids)
- [WAI Modal Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [WAI Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [Alova Cache Operations](https://alova.js.org/zh-CN/api/cache/)

## Change Log

- 2026-04-09: 创建 Story 3.3 上下文，明确“我的收藏”分页契约、`/api/me/favorites` 资源边界、按收藏时间排序规则、对象层返回语义与 favorites 缓存失效闭环，供后续 `dev-story` 直接实现。
- 2026-04-09: 完成 Story 3.3 实现，补齐 `/api/me/favorites`、favorites 前端列表链路、对象层返回语义、收藏缓存失效与回归测试，并将故事状态更新为 `review`。

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Implementation Plan

- 先扩展共享 DTO、`me` 路由 schema 与 `me-service`，把 favorites 读取链路稳定在现有 `me` 资源边界内，并显式按 `favoritedAt DESC` 排序。
- 再为 Web 侧补齐独立的 favorites 请求缓存、`useUserPanel` 状态机与 `UserCenterModal` 列表/空状态/返回对象页行为，保持与 created tab 同构。
- 最后把对象页收藏成功后的 favorites 缓存失效接回 Story 3.1 登录恢复链路，并用 API、组件、集成与全量构建验证闭环。

### Debug Log References

- 已完整读取 `sprint-status.yaml`，确认当前第一条 backlog story 为 `3-3-my-favorites-context-return`。
- 已抽取 Epic 3 中 Story 3.3 的用户故事与 AC，并核对 PRD、架构、UX、数据库设计与项目上下文中关于“我的收藏”的要求。
- 已检查真实代码，确认 Story 3.1 已完成 favorites 写入与登录恢复，Story 3.2 已完成 `UserCenterModal` 和“我的创建”，但 favorites tab 仍是占位态。
- 已确认 `me` 模块、`note_favorites` 数据模型、`useUserPanel` 请求 token 模式和 `AuthStatusPill` 回焦逻辑都是 3.3 的最佳复用点。
- 已补充官方资料核对，确认当前无需升级依赖，重点应放在现有 Vue Router/Fastify/Prisma/Alova/WAI 约束下完成 favorites 读取与返回闭环。
- 已新增 `MyFavoriteSummaryDto` / `MyFavoritesResponseDto`，并在 `apps/api/src/routes/me.ts`、`apps/api/src/schemas/me.ts`、`apps/api/src/services/me-service.ts` 中完成 `/api/me/favorites` 读取链路与排序/空列表/鉴权实现。
- 已在 `apps/web/src/services/me-methods.ts`、`apps/web/src/features/user-panel/use-user-panel.ts`、`apps/web/src/features/user-panel/components/UserCenterModal.vue`、`apps/web/src/components/layout/AuthStatusPill.vue` 中完成 favorites 独立请求、tab 懒加载、列表展示、空状态 CTA、关闭回焦与 `/note/o/:sid` 返回对象页语义。
- 已在 `apps/web/src/features/note/use-online-note.ts` 中补齐 favorites 缓存失效闭环，并通过集成测试确认登录恢复后的收藏动作可以驱动个人中心读取到最新收藏。
- 已执行 `pnpm --filter @note/shared-types build`、`pnpm --filter @note/api test`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/api build`、`pnpm --filter @note/web test`、`pnpm --filter @note/web typecheck`、`pnpm --filter @note/web build`，结果全部通过。

### Completion Notes List

- 已完成 favorites 共享 DTO、`/api/me/favorites` 读取接口、按收藏时间排序和空列表/鉴权语义，避免 favorites 继续伪装成 created 列表。
- 已完成 favorites 前端请求与 `useUserPanel` 状态管理、`UserCenterModal` 列表/空状态/分页/返回对象页交互，以及 `AuthStatusPill` 接线与回焦兼容。
- 已完成对象页收藏成功后的 favorites 缓存失效，并确认 Story 3.1 登录恢复链路、Story 3.2 created tab 与 modal 焦点行为无回归。
- 已补齐并通过 API、服务、组件、集成、typecheck 与 build 验证，当前故事满足 AC 1-3，可进入 `review`。

### File List

- _bmad-output/implementation-artifacts/3-3-my-favorites-context-return.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- apps/api/src/routes/me.ts
- apps/api/src/schemas/me.ts
- apps/api/src/services/me-service.ts
- apps/api/tests/me-service.spec.ts
- apps/api/tests/me.spec.ts
- apps/web/src/components/layout/AuthStatusPill.vue
- apps/web/src/features/note/use-online-note.ts
- apps/web/src/features/user-panel/components/UserCenterModal.vue
- apps/web/src/features/user-panel/use-user-panel.ts
- apps/web/src/features/user-panel/user-panel.ts
- apps/web/src/services/me-methods.ts
- apps/web/tests/auth-status-pill.spec.ts
- apps/web/tests/me-methods.spec.ts
- apps/web/tests/use-online-note.spec.ts
- apps/web/tests/user-center-modal.spec.ts
- packages/shared-types/src/index.ts

### Review Findings

- [x] [Review][Patch] 收藏列表未展示对象更新时间 [apps/web/src/features/user-panel/components/UserCenterModal.vue:184]
- [x] [Review][Patch] 收藏空状态 CTA 无条件跳回首页，破坏当前对象上下文 [apps/web/src/features/user-panel/use-user-panel.ts:413]
