# Story 2.3: 编辑密钥的设置与共享编辑

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 创建者或未登录发起者，
I want 为便签设置编辑密钥并通过密钥授予共享编辑能力，
so that 我可以在不开放公开编辑的前提下让他人协作更新内容。

## Acceptance Criteria

1. 创建者为某条便签设置编辑密钥时，服务端只保存密钥的安全摘要，且前端不得在持久化存储中保存明文密钥。
2. 未登录用户通过编辑密钥模式首次保存便签时，系统应允许在无账户身份前提下建立带密钥的编辑对象，并清楚表达“遗失后不可恢复编辑权”。
3. 协作者持有正确编辑密钥进入对应便签并提交更新时，系统应允许该修改；错误密钥与无密钥两种失败状态必须可区分反馈。

## Tasks / Subtasks

- [x] Task 1: 扩展共享契约与权限状态，给编辑密钥接入留出稳定语义 (AC: 1, 2, 3)
  - [x] 在 `packages/shared-types/src/index.ts` 与 `apps/api/src/schemas/note.ts` 中补齐密钥相关能力与错误语义，至少要让“需要密钥”“已通过密钥可编辑”“缺少密钥”“错误密钥”彼此可区分，不再被压成单一 `forbidden`。
  - [x] 在不破坏 Story 2.2 既有 owner 语义的前提下，扩展 `OnlineNoteSaveRequestDto` 为密钥感知请求体；推荐在请求体中显式表达“设置密钥”和“使用密钥编辑”两类意图，而不是让服务端靠字段是否为空猜测行为。
  - [x] 保持现有 `GET /api/notes/:sid`、`PUT /api/notes/:sid` 作为统一资源入口，不要为共享编辑再另起一套平行 note save API。
  - [x] 若最终命名不采用 `key-required` / `key-editable`，也必须保留等价的稳定状态语义，并同步到 Web 状态机和测试中。

- [x] Task 2: 在服务端统一权限入口中落地编辑密钥的哈希存储、校验与写入决策 (AC: 1, 2, 3)
  - [x] 复用 `apps/api/prisma/schema.prisma` 现有 `notes.key_hash` 字段，不要重新引入明文 `key` 列，也不要把密钥拆到前端可读持久化位置。
  - [x] 在 `apps/api/src/services/note-write-service.ts` 或其协作 service 中，把“owner 默认编辑权 + 编辑密钥共享编辑权”统一收口到同一个写入判断入口；owner 可直接编辑，非 owner 则必须通过有效密钥校验后才允许写入。
  - [x] 对首次创建分两条成功路径处理：已登录创建者首次保存时可同时绑定 `author_id` 与密钥摘要；未登录用户首次保存时可建立“无 author_id 但有 key_hash”的对象，且后续只能凭该密钥继续编辑。
  - [x] 密钥摘要必须由服务端生成和比对；推荐以随机 salt + `node:crypto` 的异步 `scrypt` 派生摘要，并在比对时使用常量时间比较，避免把安全判断下放到前端。
  - [x] 对无密钥、错误密钥、资源不存在、资源已删除、owner 身份失效等分支返回稳定错误语义；不要把“没带密钥”和“密钥错误”继续合并成一个笼统失败提示。

- [x] Task 3: 让读取链路与页面状态最小支持“需要密钥才能编辑”的对象语义 (AC: 1, 3)
  - [x] 在 `apps/api/src/services/note-read-service.ts` 中把 `key_hash` 纳入读链路判断：公开查看仍然允许，但非 owner 且对象带密钥时，返回“当前可读但编辑需要密钥”的状态，而不是继续误报为匿名可编辑。
  - [x] 在 `apps/web/src/features/note/online-note.ts`、`use-online-note.ts`、`OnlineNoteShell.vue` 中扩展 view model，让页面能表达“创建者可编辑 / 匿名可编辑 / 需要密钥 / 已通过密钥可编辑 / 当前无权编辑”等最小区分。
  - [x] 注意 Story 2.3 只需要把密钥共享编辑最小闭环接上；完整的查看权/编辑权统一口径、对象头部总语义和全矩阵收口仍属于 Story 2.4。
  - [x] 不允许出现“页面仍显示可持续更新，但服务端实际因缺钥匙拒绝”的状态错位；2.2 已修过一次这类问题，2.3 不能把它重新引回。

