# Story 1.5: 可分享对象头部与主路径反馈

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 创建者，
I want 在线便签页清楚展示当前对象状态和可分享链接，
so that 我能确认这个链接已经可用并放心发给别人。

## Acceptance Criteria

1. 用户位于在线便签页时，对象级头部应清楚显示当前 `sid`、链接可分享状态、保存状态和编辑状态，且这些状态集中呈现在对象级头部附近而不是分散在多个角落。
2. 用户完成保存、复制链接或其他主路径动作时，系统应优先使用 inline status 或轻量 toast 给出简洁且可明确理解的反馈。
3. 状态或操作反馈出现在页面中时，系统不能只依赖颜色表达结果，必须同时提供可读文字或等价语义提示。

## Tasks / Subtasks

- [x] Task 1: 为在线便签页提炼可复用的对象级头部结构 (AC: 1, 3)
  - [x] 基于现有 `apps/web/src/features/note/components/OnlineNoteShell.vue` 提炼或内聚一个 `NoteObjectHeader` 风格的对象级状态区，优先放在 `features/note/components` 内，不要退化成全局后台工具条。
  - [x] 对象级头部至少集中呈现 `sid`、保存状态、可分享状态、编辑状态与复制链接动作，避免把这些关键信息散落在正文区、页脚和异常提示里。
  - [x] 继续保持“内容主体为中心”的页面结构：对象级头部服务于在线对象心智，不要把在线页重构成多栏后台布局。
  - [x] 若选择新增组件，优先让 `OnlineNoteShell.vue` 负责装配，业务状态仍由 `useOnlineNote` / `online-note.ts` 提供；不要把业务推回 `views`。

- [x] Task 2: 在 `features/note` 中补齐对象头部所需的展示与交互语义 (AC: 1, 2, 3)
  - [x] 在 `apps/web/src/features/note/online-note.ts` 中新增或扩展对象头部 view model / adapter，统一收口“保存状态文案”“分享可用文案”“编辑状态文案”“复制成功/失败反馈文案”。
  - [x] 明确区分至少这些对象头部状态：`未保存`、`已保存`、`保存中`、`保存失败`、`可分享`、`当前编辑权未接入/待 Epic 2`；不要把 Epic 2 的真实权限逻辑提前实现成假权限系统。
  - [x] 继续让 `useOnlineNote` 成为在线对象局部状态的唯一来源，避免在模板里散落一组新的 if/else 文案常量。
  - [x] 复制链接反馈必须显式说明“复制成功了什么”或“复制失败了什么”，不能只显示抽象成功/失败颜色块。

- [x] Task 3: 为当前在线对象提供稳定、可复制的分享链接动作 (AC: 1, 2, 3)
  - [x] 在在线页基于当前路由 `sid` 生成稳定分享链接，链接语义必须继续指向 `/note/o/:sid`，不得引入新的分享入口路径或临时短链。
  - [x] 复制逻辑优先使用浏览器 Clipboard API；若运行环境或权限不支持，至少提供明确失败反馈，不要静默失败。
  - [x] 只有在当前对象已具备可分享语义时才呈现“可分享/复制链接”正向状态；对 `invalid-sid`、`deleted`、通用 `error` 等终态，不得伪装成可分享对象。
  - [x] 复制动作必须支持键盘触发，按钮语义和可聚焦性需符合现有 foundation 组件约束。

- [x] Task 4: 将主路径反馈统一收口为轻量且明确的页面反馈 (AC: 2, 3)
  - [x] 优先复用现有 `InlineFeedback` 体系表达保存成功、保存失败、复制成功、复制失败等主路径反馈；若确实需要轻量 toast，也应以最小增强方式落在现有 UI 分层，不引入新的全局通知框架。
  - [x] 反馈文案必须说明“什么动作成功/失败”，例如“已复制当前在线便签链接”“复制当前在线便签链接失败”，不能只显示“成功”“失败”。
  - [x] 所有反馈都必须有文字表达，不只依赖颜色、边框或图标区分。
  - [x] 成功反馈应保持轻量、短时、不阻断流程；错误反馈应给出下一步建议，例如重试、检查浏览器权限或刷新页面。

