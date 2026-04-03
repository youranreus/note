# Story 1.6: 本地便签独立模式

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 访客用户，
I want 使用不依赖远端账号和数据库的本地便签模式，
so that 我可以在轻量场景下快速记录而不混淆在线分享对象。

## Acceptance Criteria

1. 用户从首页进入本地便签模式后，在 `/note/l/:sid` 中编辑的内容应保存在本地存储，而不是远端在线便签数据源；本地模式与在线模式的数据读取和保存逻辑必须明确分离。
2. 用户再次打开相同的本地便签 `sid` 时，如果本地存储中存在对应内容，页面应恢复该本地最新内容，且不应误读或覆盖远端在线便签数据。
3. 本地便签页面在移动端和桌面端都应保持核心内容区与主按钮完整可用，页面布局不应因屏宽变化改变核心流程语义。

## Tasks / Subtasks

- [x] Task 1: 为本地模式建立独立的本地持久化边界 (AC: 1, 2)
  - [x] 在 `apps/web/src/features/local-note` 下新增本地模式专属状态与存储模块，例如 `use-local-note.ts`、`local-note.ts`、`storage/*`，不要把实现塞回 `features/note`。
  - [x] 以当前路由 `sid` 作为本地便签对象键，定义最小本地数据模型，至少覆盖 `sid`、正文内容、最后更新时间或等价恢复信息。
  - [x] 为本地便签存储定义稳定、可测试的 key 命名空间，例如 `note:local:<sid>` 或等价前缀，确保它与在线模式、会话 token 和其他 UI 本地状态明确隔离。
  - [x] 持久化仅使用浏览器本地存储；不得调用 `apps/web/src/services/note-methods.ts`、Alova 远端请求或任何 API 路由。
  - [x] 若浏览器本地存储不可用或访问失败，必须提供明确失败反馈，不要静默降级成在线便签或临时内存态。

- [x] Task 2: 在 `features/local-note` 中建立本地便签 view model 与交互语义 (AC: 1, 2, 3)
  - [x] 在 `apps/web/src/features/local-note/local-note.ts` 中集中收口本地模式文案与状态适配，至少覆盖 `未保存`、`已保存在本地`、`保存中` 或等价写入中、`保存失败`、`invalid-sid`。
  - [x] `useLocalNote` 应成为本地便签页面的唯一局部状态来源，负责 `draftContent`、恢复逻辑、保存动作与主反馈；不要在模板里散落新的 if/else 文案常量。
  - [x] 明确表达“当前是本地模式，不会同步到在线分享对象”，避免用户误以为当前编辑会更新 `/note/o/:sid`。
  - [x] 本故事收紧为“显式保存到本地”主动作：提供明确主按钮，例如“保存到本地”，不要在 1.6 引入自动保存或输入即持久化，以避免和在线模式的保存心智分叉。

- [x] Task 3: 把 `LocalNoteShell.vue` 从占位壳体推进为可编辑、本地恢复的主页面 (AC: 1, 2, 3)
  - [x] 保留当前页面的“内容主体为中心”结构，在 `LocalNoteShell.vue` 中接入本地模式专属对象信息区、正文输入区和主反馈区域。
  - [x] 优先复用现有 foundation 组件与视觉语言，例如 `SurfaceCard`、`TextInput`、`InlineFeedback`、`Button`、`StatusPill`；不要为本地模式新造一套平行业务 UI 容器。
  - [x] 页面顶部应清楚展示当前 `sid` 与“本地模式”语义，但不要伪装成可分享在线对象，也不要放入复制在线链接或远端状态文案。
  - [x] 在 `sid` 有效时，进入页面后应读取并展示当前本地最新内容；在 `sid` 无效时，继续保留清楚的异常提示，不要伪造本地 note id。
  - [x] 页面在移动端与桌面端都要维持可编辑正文、状态反馈和主操作的完整主路径，不要因为响应式拆解成语义不同的双流程。

- [x] Task 4: 实现本地恢复与重复进入体验，确保不污染在线链路 (AC: 1, 2)
  - [x] 当用户重新访问同一 `/note/l/:sid` 时，如果本地已有内容，应恢复最近一次成功写入的正文与相关状态。
  - [x] 切换到不同 `sid` 时，应重新按该 `sid` 的本地数据边界初始化，不得把前一个本地草稿串到新对象。
  - [x] 不得读取、覆盖或回填任何在线便签数据；即使相同 `sid` 在 `/note/o/:sid` 存在远端对象，本地模式也必须只看本地存储。
  - [x] 如需提示“本地便签不适合跨人分享”，应以轻量说明文案表达，不引入阻断式确认。

