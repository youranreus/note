# Story 2.4: 查看权与编辑权的统一授权状态

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 便签访问者，
I want 系统明确区分我当前是只读、创建者可编辑还是密钥可编辑，
so that 我能理解自己能做什么而不会误操作。

## Acceptance Criteria

1. 用户进入在线便签页后，系统完成对象与权限判断时，页面必须明确展示当前是可查看、可编辑还是需要密钥，且该表达与对象级头部状态保持一致。
2. 用户没有编辑权限时，触发编辑或保存不应造成实际写入；UI 必须给出明确、可行动的下一步提示，而不是只给模糊失败。
3. 前后端共同参与权限判断时，查看权限与编辑权限规则必须一致，不允许前端显示可编辑但服务端实际拒绝且没有解释的状态错位。

## Tasks / Subtasks

- [x] Task 1: 收口在线便签的统一授权语义与共享契约，确保“可看 / 可改 / 下一步动作”有单一事实来源 (AC: 1, 2, 3)
  - [x] 复盘 `packages/shared-types/src/index.ts`、`apps/api/src/schemas/note.ts` 中当前仅以 `editAccess` 五态表达权限的做法；若继续沿用该字段，也必须把它明确约束为前后端共享的唯一授权语义，而不是允许各处再做隐式二次推断。
  - [x] 若现有 `editAccess` 不足以同时表达“当前可查看、当前是否可提交写入、用户下一步应做什么”，可扩展为等价的结构化授权摘要，但必须保持现有 owner / key / forbidden 语义可稳定映射，避免把已完成的 2.2 / 2.3 契约打碎。
  - [x] `GET /api/notes/:sid` 与 `PUT /api/notes/:sid` 成功响应中，对同一对象同一会话应返回一致的授权结论；不要允许读接口说“匿名可继续编辑”，写接口却在无新信息前提下改口拒绝。
  - [x] 对 `NOTE_FORBIDDEN`、`NOTE_EDIT_KEY_REQUIRED`、`NOTE_EDIT_KEY_INVALID`、`NOTE_DELETED` 等错误语义，明确它们分别对应哪一种对象状态与用户下一步动作，避免 Web 端继续靠分散 if/else 猜测。

- [x] Task 2: 在服务端为读取与写入建立同一套授权决策入口，消除 owner / key 分支在不同 service 中各写一份的漂移风险 (AC: 1, 2, 3)
  - [x] 当前 `apps/api/src/services/note-read-service.ts` 与 `apps/api/src/services/note-write-service.ts` 已分别实现 owner / key / forbidden 判断；2.4 应优先抽出共享的授权解析器或 policy service（如 `note-authorization-service.ts`），统一输入为 note 记录、session、可选 edit key 与操作类型。
  - [x] 共享授权入口至少要稳定覆盖：匿名可编辑对象、已登录创建者对象、带 `key_hash` 的匿名对象、带 `key_hash` 的 owner-bound 对象、会话失效、错误密钥、缺失密钥、资源不存在、资源已删除与 sid 冲突。
  - [x] 读取路径要负责给出“当前查看成立，但写入要求是什么”的准确状态；写入路径要在复用同一 policy 的前提下执行真正的允许/拒绝决策，而不是复制一套几乎相同的 switch 分支。
  - [x] 不要因为“统一授权”而改变 Epic 2 既定的安全模型：查看默认开放，编辑默认受控；真正的编辑授权结论仍由服务端 session 与 `key_hash` 校验产生，不能下放到前端持久化判断。

- [x] Task 3: 在 Web 端把对象头部、正文区域、反馈提示、按钮文案和密钥输入提示统一到同一授权视图模型上 (AC: 1, 2, 3)
  - [x] `apps/web/src/features/note/online-note.ts` 目前分别生成 `viewModel`、`saveFeedback`、`objectHeader`、`shellDescription` 等多处文案和状态；2.4 应把这些输出围绕一份统一的 authorization-aware view model 收口，避免对象头部说法与正文区说法不一致。
  - [x] 优先扩展现有 `resolveOnlineNoteViewModel`、`resolveOnlineNoteSaveFeedback`、`resolveOnlineNoteObjectHeader`、`canEditOnlineNote` 与 `use-online-note.ts` 中的 `createSavePayload`/保存流，不要在组件层再新造一套平行授权 mapper，导致同一状态被多处重复翻译。
  - [x] `OnlineNoteShell.vue` 与 `NoteObjectHeader.vue` 至少要对以下状态给出一致表达：创建者可编辑、匿名可编辑、需要密钥后可编辑、已通过密钥可编辑、当前仅可查看不可改。
  - [x] 对 `key-required` 场景，如果继续允许用户先写本地草稿再输入密钥保存，也必须把“当前可以输入草稿”与“服务端尚未授予写权限”区分清楚，禁止出现视觉上像“已可保存”的误导表达。
  - [x] 对 `forbidden` 场景，保持内容可读，但对象头部、按钮状态、反馈文案和下一步指引必须统一收口为“只读查看 + 创建者身份恢复/切换”的明确语义，不能一处写“只读”，另一处仍写“可持续更新”。