- [x] Task 5: 保持 Story 1.5 边界，避免提前吞并后续 epic 能力 (AC: 1, 2, 3)
  - [x] 不在本故事实现真实编辑权限校验、编辑密钥输入、登录创建者默认编辑权或 SSO 回跳；对象头部中的编辑状态在本故事只表达当前最小可知语义，并给 Epic 2 留扩展位。
  - [x] 不在本故事实现收藏、用户中心、“我的创建 / 我的收藏”或删除动作；这些分别属于 Epic 3 / Epic 4。
  - [x] 不重做 Story 1.4 已完成的保存链路，不改动 `PUT /api/notes/:sid` 的业务语义，也不把主路径反馈迁移成静默 autosave。
  - [x] 不把本地便签模式逻辑混入在线模式对象头部；`/note/l/:sid` 仍由 Story 1.6 负责。

- [x] Task 6: 为对象头部与复制反馈补齐测试与验收 (AC: 1, 2, 3)
  - [x] 前端测试至少覆盖：对象头部集中显示 `sid` / 保存状态 / 可分享状态 / 编辑状态、复制链接成功反馈、复制链接失败反馈、`saving` 态按钮禁用、`deleted` / `invalid-sid` / `error` 不显示伪造分享动作。
  - [x] 若新增 `NoteObjectHeader` 组件，应直接为该组件补单测；若逻辑仍留在 `OnlineNoteShell.vue`，则扩展 `apps/web/tests/online-note.spec.ts` 与相关 `useOnlineNote` 状态机测试。
  - [x] 保持 Story 1.4 的保存回归继续通过，特别是：首次保存创建、再次保存更新、保存失败保留草稿、sid 切换不污染当前对象。
  - [x] 至少执行 `pnpm --filter @note/web test`、`pnpm --filter @note/web typecheck`、`pnpm --filter @note/web build`；若为复制动作补了共享类型或接口，也补跑受影响包的测试/构建。

### Review Findings

- [x] [Review][Patch] 修正过期的复制结果会污染当前对象状态 [apps/web/src/features/note/use-online-note.ts:204]
- [x] [Review][Patch] 修正已存在对象在“保存中”时被误标为“保存后可分享” [apps/web/src/features/note/online-note.ts:322]

## Dev Notes

### Story Intent

Story 1.4 已经把在线便签从“可读取”推进到“可保存、可持续更新”，但用户在当前页面里仍缺少一个足够清楚的对象级心智锚点。Story 1.5 的职责，不是再造新的业务链路，而是把“这个对象是谁、现在是否保存好了、是否可以放心分享、当前是否还能继续维护”集中表达出来，让分享动作真正变成主路径的一部分，而不是让用户靠猜测判断当前链接是否已可用。

### Requirement Traceability

- FR4, FR16, FR24, FR25, FR26, FR27, FR29
- NFR1, NFR3, NFR4, NFR10, NFR12, NFR14, NFR15, NFR16, NFR17
- UX-DR5, UX-DR6, UX-DR14, UX-DR15, UX-DR17, UX-DR19, UX-DR20

### Cross-Story Context

- Story 1.3 已把 `/note/o/:sid` 建成匿名可读的真实对象读取页，因此 1.5 不需要重新定义在线对象入口或分享访问语义。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-3-read-online-note-by-sid.md]
- Story 1.4 已落地首次保存与持续更新，且页面内已经存在“对象状态 / 保存状态 / 正文编辑”的基础骨架；1.5 应在这个骨架上加强对象级反馈，而不是重做保存链路。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md]
- Story 1.6 才负责本地便签独立模式，因此 1.5 只服务在线对象，不要把本地模式入口或本地存储反馈揉进当前页。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md]
- Epic 2 才接入真实的“登录创建者默认编辑权 + 编辑密钥共享编辑权”，因此 1.5 的编辑状态只能表达当前最小语义和未来扩展位，不能提前伪造权限系统。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md]

### Previous Story Intelligence

- Story 1.4 已将 `OnlineNoteShell.vue` 从只读消费页推进为“对象摘要 + 保存反馈 + 可编辑正文”的结构，这使它天然成为 1.5 接入对象头部的主落点。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md]
- Story 1.4 已在 `useOnlineNote` / `online-note.ts` 中收口 `unsaved / saving / saved / save-error` 状态，因此 1.5 应复用这组状态，而不是在模板中再造第二套保存文案枚举。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/use-online-note.ts] [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/online-note.ts]
- 最近提交 `37e8f4b fix story 1.4 review follow-ups` 与 `4a1f0a0 feat: 完成在线便签读取与保存链路` 说明当前实现主线已经稳定在“在线对象路径”，1.5 应继续在这个主线上增量演进，而不是回头改动脚手架或 API 边界。 [Source: `git log --oneline -5` on 2026-04-03]
- Story 1.4 明确把完整对象头部、复制链接入口留给 1.5，因此如果 1.5 仍停留在分散的状态块，就无法兑现 Epic 1 对“稳定分享心智”的承接。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md]