- [x] Task 5: 保持 Story 1.6 边界，避免提前吞并后续 epic 或在线模式能力 (AC: 1, 2, 3)
  - [x] 不在本故事实现登录、SSO 回跳、默认编辑权、编辑密钥、收藏、用户中心或删除；这些分别属于 Epic 2/3/4。
  - [x] 不把本地模式接成在线模式的离线草稿层，也不尝试做在线/本地双向同步。
  - [x] 不修改 `apps/api` 的任何读写语义，不新增“本地便签”服务端接口。
  - [x] 不改变首页“在线便签 / 本地便签”双入口的整体心智，只补齐本地模式进入后的真实可用体验。

- [x] Task 6: 为本地模式补齐测试与验收 (AC: 1, 2, 3)
  - [x] 前端测试至少覆盖：读取已有本地内容、首次写入本地内容、切换 `sid` 时按对象隔离恢复、`invalid-sid` 异常态、本地存储失败反馈。
  - [x] 页面/组件测试至少覆盖：本地模式明确显示为本地语义、不出现在线分享动作、移动端与桌面端主流程核心结构仍然存在。
  - [x] 若新增 `use-local-note.ts` 或存储工具，直接为这些模块补单测，覆盖恢复、写入、异常处理和跨 `sid` 隔离。
  - [x] 至少执行 `pnpm --filter @note/web test`、`pnpm --filter @note/web typecheck`、`pnpm --filter @note/web build`。

### Review Findings

- [x] [Review][Patch] 已保存状态在再次编辑后不会回退为未保存 [apps/web/src/features/local-note/local-note.ts:69]

## Dev Notes

### Story Intent

Story 1.6 的职责，是把首页已经暴露出来的“本地便签”入口从占位壳体推进成真正可用的轻量记录模式。它不是在线便签的降级版，也不是给后续登录链路做前置草稿缓存，而是一个明确不依赖远端账号、API 和数据库的独立模式，用来承接“我现在只想快速记一下”的场景。

这个故事最重要的 guardrail 不是“能写”，而是“写在正确的边界里”。用户进入 `/note/l/:sid` 时，应该得到一个和在线模式语言一致但数据边界完全独立的编辑体验：它可以恢复本地内容、继续修改、给出明确反馈，但绝不能误接到 `/note/o/:sid` 的远端链路，也不能让用户误解为当前内容已经变成可分享对象。

### Requirement Traceability

- FR8
- NFR1, NFR3, NFR14, NFR15, NFR16, NFR17, NFR20
- UX-DR3, UX-DR15, UX-DR16, UX-DR17, UX-DR18, UX-DR19, UX-DR20

### Cross-Story Context

- Story 1.1 已经把 `/note/l/:sid` 路由壳体建出来，因此 1.6 不需要重新设计路由语义，而是补齐该路由下的真实本地体验。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-1-app-shell-starter-template.md]
- Story 1.2 已经在首页建立“在线便签 / 本地便签”双入口，1.6 需要兑现其中“本地便签”入口的真实可用性。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-2-home-sid-entry-mode-selection.md]
- Story 1.3、1.4、1.5 已经稳定了在线模式的读取、保存、对象头部与分享反馈，因此 1.6 应刻意避免把这些在线语义复写到本地模式。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-3-read-online-note-by-sid.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-4-online-note-save-and-update.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md]
- Epic 2 之后才会接入登录、默认编辑权和编辑密钥，因此本地模式当前只需要表达“独立本地记录”，不要抢跑权限模型。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md]

### Previous Story Intelligence

- Story 1.5 刚刚强化了在线对象头部、复制链接和主路径反馈，这意味着 1.6 最容易犯的错是把“可分享对象”语言照搬到本地模式。当前故事应只复用页面节奏与反馈方式，不复用在线对象语义。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md]
- 近期实现已经把“状态文案收口到 adapter / composable，而不是堆在模板里”作为明确模式，因此 1.6 也应采用 `LocalNoteShell.vue` + `useLocalNote` + `local-note.ts` 的组合，而不是继续扩展单文件模板。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md]
- 最近提交 `903476d feat: finish story 1.5 note header feedback`、`37e8f4b fix story 1.4 review follow-ups`、`4a1f0a0 feat: 完成在线便签读取与保存链路` 说明当前实现主线已经稳定在“用 feature 内 composable + view model 收口页面状态”的方向，1.6 应沿用这个模式。 [Source: `git log --oneline -5` on 2026-04-04]