- [x] Task 4: 在 Web 端提供轻量、非持久化的密钥输入与共享编辑流 (AC: 1, 2, 3)
  - [x] 密钥输入应作为在线便签页内的轻量增强能力出现，优先复用 `TextInput`、`InlineFeedback`、`Button` 和 `NoteObjectHeader` 的既有信息层，不要把“输入编辑密钥”做成抢主路径的新页面。
  - [x] 明文密钥只允许保存在当前页面/当前 composable 的内存态中，用于本次编辑会话；不得写入 `localStorage`、`sessionStorage`、Pinia、URL query、cookie 或分享链接。
  - [x] 未登录用户以密钥模式首次保存时，必须在对象上下文附近明确提示“遗失该密钥后无法恢复编辑权”；提示要说明后果，但不要引入阻断式后台化流程。
  - [x] 协作者输入密钥后，允许其在当前对象上下文内完成编辑和保存；错误密钥失败后保留用户已输入的正文与密钥输入框状态，避免清空造成二次挫败。
  - [x] `sid` 切换、对象切换或 terminal error 发生时，应清理内存中的活动密钥，避免上一条便签的密钥状态污染下一条对象。

- [x] Task 5: 维持 Epic 2 边界，避免在 2.3 提前吞并 2.4 / 3.x / 4.x 的工作量 (AC: 1, 2, 3)
  - [x] 不在本 story 提前实现“我的创建 / 我的收藏”、删除动作、错误态总线、统一异常中心或用户中心增强动作。
  - [x] 不把编辑密钥校验做成前端 hash 比对、浏览器缓存或本地长期授权；所有真正的授权结论仍由服务端返回。
  - [x] 不重写现有 auth callback、owner 默认编辑权、首页双入口或本地便签模式；本故事只在在线便签对象链路上补“共享编辑”能力。
  - [x] 如果发现需要大范围重做对象头部或权限矩阵，请先把改动收缩到 Story 2.3 的最小闭环，并在 Dev Notes 中明确把更完整的一致性工作留给 Story 2.4。