### Current Codebase Reality Check

- `apps/web/src/features/note/components/OnlineNoteShell.vue` 目前已经显示 `sid`、对象状态和保存状态卡片，但“分享可用状态”“复制链接动作”“编辑状态表达”仍未集中收口为真正的对象级头部。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue]
- `apps/web/src/features/note/use-online-note.ts` 已具备保存请求与保存反馈，但尚未暴露复制链接动作、复制反馈或面向对象头部的聚合状态。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/use-online-note.ts]
- `apps/web/src/features/note/online-note.ts` 已具备保存反馈适配器，适合继续扩展对象头部展示文案和复制反馈解析，而不是把这些文案散落回组件模板。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/online-note.ts]
- `apps/web/src/components/ui` 当前只有 `InlineFeedback`、`Button`、`SurfaceCard`、`StatusPill` 等基础组件，仓库里还没有现成 toast 体系；因此 1.5 的首选应是复用 inline feedback，而不是引入新的全局消息框架。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/components/ui]
- `apps/web/tests/online-note.spec.ts` 已覆盖保存反馈与异常态，是 1.5 扩展对象头部与复制反馈回归测试的自然位置。 [Source: /Users/youranreus/Code/Projects/note/apps/web/tests/online-note.spec.ts]

### Technical Requirements

- 前端继续使用 `Vue 3 + TypeScript + alova + axios`，不要为复制/反馈引入新的状态库、通知库或分享 SDK。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md] [Source: /Users/youranreus/Code/Projects/note/apps/web/package.json]
- 在线对象的唯一身份仍然是当前路由 `sid`；分享链接必须直接来源于 `/note/o/:sid`，不能使用首页遗留状态、随机新 sid 或隐式短链。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 所有对象级反馈都必须可被文本理解，不能只依赖颜色，这既是 UX 要求，也是基础可访问性底线。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- 成功反馈应轻量、不阻断；失败反馈应说明原因与下一步动作，例如“浏览器不支持复制”或“请稍后重试”。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns]
- Pinia 仍只管理会话与 UI，全局分享状态或复制状态不要塞进 store；对象头部状态应继续留在 `features/note` 局部。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]

### Architecture Compliance Guardrails

- `views` 继续只做路由装配，在线对象头部的状态聚合与交互实现放在 `features/note`，不要把复制逻辑塞进 `OnlineNoteView.vue`。
- 继续遵守 `views + features + components + services` 分层：对象头部组件在 `features/note/components`，状态适配在 `features/note/online-note.ts`，若需要分享链接工具函数可放在 `features/note` 或 `services` 的最小邻近位置。
- 不修改 `apps/api` 的 notes 业务语义，除非你确实发现 Story 1.5 需要服务端补充不可替代的链接信息；默认情况下，复制链接应由前端根据当前路由直接生成。
- 不要把“编辑状态”实现成假的服务端权限判断；本故事最多表达“当前可继续编辑 / 权限模型待 Epic 2 接入”的前端语义层。
- 对象头部必须围绕内容对象组织，而不是演变成后台工具栏或设置面板。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md#NoteObjectHeader]

### Library / Framework Requirements

- 当前仓库前端版本固定为：`vue@^3.5.13`、`alova@^3.0.6`、`axios@^1.7.9`、`vitest@^2.1.8`；Story 1.5 应在这些版本范围内完成。 [Source: /Users/youranreus/Code/Projects/note/apps/web/package.json]
- 复制链接动作优先使用标准浏览器 `navigator.clipboard.writeText()`；如果不可用，走最小失败反馈，不要为此新增第三方 clipboard 依赖。
- 如果确实需要临时态提示动画，也应建立在现有 Vue 响应式和基础组件之上，不要引入额外 UI runtime。

### UX Guidance