### Current Codebase Reality Check

- `apps/web/src/views/LocalNoteView.vue` 已经负责解析路由 `sid` 并把它传给 `LocalNoteShell`，因此本故事不需要改路由装配逻辑，优先在 `features/local-note` 内补齐能力。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/views/LocalNoteView.vue]
- `apps/web/src/features/local-note/components/LocalNoteShell.vue` 目前还是占位壳体，已经明确写出“后续 Story 1.6 会在此处接入本地存储、恢复与编辑体验”，这正是当前故事的主落点。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/local-note/components/LocalNoteShell.vue]
- 当前 `apps/web/src/features/local-note` 目录里只有一个壳体组件，还没有本地模式专属 composable、adapter 或 storage 实现；这意味着 1.6 需要先建立最小 feature 结构，再接入页面。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/local-note]
- 现有在线页 `OnlineNoteShell.vue` 已经证明当前项目偏好“对象信息区 + 反馈区 + 正文编辑区 + 主操作”这种页面节奏；本地模式可以复用这套页面节奏，但要替换成纯本地语义。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue]
- 当前测试目录已存在 `apps/web/tests/router.spec.ts` 与 `apps/web/tests/online-note.spec.ts`，说明页面壳体和 feature 层测试都已经有落点；1.6 应继续在 `apps/web/tests` 下为本地模式补测试，而不是只靠手测。 [Source: /Users/youranreus/Code/Projects/note/apps/web/tests/router.spec.ts] [Source: /Users/youranreus/Code/Projects/note/apps/web/tests/online-note.spec.ts]

### Technical Requirements

- 前端继续使用 `Vue 3 + TypeScript` 和现有基础 UI 组件，不要为本地存储引入新的状态库、表单库或离线同步库。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]
- 本地模式的数据读写只能通过浏览器本地存储完成，不得调用 Alova 远端请求、`note-methods.ts`、Fastify API 或 Prisma。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- `sid` 仍然是对象边界，但在本地模式中它只是本地对象键，不代表远端在线资源存在。任何文案都不能暗示当前对象可分享或可被他人查看。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md] [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- Pinia 只管理会话与 UI 状态，本地便签对象状态不要塞进全局 store；状态应留在 `features/local-note` composable 中。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 如果访问 `localStorage` 失败，必须提供带文字的可理解反馈；不能只靠颜色，也不能静默忽略失败。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- 本故事的保存交互收紧为显式主按钮保存，而不是自动保存；这样可以与当前在线模式的“编辑后主动保存”心智保持一致，减少用户混淆。 [Inference from Sources: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue, /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]

### Architecture Compliance Guardrails

- `views` 仍只做路由级容器，所有本地模式业务实现放在 `apps/web/src/features/local-note`，不要把逻辑塞回 `LocalNoteView.vue`。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- `features/note` 只负责在线便签，`features/local-note` 只负责本地便签；两者可以复用 UI 语言，但不能共用同一持久化实现或服务层。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- `components/ui` 不承载业务判断，因此本地模式的“是否已保存在本地”“本地恢复成功/失败”这类状态解析必须落在 `features/local-note`。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 不修改 `apps/api`，不新增“本地便签”后端接口，不把本地记录接入数据库。 [Source: /Users/youranreus/Code/Projects/note/docs/tech-solution.md]

### Library / Framework Requirements

- 当前前端测试栈是 `Vitest + Vue Test Utils + jsdom`，本故事的页面和 composable 测试应继续用这一套。 [Source: /Users/youranreus/Code/Projects/note/apps/web/tests/online-note.spec.ts]
- 本地持久化优先使用标准浏览器 `localStorage` API；若为测试可抽一个最小 `storage` 封装，但不要引入 `localforage`、IndexedDB wrapper 或离线同步插件。
- 页面反馈优先复用现有 `InlineFeedback`、`SurfaceCard`、`TextInput`、`Button` 等基础组件，不要引入新的全局通知框架。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue]
- 如果需要状态胶囊或对象信息展示，优先复用现有 `StatusPill` 与现有 note 页的对象区结构，而不是为本地模式单独造一套状态视觉组件。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/NoteObjectHeader.vue]