- [x] Task 4: 让保存动作与失败反馈具备可行动的授权导向，而不是只有抽象错误 (AC: 2, 3)
  - [x] `apps/web/src/features/note/use-online-note.ts` 当前已在 `NOTE_FORBIDDEN` 时把远端 detail 降级为 `forbidden`；2.4 需要继续把 `NOTE_EDIT_KEY_REQUIRED`、`NOTE_EDIT_KEY_INVALID`、`NOTE_FORBIDDEN` 对应的按钮文案、输入框状态、反馈标题和说明统一成稳定规则。
  - [x] 没有编辑权限时，必须阻止实际写入；但对用户已输入的正文、密钥输入框和当前对象上下文，仍要遵守 Epic 1/2 已建立的“失败不清稿、切 sid 才清内存密钥”的可恢复体验。
  - [x] 下一步提示必须可操作，例如“输入编辑密钥后保存”“切换为创建者身份后再试”，而不是只显示“保存失败”。
  - [x] 复制链接、对象头部分享状态、已保存状态与权限状态必须继续共存，不能因为强化授权表达而把 Story 1.5 已稳定的分享反馈打乱。

- [x] Task 5: 保持 Epic 2 的边界，不在 2.4 借“统一授权”之名吞并 Epic 3 / Epic 4 的对象动作 (AC: 1, 2, 3)
  - [x] 不在本故事中提前接入收藏按钮、删除动作、用户中心列表或全局异常中心，这些仍分别属于 Epic 3 / Epic 4。
  - [x] 不重做首页双入口、本地便签模式、SSO 回跳主流程；2.4 只修正在线便签对象页上的授权表达与读写一致性。
  - [x] 不把 `editAccess` 扩展成与业务边界无关的重型 ACL 系统；本故事目标是收口当前 owner + key 双轨模型，而不是设计通用权限平台。
  - [x] 若实现中发现必须触碰删除、收藏或用户中心数据聚合，优先把变更收缩回在线便签对象本身，并在 Dev Notes 中显式记录剩余问题留给后续故事。