- `NoteObjectHeader` 的 anatomy 已明确要求包含 `current sid`、`save status`、`share / copy action` 和可选 `permission indicator`；这就是 1.5 的主实现范围。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md#NoteObjectHeader]
- 在线页的核心不是后台管理，而是“内容主体 + 对象状态 + 主操作”三者围绕同一对象组织，因此对象头部应贴近内容主体上方，且在移动端也保持主路径完整。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- UX 明确要求复制链接按钮可键盘触发、状态文本明确可读、颜色之外必须有文字表达；测试必须覆盖这些交互与文案约束。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md#NoteObjectHeader]
- 反馈模式优先使用 inline status 或轻量 toast，其中成功反馈要短、清楚、不阻断；错误反馈要指出原因和下一步。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns]
- 同屏只能有一个唯一主任务 primary button；如果页面此时主任务仍是“保存更新”，复制链接应避免与保存按钮形成同级双 primary。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]

### Data and API Notes

- Story 1.5 默认不需要新增 API；当前可分享链接可以直接由前端基于当前路由对象生成，因为对象稳定性已经由 `sid` 和既有 notes 读写链路提供。 [Inference from Sources: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md, /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md]
- `notes.sid` 仍是整个分享链路的唯一业务键，因此复制动作必须复制对象链接，而不是正文内容、临时 session 链接或不稳定 query 参数。 [Source: /Users/youranreus/Code/Projects/note/docs/database-design.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 如果开发过程中发现当前部署环境对绝对分享链接的 host 解析没有统一来源，优先用浏览器当前 origin 组装对象链接，并把环境差异显式记录在实现说明里，不要硬编码开发域名。

### File Structure Requirements

- 预计至少会修改：
  - `apps/web/src/features/note/components/OnlineNoteShell.vue`
  - `apps/web/src/features/note/use-online-note.ts`
  - `apps/web/src/features/note/online-note.ts`
  - `apps/web/tests/online-note.spec.ts`
- 视具体实现可新增：
  - `apps/web/src/features/note/components/NoteObjectHeader.vue`
  - `apps/web/tests/note-object-header.spec.ts`
  - `apps/web/src/features/note/share-link.ts` 或等价最小工具文件
- 一般不应修改：
  - `apps/api/src/routes/notes.ts`
  - `apps/api/src/services/note-write-service.ts`
  - `apps/web/src/features/home/*`
  - `apps/web/src/features/local-note/*`
  - `apps/web/src/stores/*`

### Testing Requirements

- 前端组件/页面测试至少覆盖：
  - 对象头部在 `available` / `not-found` 状态下集中显示 `sid`、保存状态、分享状态、编辑状态
  - 复制链接成功时出现明确成功反馈
  - Clipboard API 失败时出现明确失败反馈且不吞掉错误
  - `saving` 态下不出现误导性的“已复制/可分享”成功提示
  - `deleted` / `invalid-sid` / `error` 不渲染伪造对象头部主动作
- 回归测试至少覆盖：
  - Story 1.4 的保存中、保存成功、保存失败反馈仍然成立
  - 现有 `useOnlineNote` 状态机与 sid 切换行为不被对象头部改动破坏
  - 页面同屏 primary action 层级仍清晰，未因为复制链接而出现双 primary 冲突
- 至少执行：
  - `pnpm --filter @note/web test`
  - `pnpm --filter @note/web typecheck`
  - `pnpm --filter @note/web build`

### Git Intelligence Summary

- 最近五条提交显示当前实现节奏是“故事文档补齐 -> 在线读取与保存 -> 1.4 review follow-up”，这意味着 1.5 最适合做一层围绕在线对象的 UX 强化，而不是再次进入基础设施施工。 [Source: `git log --oneline -5` on 2026-04-03]
- 当前仓库里尚未出现现成 `NoteObjectHeader` 或 clipboard 抽象，说明这条 story 需要做的是“在既有在线页上最小增量地补齐对象头部”，而不是接手一个已经半成品的头部模块。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note]

### Project Structure Notes

- 本项目约定规划类产物在 `_bmad-output/planning-artifacts/`，实施类产物在 `_bmad-output/implementation-artifacts/`；当前 story 文件应只作为实现上下文，不反向修改 PRD/Architecture/UX 主文档。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]
- 项目上下文明确要求“任何新命令优先给出 `pnpm` 写法”“规划、架构、story、实现方案优先使用中文输出”“当真实代码与 docs 冲突时先显式指出冲突再决定”。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]

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
- [OnlineNoteShell.vue](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue)
- [use-online-note.ts](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/use-online-note.ts)
- [online-note.ts](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/online-note.ts)
- [note-methods.ts](/Users/youranreus/Code/Projects/note/apps/web/src/services/note-methods.ts)
- [online-note.spec.ts](/Users/youranreus/Code/Projects/note/apps/web/tests/online-note.spec.ts)