### UX Guidance

- UX 已明确首页是“单任务入口”，用户点击本地便签后应立即进入对应模式，不需要额外确认或复杂设置。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- 在线便签和本地便签必须语义清晰，但界面语言和入口结构不能割裂；因此本地模式可以保持与在线页相近的页面节奏，但需要清楚标明“本地模式”。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- 本地模式天然承担“无需远端即可快速记录”的补位作用，重点是低摩擦、可恢复、主路径完整，而不是分享或权限。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- 页面在移动端和桌面端都要保持正文、主反馈和主操作可达；不要因为屏宽变化把主按钮或状态信息移到需要额外猜测的位置。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]
- 所有状态提示都必须有文字表达，焦点态和错误态都应清楚可感知。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]

### Data and API Notes

- 本地模式的数据流应为：UI -> `features/local-note/storage` -> browser `localStorage`。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 远端在线模式的数据流应继续保留在：UI -> Alova/Axios -> API -> Service -> Prisma -> MySQL；Story 1.6 不应触碰这条链路。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 即使相同 `sid` 在在线模式存在，本地模式也不能读远端内容来预填；两种模式的共享仅限于“用户可理解的同类产品语言”，不包括数据互通。 [Inference from Sources: /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md, /Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md]

### File Structure Requirements

- 预计至少会修改：
  - `apps/web/src/features/local-note/components/LocalNoteShell.vue`
  - `apps/web/src/views/LocalNoteView.vue`
- 预计会新增：
  - `apps/web/src/features/local-note/use-local-note.ts`
  - `apps/web/src/features/local-note/local-note.ts`
  - `apps/web/src/features/local-note/storage/*`
  - `apps/web/tests/local-note.spec.ts`
  - `apps/web/tests/use-local-note.spec.ts`
- 一般不应修改：
  - `apps/api/**`
  - `apps/web/src/features/note/**`
  - `apps/web/src/stores/**`
  - `packages/shared-types/**`

### Testing Requirements

- 组件/页面测试至少覆盖：
  - 进入已有本地 `sid` 时恢复最近一次本地内容
  - 首次进入新 `sid` 时展示空白或初始草稿态，而不是读取远端内容
  - 本地模式页面明确显示“本地模式”且不出现在线分享动作
  - `invalid-sid` 时出现清楚异常提示
  - 本地存储失败时出现明确失败反馈
  - 页面主按钮语义明确为“保存到本地”，且不会在输入过程中隐式自动保存
- 状态/逻辑测试至少覆盖：
  - 同一 `sid` 的保存与再次读取一致
  - 切换到不同 `sid` 时状态按对象隔离
  - 本地恢复不会污染在线模式对象状态
  - 写入失败不会清空当前用户草稿
  - 本地存储 key 使用稳定命名空间，不与会话 token 或其他本地状态键冲突
- 至少执行：
  - `pnpm --filter @note/web test`
  - `pnpm --filter @note/web typecheck`
  - `pnpm --filter @note/web build`

### Git Intelligence Summary

- 最近几次提交都在沿着 Epic 1 主线推进在线体验，这使得 Story 1.6 成为一个天然的“平行补位”故事：补齐本地模式，但不要破坏已稳定的在线模式。 [Source: `git log --oneline -5` on 2026-04-04]
- 当前仓库中本地模式只有最小壳体，没有半成品存储实现，因此实现策略应是“最小新增局部模块 + 接入现有 UI 结构”，而不是重构已有在线 feature。 [Source: /Users/youranreus/Code/Projects/note/apps/web/src/features/local-note/components/LocalNoteShell.vue]

### Project Structure Notes

- 本项目约定规划类产物在 `_bmad-output/planning-artifacts/`，实施类产物在 `_bmad-output/implementation-artifacts/`；当前 story 文件只作为 dev 上下文，不反向修改 PRD/Architecture/UX 主文档。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]
- 项目上下文明确要求：优先使用 `pnpm`，规划/实现说明优先中文输出，真实代码与 `docs/` 冲突时先显式指出冲突再决定。 [Source: /Users/youranreus/Code/Projects/note/_bmad-output/project-context.md]