- [x] Task 6: 用 API / Web / 状态机测试把授权矩阵固定下来，避免 2.2 与 2.3 的回归 (AC: 1, 2, 3)
  - [x] API / service 测试至少覆盖：匿名读取匿名对象、owner 读取 owner-bound 对象、non-owner 读取 owner-bound + key 对象、owner 写入成功、non-owner 无密钥失败、non-owner 错误密钥失败、non-owner 正确密钥成功、资源删除与 sid 冲突的稳定语义。
  - [x] 若引入共享 authorization resolver，应对它补齐矩阵级单测，确保读链路与写链路对同一输入不会给出互相矛盾的结论。
  - [x] Web / state 测试至少覆盖：对象头部与正文说明一致、`key-required` 场景的 CTA/提示一致、`forbidden` 场景不会继续显示可保存语义、失败后草稿不丢、sid 切换后旧状态不串台。
  - [x] 至少执行 `pnpm --filter @note/api test`、`pnpm --filter @note/web test`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/web typecheck`；若响应契约或构建入口被修改，再补跑对应 `build`。

## Dev Notes

### Story Intent

Story 2.4 不是再发明一种新的权限模型，而是把 Epic 2 已经落地的两条编辑通道彻底讲清楚并收口一致：登录创建者默认编辑权、编辑密钥共享编辑权。到 2.3 为止，系统已经能区分 `owner-editable`、`key-required`、`key-editable` 与 `forbidden`，但这些语义仍分散在 API service、Web view model、对象头部和保存反馈中各自解释。

这个故事真正要解决的问题，是“同一条 note、同一个会话、同一个页面上，所有地方都必须说同一种人话”。用户不应该在对象头部看到“需要密钥”，却在正文区看到“可持续更新”；也不应该在前端看起来已经能改，结果服务端静默拒绝，只抛一个抽象错误码。

### Requirement Traceability

- FR10, FR14, FR15, FR16, FR17, FR19, FR20, FR24, FR27, FR42
- NFR5, NFR7, NFR11, NFR12, NFR14, NFR19

### Cross-Story Context

- Story 1.3 已经把 `GET /api/notes/:sid` 与在线阅读链路打通，所以 2.4 不能把查看能力重新做成登录前置；要在“可读默认成立”的前提下完善编辑授权表达。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-3-read-online-note-by-sid.md]
- Story 1.4 已经稳定了同一 `sid` 下的首次保存与持续更新，2.4 必须继续沿用 `PUT /api/notes/:sid` 的统一入口，而不是再起一条“权限同步专用”接口。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md]
- Story 1.5 已经把对象级状态主要收口到 `NoteObjectHeader`，因此 2.4 的统一授权表达应优先落在对象头部与正文区的一致化，而不是新增一个平行状态条。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md]
- Story 2.2 已建立“登录创建者默认编辑权”，Story 2.3 已建立“编辑密钥共享编辑权”；2.4 的职责是把它们统一成一致的对象语义，而不是改写 owner / key 的基础安全规则。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-2-owner-default-edit-permission.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-3-edit-key-shared-editing.md]

### Previous Story Intelligence

- 2.3 已经把 `key-required` / `key-editable` 接入共享 DTO、读写 service 与 Web 状态机，所以 2.4 最忌讳的做法是再发明一套只在页面层存在的新权限命名。最佳策略是沿用现有语义并把解释收口。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-3-edit-key-shared-editing.md]
- 2.3 的 review 明确修过“terminal error 时未清理内存密钥”“风险提示误覆盖已登录路径”等问题，说明当前对象页最脆弱的不是功能缺失，而是状态表达细节漂移；2.4 要优先防止这种漂移在授权语义上再次发生。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-3-edit-key-shared-editing.md]
- 2.2 / 2.3 都强调“服务端收口授权，前端只消费稳定结果”。因此即便 2.4 要做统一 view model，也不能把真正的 owner / key 判定重新放回前端。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-2-owner-default-edit-permission.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-3-edit-key-shared-editing.md]

### Current Codebase Reality Check

- `apps/api/src/services/note-read-service.ts` 已能根据 `authorId`、`keyHash` 与 session 返回 `owner-editable` / `anonymous-editable` / `key-required` / `forbidden`，说明“读取时的授权判断”已经存在。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/services/note-read-service.ts]
- `apps/api/src/services/note-write-service.ts` 目前把同一套 owner / key 分支几乎再写了一遍，只是在写入时附带错误码与更新动作；这正是 2.4 最适合收口成共享 policy 的地方。 [Source: /Users/youranreus/Code/Projects/note/apps/api/src/services/note-write-service.ts]
- `apps/web/src/features/note/online-note.ts` 又额外负责把 `editAccess` 翻译成对象头部、保存反馈、页面描述和按钮文案；这说明当前“授权语义 -> UI 表达”的规则也分散在多处 helper 中。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/online-note.ts]
- `apps/web/src/features/note/use-online-note.ts` 会在 `NOTE_FORBIDDEN` 后把当前对象降级成 `forbidden`，但没有提供一份独立、统一的“下一步动作模型”；因此 2.4 很适合把错误反馈与对象状态统一成同一个授权视图层。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/use-online-note.ts]
- `apps/web/src/features/note/components/OnlineNoteShell.vue` 当前允许 `key-required` 场景继续输入正文和密钥，这是合理的；但它也意味着 2.4 必须明确区分“允许本地草稿输入”与“服务端已经授权可写”这两件事。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue]
- `apps/web/src/services/note-methods.ts` 当前直接以 `OnlineNoteDetailDto` / `OnlineNoteSaveResponseDto` 作为 Alova 契约类型；如果 2.4 扩展了响应摘要结构，这里和对应 route 测试必须一起更新，否则 Web 端会继续按旧响应理解授权状态。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/services/note-methods.ts]

### Architecture Compliance

- 架构已明确要求：授权模型是“资源所有权 + 编辑密钥”双轨制，SSO 只负责身份建立，真正的 key 校验在服务端完成。2.4 的统一授权状态必须严格遵守这条边界。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- API 风格继续维持 REST，DTO 继续优先收口在 `packages/shared-types`，Fastify schema 与 Prisma 约束共同保证响应可判读与数据一致性。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 前端状态分层仍然是 Pinia 管会话/UI、Alova 管远端状态；2.4 不应把 note 对象远端授权缓存拆进全局 store。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]

### UX Guardrails

- UX 规格已经把“查看开放、编辑受控”定义为核心心智，要求用户明确知道当前模式、当前权限和下一步动作；2.4 的 UI 不能只做到“能保存”，还要做到“用户能立刻理解为什么能或不能保存”。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- 结果页中的权限提示、状态色和反馈方式必须统一，避免对象头部、按钮、错误提示各讲各的话。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- 登录依然是能力升级而非阅读门槛，所以 2.4 不能把 owner-bound 对象的查看路径错误升级成必须先登录才能打开。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]

### File Structure Requirements

- 优先修改：
  - `packages/shared-types/src/index.ts`
  - `apps/api/src/schemas/note.ts`
  - `apps/api/src/services/note-read-service.ts`
  - `apps/api/src/services/note-write-service.ts`
  - `apps/api/src/routes/notes.ts`
  - `apps/web/src/services/note-methods.ts`
  - `apps/web/src/features/note/online-note.ts`
  - `apps/web/src/features/note/use-online-note.ts`
  - `apps/web/src/features/note/components/OnlineNoteShell.vue`
  - `apps/web/src/features/note/components/NoteObjectHeader.vue`
- 很可能需要新增：
  - `apps/api/src/services/note-authorization-service.ts` 或等价共享 policy utility
  - 若前端状态收口不足，新增 note feature 内的 authorization resolver/helper 文件
  - 对应 API/Web 单测文件
- 一般不应修改：
  - `apps/web/src/features/home/*`
  - `apps/web/src/features/local-note/*`
  - `apps/web/src/features/auth/*`
  - Epic 3 的 favorites 与用户中心列表文件
  - Epic 4 的删除动作相关文件

### Testing Requirements

- API / service 层至少覆盖：
  - owner 读取 owner-bound note 时得到稳定 owner 可编辑语义
  - non-owner 读取 owner-bound + key note 时得到“可查看但需密钥”语义
  - owner / key collaborator / forbidden user 三种写入分支与读取语义不互相矛盾
  - 缺少密钥、错误密钥、会话失效、资源已删除、sid 冲突分别返回稳定错误语义
  - 若新增共享 policy service，对同一输入的 read / write evaluation 做矩阵级断言
  - `apps/api/tests/notes-read.spec.ts` 与 `apps/api/tests/notes-write.spec.ts` 级别的 route 测试也要覆盖新的响应契约和 schema，避免只测 service 通过但 Fastify response schema/序列化层与共享 DTO 脱节
- Web / state 层至少覆盖：
  - 对象头部、页面说明、主按钮文案和反馈条在同一授权状态下用词一致
  - `key-required` 场景既允许保留本地草稿，又不会把对象误导成“已直接可编辑”
  - `forbidden` 场景不会继续显示“可持续更新”或可点击的保存动作
  - `NOTE_FORBIDDEN` / `NOTE_EDIT_KEY_REQUIRED` / `NOTE_EDIT_KEY_INVALID` 对应明确下一步提示
  - sid 切换后旧权限态、旧错误态与旧复制反馈不污染新对象
  - 若改动了共享响应 DTO，`apps/web/tests/online-note.spec.ts` 与 `apps/web/tests/use-online-note.spec.ts` 要覆盖 helper / composable / shell 三层仍在消费同一份授权语义，而不是各自解释
- 回归要求：
  - Story 1.4 的保存链路、Story 1.5 的对象头部与复制反馈、Story 2.1 的登录恢复、Story 2.2 的 owner 语义、Story 2.3 的 key flow 全部继续通过

### Git Intelligence Summary

- 最近 5 次提交仍停留在 `feat: add owner-based note edit access` 这一阶段，说明仓库公开提交历史还没有反映 2.3 的完整上下文；因此实现 2.4 时要以前面 story 产物和当前工作树代码为准，而不是只按 commit 历史判断功能成熟度。 [Source: `git log --oneline -5` on 2026-04-06]
- 这也意味着 2.4 最稳妥的策略是“增量收口既有授权语义”，而不是大规模重做对象页结构。 [Inferred from recent commits and current code layout]

### Latest Technical Notes

- 当前仓库固定的关键版本包括 `fastify@^5.0.0`、`@prisma/client@^5.22.0`、`vue@^3.5.13`、`alova@^3.0.6`；本 story 应在这些版本上收口授权语义，不要顺手做依赖升级。 [Source: /Users/youranreus/Code/Projects/note/apps/api/package.json] [Source: /Users/youranreus/Code/Projects/note/apps/web/package.json]
- 当前架构仍要求 Fastify schema 驱动接口校验、Prisma 管数据约束、前端不持久化编辑密钥；2.4 的实现应该继续贴着现有选型，而不是引入额外权限框架。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md] [Source: /Users/youranreus/Code/Projects/note/docs/tech-solution.md]

### Project Structure Notes

- 项目上下文要求 `pnpm` 优先、中文输出优先、Pinia 只管 auth/UI、Alova 管远端数据，且文档与代码冲突时要显式指出。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]
- `docs/database-design.md` 仍残留早期关于明文 `key` 与迁移双写的历史说明，但当前真实 schema 与 2.3 实现已经站在 `key_hash` 上；2.4 应以当前代码现实与架构文档为准，不要回退到旧口令存储思路。 [Source: /Users/youranreus/Code/Projects/note/docs/database-design.md] [Source: /Users/youranreus/Code/Projects/note/apps/api/prisma/schema.prisma]
- `docs/tech-solution.md` 中“前端只传 key，后端写 key_hash；前端不存密钥”的方向仍然有效，因此 2.4 只统一表达，不改变密钥只存在当前页面内存态的原则。 [Source: /Users/youranreus/Code/Projects/note/docs/tech-solution.md]

### References

- [epics.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md)
- [prd.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md)
- [architecture.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md)
- [ux-design-specification.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md)
- [project-context.md](/Users/youranreus/Code/Projects/note/_bmad-output/project-context.md)
- [tech-solution.md](/Users/youranreus/Code/Projects/note/docs/tech-solution.md)
- [database-design.md](/Users/youranreus/Code/Projects/note/docs/database-design.md)
- [1-3-read-online-note-by-sid.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-3-read-online-note-by-sid.md)
- [1-4-online-note-save-and-update.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md)
- [1-5-shareable-note-header-feedback.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md)
- [2-2-owner-default-edit-permission.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-2-owner-default-edit-permission.md)
- [2-3-edit-key-shared-editing.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-3-edit-key-shared-editing.md)
- [index.ts](/Users/youranreus/Code/Projects/note/packages/shared-types/src/index.ts)
- [note.ts](/Users/youranreus/Code/Projects/note/apps/api/src/schemas/note.ts)
- [notes.ts](/Users/youranreus/Code/Projects/note/apps/api/src/routes/notes.ts)
- [note-read-service.ts](/Users/youranreus/Code/Projects/note/apps/api/src/services/note-read-service.ts)
- [note-write-service.ts](/Users/youranreus/Code/Projects/note/apps/api/src/services/note-write-service.ts)
- [note-methods.ts](/Users/youranreus/Code/Projects/note/apps/web/src/services/note-methods.ts)
- [online-note.ts](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/online-note.ts)
- [use-online-note.ts](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/use-online-note.ts)
- [OnlineNoteShell.vue](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue)
- [NoteObjectHeader.vue](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/NoteObjectHeader.vue)
- [note-read-service.spec.ts](/Users/youranreus/Code/Projects/note/apps/api/tests/note-read-service.spec.ts)
- [note-write-service.spec.ts](/Users/youranreus/Code/Projects/note/apps/api/tests/note-write-service.spec.ts)
- [notes-read.spec.ts](/Users/youranreus/Code/Projects/note/apps/api/tests/notes-read.spec.ts)
- [notes-write.spec.ts](/Users/youranreus/Code/Projects/note/apps/api/tests/notes-write.spec.ts)
- [use-online-note.spec.ts](/Users/youranreus/Code/Projects/note/apps/web/tests/use-online-note.spec.ts)
- [online-note.spec.ts](/Users/youranreus/Code/Projects/note/apps/web/tests/online-note.spec.ts)

## Change Log

- 2026-04-06: 创建 Story 2.4 上下文，补齐统一授权语义、服务端共享 policy、对象头部与正文区一致表达、下一步动作提示和回归测试矩阵，供后续 `dev-story` 直接实现。
- 2026-04-06: 完成 Story 2.4 开发，新增共享授权解析器，统一读写链路与对象页授权文案，并补齐 API / Web 回归测试与构建验证。
- 2026-04-06: 按 review follow-up 方式复核当前候选实现；未发现需要追加修复的回归问题，并再次确认 API / Web 测试、类型检查与构建均通过。

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 已完整读取 `sprint-status.yaml`，确认当前第一条 backlog story 为 `2-4-unified-view-edit-authorization`。
- 已抽取 Epic 2 中 Story 2.4 的用户故事与 AC，并对照 PRD 中 FR10/14/15/16/17/19/20/42 与相关 NFR 收口需求边界。
- 已复盘 Story 2.2 与 Story 2.3 的实施产物，确认当前代码已经具备 owner/key 五态授权基础，但语义分散在 API service、Web helper、对象头部和保存反馈中。
- 已检查 `note-read-service.ts`、`note-write-service.ts`、`online-note.ts`、`use-online-note.ts`、`OnlineNoteShell.vue` 与现有测试，确认本 story 的关键任务是“统一授权解释与读写一致性”，而不是新增第三套权限模型。
- 已结合架构、UX 和项目上下文确认边界：继续保持“查看开放、编辑受控”、服务端收口授权、Pinia 只管 auth/UI、Alova 管远端状态，不触碰 favorites/delete/user center 范围。
- 已先补 `note-authorization-service.spec.ts`、`notes-read.spec.ts`、`notes-write.spec.ts` 与 `online-note.spec.ts` 的失败用例，再实现共享授权解析器与前端统一授权 UI model，按 red-green-refactor 收口 2.4。
- 已让 `note-read-service.ts` 与 `note-write-service.ts` 共用 `resolveNoteAuthorizationContext`，并通过 `OnlineNoteShell.vue` 消费 `resolveOnlineNoteAuthorizationUiModel`，消除对象头部、正文说明、CTA 与密钥提示的分散推断。
- 已执行 `pnpm --filter @note/api test`、`pnpm --filter @note/api typecheck`、`pnpm --filter @note/api build`、`pnpm --filter @note/web test`、`pnpm --filter @note/web typecheck`、`pnpm --filter @note/web build`，全部通过。
- 本次按 review follow-up 续作检查故事文件时，未发现 `Senior Developer Review (AI)` 或 `Review Follow-ups (AI)` 段落，因此改以当前工作树作为 2.4 候选实现进行验收复核；复核结果未发现新的阻塞问题。

### Completion Notes List

- 已生成 Story 2.4 的完整开发上下文，覆盖统一授权语义、共享 policy 建议、前端一致表达、测试矩阵与边界约束。
- 已将 sprint 跟踪中的 `2-4-unified-view-edit-authorization` 从 `backlog` 更新为 `ready-for-dev`。
- 已新增 `apps/api/src/services/note-authorization-service.ts`，把 owner / key / forbidden / anonymous 的读写前置判断统一成单一事实来源，并让读取与写入对同一对象和会话返回一致授权结论。
- 已在 `apps/web/src/features/note/online-note.ts` 中新增统一授权 UI model，并让 `OnlineNoteShell.vue` 用同一模型驱动对象说明、按钮文案、编辑密钥标签、只读提示与风险提醒。
- 已补齐授权矩阵测试与构建验证，确认 `key-required`、`owner-editable`、`key-editable`、`forbidden` 场景在 API、Web helper 和页面壳层上保持一致，且失败不清稿、切 sid 才清内存密钥的体验未回退。
- 已完成 review follow-up 式复核：当前实现无需追加代码修复，故事状态继续保持 `review`，可直接进入正式代码评审。

### File List

- _bmad-output/implementation-artifacts/2-4-unified-view-edit-authorization.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- packages/shared-types/src/index.ts
- apps/api/src/schemas/note.ts
- apps/api/src/services/note-authorization-service.ts
- apps/api/src/services/note-read-service.ts
- apps/api/src/services/note-write-service.ts
- apps/api/tests/note-authorization-service.spec.ts
- apps/api/tests/note-write-service.spec.ts
- apps/api/tests/notes-read.spec.ts
- apps/api/tests/notes-write.spec.ts
- apps/web/src/features/note/components/OnlineNoteShell.vue
- apps/web/src/features/note/online-note.ts
- apps/web/src/features/note/use-online-note.ts
- apps/web/tests/online-note.spec.ts
- apps/web/tests/use-online-note.spec.ts