- [x] Task 6: 为密钥共享编辑补齐 API / Web / 状态机测试与回归门槛 (AC: 1, 2, 3)
  - [x] API / service 测试至少覆盖：owner 设置密钥成功、匿名首次以密钥模式创建成功、正确密钥更新成功、缺少密钥失败、错误密钥失败、owner 不需要密钥也可继续编辑、公开查看仍不受阻断。
  - [x] Web / state 测试至少覆盖：对象处于“需要密钥”时显示正确引导、输入正确密钥后可保存、错误密钥与无密钥反馈不同、失败后正文不被清空、切换 `sid` 后旧密钥不会串到新对象。
  - [x] 现有 Story 2.2 测试必须继续通过，确保 owner 默认编辑权、`NOTE_FORBIDDEN` 降级只读、对象头部 badge 文案等已稳定分支不回归。
  - [x] 至少执行 `pnpm --filter @note/api test`、`pnpm --filter @note/web test`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/web typecheck`；若修改 Prisma schema、共享 DTO 或构建链路，再补跑对应 `build` 与 `db:init`。

### Review Findings

- [x] [Review][Patch] Save 路径会静默吞掉矛盾的 `editKeyAction` / `editKey` 组合 [apps/api/src/services/note-write-service.ts:149]
- [x] [Review][Patch] terminal error 分支没有清理当前页面内存中的编辑密钥 [apps/web/src/features/note/use-online-note.ts:111]
- [x] [Review][Patch] “遗失后不可恢复编辑权”风险提示错误地覆盖到已登录首次保存路径 [apps/web/src/features/note/components/OnlineNoteShell.vue:223]

## Dev Notes

### Story Intent

Story 2.3 的目标，不是把“任何知道链接的人都能继续改”再偷偷带回来，而是把 Epic 2 的第二条编辑通道补完整：登录创建者之外，系统还要允许“持有正确编辑密钥的人”在受控前提下协作更新内容。

这个故事最容易出错的地方，是把“查看能力”和“编辑授权”混成同一件事。`note` 的分享语义一直是公开查看优先，所以带密钥的对象仍然要能被正常阅读；真正受控的是写入权限，而不是读取本身。

### Requirement Traceability

- FR10, FR13, FR14, FR15, FR18, FR19, FR42
- NFR5, NFR6, NFR14
- UX-DR14, UX-DR15, UX-DR18, UX-DR19, UX-DR20

### Cross-Story Context

- Story 1.4 已经打通同一 `sid` 下的首次保存和持续更新，所以 2.3 必须直接复用现有 `PUT /api/notes/:sid` 写路径，而不是再发明一套“密钥专用保存接口”。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md]
- Story 1.5 已经把对象级状态收口到 `NoteObjectHeader`，这仍然是表达“需要密钥 / 已通过密钥可编辑”的首选落点。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md]
- Story 2.1 已经完成 SSO 回跳和会话恢复，因此 2.3 只需要承接既有登录态，不应重写 auth 主流程。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-1-sso-login-callback-recovery.md]
- Story 2.2 已经实现“登录创建者默认编辑权”，2.3 必须在同一条服务端权限入口上补“编辑密钥共享编辑权”，而不是引入互相独立的两套授权分支。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-2-owner-default-edit-permission.md]
- Story 2.4 才负责查看权与编辑权的完整统一状态表达，因此 2.3 应先落最小密钥闭环，而不是在本故事内把整个权限矩阵一次性铺满。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md]

### Previous Story Intelligence

- 2.2 已经把 `editAccess` 作为前后端共享契约建立起来，2.3 最稳妥的做法是扩展这套契约，而不是新增一套仅密钥流程可见的临时字段。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-2-owner-default-edit-permission.md]
- 2.2 的 review 已说明“前端显示可编辑、服务端却拒绝”是高风险回归点；2.3 的 key flow 必须避免再次出现误导性可编辑文案。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-2-owner-default-edit-permission.md]
- 1.4/1.5/2.2 都反复强调 `sid` 切换后的旧请求和旧反馈不能污染当前对象，因此活动密钥、密钥错误提示和保存结果同样要遵守这个防串台模式。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-2-owner-default-edit-permission.md]

### Current Codebase Reality Check

- `apps/api/prisma/schema.prisma` 已经存在 `notes.keyHash` 字段，这说明当前实现更缺的是权限逻辑和 DTO 契约，而不是数据库列本身。 [Source: /Users/youranreus/Code/Projects/note/apps/api/prisma/schema.prisma]
- `apps/api/src/services/note-read-service.ts` 当前只根据 `authorId` 计算 `editAccess`，完全还没有把 `keyHash` 纳入“需要密钥 / 密钥可编辑”的判断。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/services/note-read-service.ts]
- `apps/api/src/services/note-write-service.ts` 当前 owner-bound note 只支持 owner 继续写，anonymous note 则默认任何持链者可写；2.3 的关键就是把“key-protected anonymous / shared note”从这里切出来。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/services/note-write-service.ts]
- `packages/shared-types/src/index.ts`、`apps/api/src/schemas/note.ts` 仍只支持 `owner-editable`、`anonymous-editable`、`forbidden` 和 `NOTE_FORBIDDEN`，不足以表达“需要密钥”和“错误密钥”。 [Source: /Users/youranreus/Code/Projects/note/packages/shared-types/src/index.ts] [Source: /Users/youranreus/Code/Projects/note/apps/api/src/schemas/note.ts]
- `apps/web/src/services/note-methods.ts` 目前保存请求只发送 `content`，这意味着 2.3 必须显式扩展请求体，而不是靠 header、query 或本地存储偷偷塞密钥。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/services/note-methods.ts]
- `apps/web/src/features/note/use-online-note.ts` 当前只专门处理 `NOTE_DELETED`、`NOTE_FORBIDDEN`、`NOTE_SID_CONFLICT`；2.3 需要把缺钥匙与错误钥匙引入稳定的状态处理，而不是继续落到通用 save-error。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/use-online-note.ts]
- `apps/web/src/features/note/components/OnlineNoteShell.vue` 与 `NoteObjectHeader.vue` 已经具备对象描述、badge 和输入反馈的天然落点，因此 2.3 应优先在这里做“密钥输入 + 状态提示”的增量改造。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue] [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/NoteObjectHeader.vue]

### Recommended Data and API Direction

- 以下契约是基于当前代码结构、Epic AC 与现有 `editAccess` 设计做出的实现建议，不是唯一命名方案；但无论最终命名如何，语义必须完整保留。
- 建议把 `NoteEditAccess` 扩展为显式区分：
  - `owner-editable`
  - `anonymous-editable`
  - `key-required`
  - `key-editable`
  - `forbidden`
- 建议把 note 写错误扩展为至少区分：
  - `NOTE_EDIT_KEY_REQUIRED`
  - `NOTE_EDIT_KEY_INVALID`
  - `NOTE_FORBIDDEN`
  - `NOTE_DELETED`
  - `NOTE_SID_CONFLICT`
- 建议把保存请求扩成“正文 + 密钥相关输入 + 明确意图”的结构，例如：
  - owner/anonymous 首次设置密钥：`set`
  - 协作者使用现有密钥写入：`use`
  - 普通无密钥保存：`none`
- 公开读取不应要求先传密钥才能 `GET` 到正文；密钥只应该影响编辑能力与写入授权，不应该变成阅读前置门槛。 [Inferred from PRD / Epic 2 acceptance criteria and current public-read model]

### Security and Implementation Guardrails

- 不要把编辑密钥做成明文数据库列、URL 参数、localStorage/sessionStorage 项、Pinia 长期状态或浏览器可复用分享链接的一部分。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 服务端必须在同一个权限入口中判断“是否 owner”或“是否提供有效密钥”，而不是先前端预判、后端再随意兜底。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 旧文档 `docs/database-design.md` 里仍保留了“原 `key` 明文列 / 双写迁移期”的历史说明，但当前 Prisma schema 已经只有 `key_hash`；本 story 应以当前 schema 与架构文档为准，不再恢复旧明文字段。 [Source: /Users/youranreus/Code/Projects/note/docs/database-design.md] [Source: /Users/youranreus/Code/Projects/note/apps/api/prisma/schema.prisma]
- 如果直接使用 Node 内建加密能力实现密钥摘要，优先采用异步 `crypto.scrypt()` + 随机 salt，并用 `timingSafeEqual` 做摘要比对；这是基于官方文档的实现建议，不代表必须升级依赖。 [Inferred from Node.js Crypto API]

### File Structure Requirements

- 预计至少会修改：
  - `packages/shared-types/src/index.ts`
  - `apps/api/src/schemas/note.ts`
  - `apps/api/src/routes/notes.ts`
  - `apps/api/src/services/note-read-service.ts`
  - `apps/api/src/services/note-write-service.ts`
  - `apps/api/prisma/schema.prisma`（仅在确有必要补齐索引/字段映射时）
  - `apps/web/src/services/note-methods.ts`
  - `apps/web/src/features/note/use-online-note.ts`
  - `apps/web/src/features/note/online-note.ts`
  - `apps/web/src/features/note/components/OnlineNoteShell.vue`
  - `apps/web/src/features/note/components/NoteObjectHeader.vue`
- 很可能需要新增：
  - `apps/api/src/services/note-edit-key-service.ts` 或等价 helper，用于封装 hash/verify
  - `apps/web/src/features/note/components/EditKeyPanel.vue` 或等价轻量组件
  - `apps/api/tests/notes-edit-key.spec.ts` 或在现有 `note-write-service.spec.ts` / `notes-write.spec.ts` 中扩展密钥场景
  - `apps/web/tests/use-online-note.spec.ts`、`apps/web/tests/online-note.spec.ts` 的密钥编辑场景用例
- 一般不应修改：
  - `apps/web/src/features/local-note/*`
  - `apps/web/src/features/home/*`
  - `apps/web/src/features/auth/*`
  - 收藏、删除、用户中心列表等 Epic 3 / Epic 4 功能文件

### Testing Requirements

- API / service 层至少覆盖：
  - owner 为已有或新建 note 设置编辑密钥成功
  - 匿名用户首次以密钥模式保存时，生成 `key_hash` 且对象可被后续密钥授权更新
  - 非 owner 且未提供密钥时更新失败，并返回“缺少密钥”语义
  - 非 owner 提供错误密钥时更新失败，并返回“错误密钥”语义
  - 非 owner 提供正确密钥时更新成功
  - owner-bound + key-protected note 中，owner 仍可不依赖密钥直接编辑
  - key-protected note 对匿名访客依然可读，但读响应不再错误标记为匿名可编辑
- Web / state 层至少覆盖：
  - 需要密钥的对象显示明确引导，不再直接展示“可持续更新”
  - 用户输入密钥后可在当前页面完成保存
  - 缺少密钥与错误密钥显示不同反馈文案，且不清空正文
  - 未登录首次用密钥保存时出现不可恢复风险提示
  - `sid` 切换后旧密钥、旧错误提示与旧保存反馈不会污染新对象
- 回归要求：
  - 2.2 的 owner 默认编辑权测试继续通过
  - 1.4 / 1.5 的保存反馈、复制链接与对象头部主结构不回归
  - 匿名查看带密钥对象仍然可读，不因 key flow 被错误改成登录前置或阅读前置

### Git Intelligence Summary

- 最近 5 次提交顺序是 `feat: add owner-based note edit access`、`feat: add SSO auth flow and story context`、再往前是 Epic 1 的对象主链路，这说明当前仓库节奏非常明确：先把 auth / owner 语义收口，再往同一对象链路上加共享编辑。 [Source: `git log --oneline -5` on 2026-04-05]
- 这也意味着 2.3 的最佳实现策略不是“大重构权限系统”，而是沿着既有 `note-read-service`、`note-write-service`、`editAccess`、`useOnlineNote` 继续增量推进。 [Inferred from recent commits and current code layout]

### Latest Technical Notes

- 当前仓库已固定的关键版本是 `fastify@^5.0.0`、`@prisma/client@^5.22.0`、`vue@^3.5.13`、`alova@^3.0.6`；本 story 应在这些已选版本上实现，不要顺手做框架升级。 [Source: /Users/youranreus/Code/Projects/note/apps/api/package.json] [Source: /Users/youranreus/Code/Projects/note/apps/web/package.json]
- Fastify 官方 v5 文档仍强调 schema 驱动校验与明确响应结构；2.3 扩展 note 错误码和请求体时，应继续通过 route schema 保持响应可判读。 [Source: https://fastify.dev/docs/v5.5.x/]
- Node.js 官方 `crypto` 文档说明 `scrypt` 是面向口令派生、计算与内存开销较高的 KDF，salt 应尽量随机且至少 16 字节；如果本 story 不想额外引依赖，用内建 `crypto` 已足够支撑密钥摘要实现。 [Source: https://nodejs.org/api/crypto.html]

### Project Structure Notes

- 项目上下文明确要求：`pnpm` 优先、中文输出优先、Pinia 只管 auth/UI、Alova 管远端数据，且文档与代码冲突时要显式指出。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]
- 检测到一个需要开发时留意的文档冲突：`docs/tech-solution.md` 中“前端只传 key，后端写 key_hash”的方向仍成立，但该文档对会话与 token 的早期草案已落后于当前代码和架构；2.3 应以当前服务端会话 + 前端内存态为准，不要回到本地长期持久化思路。 [Source: /Users/youranreus/Code/Projects/note/docs/tech-solution.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- UX 文档已经明确“编辑密钥属于主流程后的增强能力”，所以密钥输入应该后置到对象上下文内部，而不是抢在进入便签之前。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]

### References

- [epics.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md)
- [prd.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md)
- [architecture.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md)
- [ux-design-specification.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md)
- [project-context.md](/Users/youranreus/Code/Projects/note/_bmad-output/project-context.md)
- [database-design.md](/Users/youranreus/Code/Projects/note/docs/database-design.md)
- [tech-solution.md](/Users/youranreus/Code/Projects/note/docs/tech-solution.md)
- [1-4-online-note-save-and-update.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md)
- [1-5-shareable-note-header-feedback.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md)
- [2-1-sso-login-callback-recovery.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-1-sso-login-callback-recovery.md)
- [2-2-owner-default-edit-permission.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-2-owner-default-edit-permission.md)
- [schema.prisma](/Users/youranreus/Code/Projects/note/apps/api/prisma/schema.prisma)
- [notes.ts](/Users/youranreus/Code/Projects/note/apps/api/src/routes/notes.ts)
- [note-read-service.ts](/Users/youranreus/Code/Projects/note/apps/api/src/services/note-read-service.ts)
- [note-write-service.ts](/Users/youranreus/Code/Projects/note/apps/api/src/services/note-write-service.ts)
- [note.ts](/Users/youranreus/Code/Projects/note/apps/api/src/schemas/note.ts)
- [index.ts](/Users/youranreus/Code/Projects/note/packages/shared-types/src/index.ts)
- [note-methods.ts](/Users/youranreus/Code/Projects/note/apps/web/src/services/note-methods.ts)
- [use-online-note.ts](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/use-online-note.ts)
- [online-note.ts](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/online-note.ts)
- [OnlineNoteShell.vue](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue)
- [NoteObjectHeader.vue](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/NoteObjectHeader.vue)
- [note-write-service.spec.ts](/Users/youranreus/Code/Projects/note/apps/api/tests/note-write-service.spec.ts)
- [notes-read.spec.ts](/Users/youranreus/Code/Projects/note/apps/api/tests/notes-read.spec.ts)
- [use-online-note.spec.ts](/Users/youranreus/Code/Projects/note/apps/web/tests/use-online-note.spec.ts)
- [online-note.spec.ts](/Users/youranreus/Code/Projects/note/apps/web/tests/online-note.spec.ts)
- [Fastify v5 Docs](https://fastify.dev/docs/v5.5.x/)
- [Node.js Crypto API](https://nodejs.org/api/crypto.html)

## Change Log

- 2026-04-05: 创建 Story 2.3 上下文，补齐编辑密钥共享编辑的契约建议、服务端权限收口、Web 轻量输入流、风险边界与测试门槛，供后续 `dev-story` 直接实现。
- 2026-04-05: 完成 Story 2.3 实现，补齐编辑密钥哈希服务、共享编辑权限语义、在线便签密钥输入流与 API/Web 回归测试，并验证 test、typecheck、build 全部通过。

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 已完整读取 `sprint-status.yaml`，确认当前第一条 backlog story 为 `2-3-edit-key-shared-editing`。
- 已提取 Epic 2 中 Story 2.3/2.4 的相邻边界，确认本 story 负责“编辑密钥共享编辑闭环”，不负责完整授权矩阵收口。
- 已复盘 Story 2.2 当前实现，确认 `key_hash` 字段已存在，但服务端读写逻辑、共享 DTO 和 Web 状态机仍未接入编辑密钥。
- 已检查 `note-read-service`、`note-write-service`、`note-methods`、`use-online-note`、`OnlineNoteShell`、`NoteObjectHeader` 与现有测试，确认本 story 需要同时覆盖 API 契约、服务端权限、前端状态和回归测试。
- 已补充官方资料核对：当前 repo 依赖版本应保持不升级；若用 Node 内建 `crypto` 实现摘要，可使用 `scrypt` + 随机 salt 方案。
- 已先补红测并通过：`pnpm --filter @note/api test -- note-edit-key-service.spec.ts note-read-service.spec.ts note-write-service.spec.ts` 与 `pnpm --filter @note/web test -- use-online-note.spec.ts online-note.spec.ts`。
- 已执行完整验证：`pnpm --filter @note/api test`、`pnpm --filter @note/web test`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/web typecheck`、`pnpm --filter @note/api build`、`pnpm --filter @note/web build`，结果全部通过。
- 已将 sprint 跟踪从 `ready-for-dev` 更新为 `in-progress`，并在完成实现后准备同步到 `review`。

### Completion Notes List

- 已新增 `note-edit-key-service`，用随机 salt + `node:crypto.scrypt()` + `timingSafeEqual` 实现编辑密钥摘要与校验，确保服务端只存 `key_hash`。
- 已扩展共享契约与服务端读写逻辑，支持 `key-required` / `key-editable` 访问语义，以及 `NOTE_EDIT_KEY_REQUIRED` / `NOTE_EDIT_KEY_INVALID` 的稳定错误反馈。
- 已在在线便签页加入仅内存态的编辑密钥输入流，支持首次用密钥创建、协作者凭密钥保存、首存不可恢复风险提示，以及 `sid` 切换后自动清空密钥。
- 已补齐 API/Web 单测与回归验证，确认 owner 默认编辑权、公开查看路径、对象头部反馈和本地草稿保留行为没有回归。

### File List

- _bmad-output/implementation-artifacts/2-3-edit-key-shared-editing.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- apps/api/src/schemas/note.ts
- apps/api/src/services/note-edit-key-service.ts
- apps/api/src/services/note-read-service.ts
- apps/api/src/services/note-write-service.ts
- apps/api/tests/note-edit-key-service.spec.ts
- apps/api/tests/note-read-service.spec.ts
- apps/api/tests/note-write-service.spec.ts
- apps/web/src/features/note/components/OnlineNoteShell.vue
- apps/web/src/features/note/online-note.ts
- apps/web/src/features/note/use-online-note.ts
- apps/web/tests/online-note.spec.ts
- apps/web/tests/use-online-note.spec.ts
- packages/shared-types/src/index.ts