### References

- [epics.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/epics.md)
- [prd.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md)
- [architecture.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md)
- [ux-design-specification.md](/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md)
- [project-context.md](/Users/youranreus/Code/Projects/note/_bmad-output/project-context.md)
- [tech-solution.md](/Users/youranreus/Code/Projects/note/docs/tech-solution.md)
- [LocalNoteView.vue](/Users/youranreus/Code/Projects/note/apps/web/src/views/LocalNoteView.vue)
- [LocalNoteShell.vue](/Users/youranreus/Code/Projects/note/apps/web/src/features/local-note/components/LocalNoteShell.vue)
- [OnlineNoteShell.vue](/Users/youranreus/Code/Projects/note/apps/web/src/features/note/components/OnlineNoteShell.vue)
- [router.spec.ts](/Users/youranreus/Code/Projects/note/apps/web/tests/router.spec.ts)
- [online-note.spec.ts](/Users/youranreus/Code/Projects/note/apps/web/tests/online-note.spec.ts)
- [1-5-shareable-note-header-feedback.md](/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/1-5-shareable-note-header-feedback.md)

## Change Log

- 2026-04-04: 完成 Story 1.6，实现本地便签独立存储、显式保存、跨 sid 恢复与本地模式页面反馈，并补齐 web 测试、类型检查与构建验证。

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 已按 `create-story` workflow 自动解析当前 sprint 状态，选择第一条 backlog 故事 `1-6-local-note-standalone-mode` 作为本次创建目标。
- 已读取 `epics.md` 中 Story 1.6 的用户故事与验收标准，并补充 PRD、架构、UX 与项目上下文中的本地模式边界要求。
- 已检查当前代码库中的 `LocalNoteView.vue`、`LocalNoteShell.vue`、`OnlineNoteShell.vue` 与测试目录，确认本地模式目前仅有占位壳体，适合按 feature 内 composable + storage 模块增量实现。
- 已根据现有实现节奏和近期提交记录，为本故事补充“只在前端本地持久化、不触碰在线链路、不引入新依赖”的开发 guardrails。
- 已新增 `apps/web/src/features/local-note/storage/local-note-storage.ts`、`local-note.ts` 与 `use-local-note.ts`，把本地模式的命名空间存储、状态适配和页面状态机独立封装在 `features/local-note` 内。
- 已更新 `apps/web/src/features/local-note/components/LocalNoteShell.vue`，接入本地对象头部、显式“保存到本地”主动作、本地/在线边界说明和异常态反馈。
- 已新增 `apps/web/tests/local-note.spec.ts` 与 `apps/web/tests/use-local-note.spec.ts`，覆盖恢复已有本地内容、跨 sid 隔离、无效 sid、storage unavailable 与保存失败保留草稿等关键场景。
- 已执行 `pnpm --filter @note/web test`、`pnpm --filter @note/web typecheck`、`pnpm --filter @note/web build`，确认 Story 1.6 在测试、类型和构建层面全部通过。

### Completion Notes List

- 已为本地模式建立 `note:local:<sid>` 命名空间存储，确保本地便签与在线链路、会话 token 和其他 UI 本地状态隔离。
- 已实现 `useLocalNote` 页面状态机，支持按 sid 恢复本地正文、显式保存到本地、storage unavailable 失败反馈，以及跨 sid 切换不串草稿。
- 已把 `LocalNoteShell.vue` 从占位壳体推进为真实可编辑页面，并复用 `SurfaceCard`、`TextInput`、`InlineFeedback`、`Button`、`StatusPill` 保持 foundation 一致性。
- 已补齐本地模式页面与 composable 的关键测试，确认不会出现假在线语义、隐式自动保存或本地写入失败后丢草稿。

### File List

- `_bmad-output/implementation-artifacts/1-6-local-note-standalone-mode-validation-report.md`
- `_bmad-output/implementation-artifacts/1-6-local-note-standalone-mode.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/web/src/features/local-note/components/LocalNoteShell.vue`
- `apps/web/src/features/local-note/local-note.ts`
- `apps/web/src/features/local-note/storage/local-note-storage.ts`
- `apps/web/src/features/local-note/use-local-note.ts`
- `apps/web/tests/local-note.spec.ts`
- `apps/web/tests/use-local-note.spec.ts`