## Change Log

- 2026-04-03: 完成 Story 1.5，实现在线对象头部、稳定分享链接复制、统一主路径反馈，并补齐 web 与 workspace 回归验证。
- 2026-04-04: 处理 Story 1.5 review follow-ups，修正跨 sid 的过期复制反馈污染，并校正已存在对象在保存中的分享状态语义。

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 已完整读取 `sprint-status.yaml` 与 Story 1.5 文档，确认当前开发目标为 `1-5-shareable-note-header-feedback`，并将 sprint 状态切到 `in-progress` 后开始实现。
- 已先扩展 `apps/web/tests/online-note.spec.ts` 与 `apps/web/tests/use-online-note.spec.ts`，锁定对象头部展示、复制成功/失败反馈、异常态边界和保存中禁用行为，再进入实现。
- 已新增 `apps/web/src/features/note/components/NoteObjectHeader.vue` 与 `apps/web/src/features/note/share-link.ts`，将对象头部展示和稳定分享链接生成从页面模板中抽离出来。
- 已扩展 `apps/web/src/features/note/online-note.ts`，补齐对象头部 view model、复制成功/失败反馈工厂和对象状态文案收口。
- 已扩展 `apps/web/src/features/note/use-online-note.ts`，接入 `copyShareLink()`、对象头部聚合状态与 `primaryFeedback`，确保复制反馈与保存反馈共用同一轻量反馈出口。
- 已更新 `apps/web/src/features/note/components/OnlineNoteShell.vue`，使用 `NoteObjectHeader` 集中展示 `sid`、保存状态、分享状态、编辑状态，并接入复制链接动作。
- 已执行 `pnpm --filter @note/web test`、`pnpm --filter @note/web typecheck`、`pnpm --filter @note/web build` 与 `pnpm test`，确认 web 与 workspace 回归全部通过。
- 已补充 review follow-up 测试，覆盖复制成功回调在 sid 切换后不得污染当前对象，以及已存在对象在 `saving` 态下仍保持“可分享”语义但禁用复制按钮。
- 已修正 `copyShareLink()` 的异步结果写回条件，仅在当前 sid 未切换时才落复制成功/失败反馈，避免过期反馈串入新对象。
- 已修正 `resolveOnlineNoteObjectHeader()` 的分享状态判定，已存在对象在保存中仍显示“可分享”，并明确说明接收者看到的是最近一次成功保存的内容。

### Completion Notes List

- 已将在线页原先分散的对象信息收口为 `NoteObjectHeader`，集中展示当前 `sid`、保存状态、分享状态、编辑状态与复制链接动作。
- 已实现基于当前路由 `sid` 的稳定分享链接复制，默认复制 `/note/o/:sid` 对应的绝对链接，并在 Clipboard API 失败时给出明确失败反馈。
- 已把复制反馈与保存反馈统一到同一组 `InlineFeedback` 出口中，保证主路径动作都有文字化、轻量化反馈，不只依赖颜色。
- 已保持 Story 1.4 的保存链路与编辑流程不变，没有越界进入 Epic 2/3/4；编辑状态当前仅表达“可继续编辑 + Epic 2 待接入”的最小语义。
- 已补齐并通过对象头部与复制反馈相关测试，同时确认 workspace 全量测试回归通过。
- 已消除复制反馈跨 sid 串台问题，切换到新对象后不会再出现上一个对象迟到返回的“已复制当前在线便签链接”提示。
- 已校正已有在线对象在保存中的对象头部语义，保持“可分享”状态但暂时禁用复制动作，避免误导成“保存后可分享”。

### File List

- `_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/web/src/features/note/components/NoteObjectHeader.vue`
- `apps/web/src/features/note/components/OnlineNoteShell.vue`
- `apps/web/src/features/note/online-note.ts`
- `apps/web/src/features/note/share-link.ts`
- `apps/web/src/features/note/use-online-note.ts`
- `apps/web/tests/online-note.spec.ts`
- `apps/web/tests/use-online-note.spec.ts`
