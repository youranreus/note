# Story 1.2: 首页 SID 入口与模式选择

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 访客用户，
I want 在首页输入或自动获得一个 `sid` 并选择在线或本地便签模式，
so that 我可以用最短路径进入我要使用的便签对象。

## Acceptance Criteria

1. 用户进入首页且输入框为空时，页面初始化完成后系统应自动准备一个可用的 `sid`，用户无需先手动输入 ID 也能继续主流程。
2. 用户希望进入已有便签时，在首页输入指定 `sid` 并选择在线便签，系统应导航到对应的在线便签路由，且该 `sid` 应作为后续读取与保存的唯一对象标识。
3. 用户希望快速记录但不使用远端存储时，在首页选择本地便签，系统应导航到对应的本地便签路由，且首页不应要求用户先登录或进入个人中心。
4. 首页存在主要操作按钮时，同屏只应存在一个当前主任务的 primary button 层级，输入区与两个入口按钮应构成清晰的单任务启动结构。

## Tasks / Subtasks

- [x] Task 1: 将首页从 foundation showcase 收口为真实入口壳体 (AC: 1, 3, 4)
  - [x] 用 `features/home` 下的业务组件替换 `HomeView` 当前的 `FoundationShowcase`，`views` 仍保持薄层。
  - [x] 基于 UX 规格实现 `EntryShell` 结构，至少包含 `idLabel`、`idInput`、`idHint`、`primaryEntryButton`、`secondaryEntryButton`。
  - [x] 复用 Story 1.1 已交付的 `AppShell`、`TextInput`、`Button`、`InlineFeedback`、`SurfaceCard`、`AuthStatusPill`，不要重新发明首页容器和基础控件。

- [x] Task 2: 实现首页 `sid` 草稿与自动生成逻辑 (AC: 1, 2, 3)
  - [x] 在首页初始化时准备一个可用的 `sid` 草稿；默认应让用户无需额外输入即可直接进入在线或本地主路径。
  - [x] 自动生成后的 `sid` 必须在首页输入区或紧邻说明区中明确可见，让用户在进入前就能感知“当前会进入哪个固定对象”，而不是只作为内部隐藏值存在。
  - [x] 若用户手动输入已有 `sid`，后续进入流程必须使用用户输入值而不是覆盖成系统生成值。
  - [x] 若用户清空输入后直接触发进入动作，提交前仍需兜底生成一个新 `sid`，避免空值阻塞。
  - [x] `sid` 生成规则与 [docs/tech-solution.md](/Users/reuszeng/Code/Projects/note/docs/tech-solution.md) 保持一致，默认生成 10 位标识；实现上优先使用浏览器 `crypto.getRandomValues()` 作为随机源，不要回退到 `Math.random()`。
  - [x] `sid` 输入采用宽松前端策略：仅做 `trim` 与空值处理，不在首页阶段引入过严格式校验或错误阻断。

- [x] Task 3: 实现在线/本地双入口导航 (AC: 2, 3, 4)
  - [x] 在线便签按钮作为首页唯一 primary CTA，使用当前输入值或自动生成的 `sid` 导航到 `/note/o/:sid`。
  - [x] 本地便签按钮作为 secondary CTA，使用当前输入值或自动生成的 `sid` 导航到 `/note/l/:sid`。
  - [x] 导航优先通过 Vue Router 路由名加 `params` 生成，不手写字符串拼接路径，避免编码与 base path 细节分散。
  - [x] 首页流程不接入登录前置校验，不弹出个人中心，不引入 SSO modal，不把资产管理能力前置到主路径。

- [x] Task 4: 补齐首页交互与可访问性细节 (AC: 1, 4)
  - [x] 首页主入口优先采用语义化 `<form>` 提交，使输入框内 `Enter` 自然触发默认主路径，即在线便签进入，而不是把关键进入逻辑分散成脆弱的裸 `keydown` 监听。
  - [x] 保持输入提示、自动生成说明和必要反馈可被文本与辅助技术读取，不只依赖颜色。
  - [x] 首页在移动端保持“输入区 + 两个入口按钮”的纵向单列结构，在桌面端只增强间距与宽度，不改成后台式多栏布局。
  - [x] 同屏不允许出现第二个与“在线便签”语义同级的 primary 按钮；如需要额外说明，使用 hint 或 info feedback，而不是新增强动作。

- [x] Task 5: 以可测试的纯逻辑拆分实现导航与 `sid` 生成 (AC: 1, 2, 3)
  - [x] 将 `sid` 归一化、兜底生成、目标路由决策等逻辑提取为可单测的函数或轻量 composable，避免把关键规则全塞进 `.vue` 模板事件中。
  - [x] 保持 Pinia 边界：不要把首页 `sid` 草稿或 note 对象状态塞进 `auth-store`，仅在本 feature 内局部管理。
  - [x] 如果需要满足 primary / secondary 视觉层级或表单提交语义，应优先在现有 `Button` / `TextInput` 基础上做非破坏性扩展，而不是新增一套首页专用按钮或输入控件。
  - [x] 不在本故事引入真实在线读取、保存、localStorage 持久化或 Alova 请求；这些分别留给 Story 1.3、1.4、1.6。

- [x] Task 6: 补齐最小测试与验收 (AC: 1, 2, 3, 4)
  - [x] 为 `sid` 自动生成与归一化逻辑增加 Vitest 覆盖，至少验证：空输入可兜底生成、用户输入会被保留、生成值满足 10 位约束。
  - [x] 为首页进入逻辑增加测试，至少验证：在线入口落到 `online-note`，本地入口落到 `local-note`，且参数使用最终 `sid`。
  - [x] 保持现有 `router.spec.ts` / `router-utils.spec.ts` 继续通过；新增测试不得破坏 Story 1.1 已建立的路由壳体与严格 `sid` 参数处理。
  - [x] 通过 `pnpm --filter @note/web test` 与 `pnpm --filter @note/web typecheck` 验证首页新入口逻辑可用。

### Review Findings

- [x] [Review][Patch] 已移除首页按钮的断点双列布局，入口区保持单列启动结构 [`apps/web/src/features/home/components/EntryShell.vue`]
- [x] [Review][Patch] 已将 `TextInput` 内层 `<input>` 改为合法的 `autocapitalize` 属性，并在首页传入禁用自动大写配置 [`apps/web/src/components/ui/TextInput.vue`]
- [x] [Review][Patch] 已补齐首页交互验收测试，覆盖可见 sid、清空后兜底和默认在线提交路径 [`apps/web/tests/home-entry.spec.ts`]

## Dev Notes

### Story Intent

本故事的职责是把首页从“基础组件展示页”推进到“真正可进入产品主路径的入口页”。实现完成后，用户应能在首页直接输入已有 `sid`，或在不输入的情况下由系统自动准备一个新 `sid`，随后用最短路径进入在线或本地模式。

### Requirement Traceability

- FR1, FR5, FR6, FR7, FR8
- NFR1, NFR4, NFR20
- UX-DR3, UX-DR4, UX-DR15, UX-DR16, UX-DR17, UX-DR19

### Cross-Story Context

- Story 1.3 会接管 `/note/o/:sid` 的真实读取，因此 1.2 只负责把正确的 `sid` 导到在线路由，不提前实现 API 读取。
- Story 1.4 会负责在线便签首次保存与持续更新，因此 1.2 不要提前在首页引入内容编辑或保存行为。
- Story 1.6 会负责本地便签真实存储，因此 1.2 只需要进入 `/note/l/:sid`，不要提前写 localStorage 持久化。
- Story 1.5 会负责对象头部与反馈，因此首页仅保留进入前的轻量说明，不要在首页模拟对象级状态栏。

### Previous Story Intelligence

- Story 1.1 已完成 `apps/web` 路由壳体、`AppShell`、`AuthStatusPill`、`TextInput`、`Button`、`InlineFeedback` 等基础能力；本故事应直接扩展这些能力，而不是再建第二套首页 UI。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/implementation-artifacts/1-1-app-shell-starter-template.md#Completion Notes List]
- Story 1.1 已把 `resolveSidParam` 收紧为“只接受单个非空字符串”，说明后续 story 不应把异常参数静默字符串化；1.2 也应延续“只在首页生成/归一化合法字符串”的模式。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/router/sid.ts]
- Story 1.1 的 review 已修复 `SegmentedTabs` 键盘行为与路由 base path 问题，因此本故事在交互与导航上应沿用键盘优先和路由封装思路，而不是再次直接拼接 URL。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/implementation-artifacts/1-1-app-shell-starter-template.md#Review Findings]

### Current Codebase Reality Check

- 当前 [HomeView.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/views/HomeView.vue) 仍然只渲染 `FoundationShowcase`，这正是 Story 1.2 需要替换的占位实现。
- 当前 `features/home` 目录只有 [FoundationShowcase.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/features/home/FoundationShowcase.vue)，后续真实首页能力应继续落在该 feature 下，而不是塞回 `views`。
- 当前路由已具备 `home`、`online-note`、`local-note` 三个核心 name，可直接用于导航。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/router/index.ts]

### Technical Requirements

- 前端继续使用 `Vue 3 + TypeScript + Vite + Vue Router + Tailwind CSS`，Vue SFC 继续采用 Composition API 与 `<script setup lang="ts">`。
- 首页 `sid` 草稿应作为 feature 局部状态或 composable 状态维护，不进入 Pinia 全局 store。
- 自动生成的 `sid` 需要对用户可见，因为产品价值是“先获得固定入口对象，再继续进入/分享”，不能只在提交瞬间于内部生成后立刻跳走。
- `sid` 输入仅做最小归一化：`trim`、空值兜底；不要在首页阶段引入复杂正则、后端预校验或“不可用 sid”错误流程。
- 与主路径无关的说明应使用 hint/info feedback，不把 placeholder 当作完整说明文案。
- 保留现有 `AuthStatusPill` 在右上角的位置，但不在本故事中接入打开个人中心或登录升级逻辑。
- 若为可测试性需要抽取工具函数，优先放在 `features/home` 邻近位置，而不是散落进全局 util 目录。
- 首页默认进入动作优先通过 `<form>` 提交语义承接，这样键盘 Enter、焦点顺序和可访问性都更稳定。

### Architecture Compliance Guardrails

- `views` 只做路由级拼装，首页行为与状态归 `features/home`。
- `components/ui` 只做可复用展示与交互基础，不承载“生成 sid”“决定去在线还是本地”等业务判断。
- 在线与本地模式的边界必须保持清晰：1.2 只做入口决策和路由跳转，不实现在线数据请求，也不实现本地持久化。
- Pinia 只管理 `auth` 与 UI 状态；不要把 note 详情、首页输入草稿或模式选择历史存进 `auth-store`。
- 首页是主路径，不允许为了说明、收藏、登录、个人资产等增强能力打断进入流程。

### Library / Framework Requirements

- 当前仓库前端依赖版本：`vue@^3.5.13`、`vue-router@^4.4.5`、`tailwindcss@^3.4.16`、`vitest@^2.1.8`。实现时不要无需求升级框架版本。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/package.json]
- 当前仓库已在基础输入组件中采用 `defineModel()`，首页新组件应遵循同一模式，而不是回退到旧式 `modelValue` + `emit` 样板。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/TextInput.vue]
- 当前 `Button` 组件只有交互状态，没有 primary / secondary 变体语义；如果 Story 1.2 需要体现主次按钮层级，优先对现有 `Button` 做小范围增强，避免首页自己拼一套新按钮体系。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/Button.vue] [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/state-presets.ts]
- Vue Router 官方文档建议优先使用路由名与 `params` 进行程序化导航，以获得自动 URL 编码；不要把 `params` 与手写 `path` 混用。 [External: https://router.vuejs.org/guide/essentials/navigation]
- Vue 官方文档说明从 Vue 3.4 开始，组件双向绑定的推荐写法是 `defineModel()`；当前仓库版本已满足该前提。 [External: https://vuejs.org/guide/components/v-model]
- MDN 说明 `crypto.getRandomValues()` 提供加密强度随机值，且可在不安全上下文中使用；结合本项目“10 位 sid”约束，合理实现是“用安全随机源生成短 sid”，而不是直接使用 36 字符 `randomUUID()`。这是基于外部资料与本地规格的推断。 [External: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues] [Source: /Users/reuszeng/Code/Projects/note/docs/tech-solution.md#4.3 页面交互关键点]
- Tailwind 官方文档强调其断点体系是 mobile-first；首页样式应以无前缀类构建移动端，再用 `md:` / `lg:` 增强，而不是反向从桌面回推。 [External: https://tailwindcss.com/docs/breakpoints]

### File Structure Requirements

- 预计至少会修改：
  - `apps/web/src/views/HomeView.vue`
  - `apps/web/src/features/home/FoundationShowcase.vue` 或以其为基础替换为真实入口壳体
  - `apps/web/src/router/index.ts`（仅当需要补充更稳定的 route helper，而不是改变现有路由结构）
  - `apps/web/tests/router.spec.ts`
  - `apps/web/tests/router-utils.spec.ts`
- 建议新增并优先放在以下位置：
  - `apps/web/src/features/home/components/EntryShell.vue`
  - `apps/web/src/features/home/use-entry-sid.ts` 或 `apps/web/src/features/home/entry-sid.ts`
  - `apps/web/tests/home-entry.spec.ts`
- 不应修改：
  - `apps/api/*` 业务路由与服务
  - `features/note` 的在线读取/保存逻辑
  - `features/local-note` 的真实本地存储逻辑
  - `packages/shared-types`，除非确实需要抽出首页共用类型且能证明跨端复用价值

### Testing Requirements

- 继续沿用现有 `Vitest` 方案，不为本故事引入额外测试框架，只为测试首页逻辑而新增沉重依赖。
- 优先把“`sid` 生成 / 归一化 / 目标路由选择”提取成纯逻辑，以便直接单测。
- 至少验证以下场景：
  - 初始空输入可得到可用的 10 位 `sid`
  - 自动生成后的 `sid` 会显示在输入区或等价可见区域，而不是仅存在于内部状态
  - 用户输入已有 `sid` 时会被保留
  - 清空输入后点击在线入口仍可得到新 `sid`
  - 在线入口进入 `online-note`
  - 本地入口进入 `local-note`
  - `Enter` 触发默认在线主路径
  - 在线入口不会误落到 `online-note-missing-sid`，本地入口不会误落到 `local-note-missing-sid`
- 手动验收时至少检查：
  - 首页在移动端仍是单列输入区 + 双按钮
  - 右上 `AuthStatusPill` 未被破坏
  - 同屏只有一个 primary CTA
  - 首页不出现登录前置阻断

### Git Intelligence Summary

- 最近提交显示仓库刚完成工作区脚本与前端骨架收口，当前阶段更适合在既有结构内推进 feature，而不是再次调整 workspace 或基础设施。 [Source: `git log --oneline -5` on 2026-04-02]
- 最近可见历史中已经存在一轮 API/Web/SSO 计划实现与一轮架构文档补齐，说明 Story 1.2 应优先把首页主链路落地，而不是再次回到大范围前后端方案讨论。 [Source: `git log --oneline -5` on 2026-04-02]

### Scope Boundaries

- 不在本故事实现真实在线便签读取。
- 不在本故事实现真实在线便签保存或更新。
- 不在本故事实现 localStorage 存储与恢复。
- 不在本故事实现登录、回跳恢复、个人中心或收藏。
- 不在本故事修改 `apps/api`、Prisma、数据库模型或 SSO facade。

### References

- [epics.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/epics.md)
- [prd.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/prd.md)
- [architecture.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md)
- [ux-design-specification.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md)
- [project-context.md](/Users/reuszeng/Code/Projects/note/_bmad-output/project-context.md)
- [tech-solution.md](/Users/reuszeng/Code/Projects/note/docs/tech-solution.md)
- [1-1-app-shell-starter-template.md](/Users/reuszeng/Code/Projects/note/_bmad-output/implementation-artifacts/1-1-app-shell-starter-template.md)
- [HomeView.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/views/HomeView.vue)
- [FoundationShowcase.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/features/home/FoundationShowcase.vue)
- [router/index.ts](/Users/reuszeng/Code/Projects/note/apps/web/src/router/index.ts)
- [router/sid.ts](/Users/reuszeng/Code/Projects/note/apps/web/src/router/sid.ts)
- [TextInput.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/TextInput.vue)
- [apps/web/package.json](/Users/reuszeng/Code/Projects/note/apps/web/package.json)

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 已完整读取 `sprint-status.yaml`，自动发现下一条 backlog story 为 `1-2-home-sid-entry-mode-selection`。
- 已抽取 `epics.md` 中 Epic 1 的 story 1.2 接受标准，并关联 PRD、架构、UX、project-context、Story 1.1 产物与当前前端代码骨架。
- 已检查当前首页实现仍为 foundation showcase，占位实现与 Story 1.2 目标一致形成直接替换关系。
- 已补充 Vue Router、Vue `defineModel`、Web Crypto 与 Tailwind mobile-first 的最新官方资料，用于减少后续 `DS` 阶段的实现歧义。
- 已新增 `apps/web/tests/home-entry.spec.ts` 并先行执行，确认在 `entry-sid.ts` 缺失时按预期失败。
- 已实现 `HomeEntry` / `EntryShell` / `entry-sid.ts`，并扩展 `Button` 与 `TextInput` 以承接首页表单提交语义和主次按钮层级。
- 已执行 `pnpm --filter @note/web typecheck`、`pnpm --filter @note/web test`、`pnpm --filter @note/web build`，结果全部通过。

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story 1.2 已根据当前 sprint 顺序从 backlog 提升到 ready-for-dev。
- 本 story 已显式补齐 requirement traceability、前一 story learnings、代码复用边界与测试策略，避免后续 `DS` 直接在首页重造组件或越界实现 1.3 / 1.4 / 1.6 的能力。
- 首页已从 foundation showcase 切换为真实入口页，支持可见的自动 `sid`、在线/本地双入口和语义化 `form` 提交。
- `sid` 生成与目标路由决策已抽成纯逻辑模块，新增测试覆盖生成长度、保留用户输入、空输入兜底和命名路由导航。
- 基础 UI 层已做非破坏性增强：`Button` 支持 primary / secondary 层级与提交类型，`TextInput` 支持首页所需输入属性，未引入新依赖。
- 全部相关前端验证已通过，Story 1.2 可进入 code review。

### File List

- `_bmad-output/implementation-artifacts/1-2-home-sid-entry-mode-selection.md`
- `apps/web/src/components/layout/AppShell.vue`
- `apps/web/src/components/ui/Button.vue`
- `apps/web/src/components/ui/TextInput.vue`
- `apps/web/src/components/ui/state-presets.ts`
- `apps/web/src/features/home/HomeEntry.vue`
- `apps/web/src/features/home/components/EntryShell.vue`
- `apps/web/src/features/home/entry-sid.ts`
- `apps/web/src/views/HomeView.vue`
- `apps/web/tests/home-entry.spec.ts`

### Change Log

- 用 `HomeEntry` 和 `EntryShell` 替换首页的 foundation showcase，占位页变为真实的 SID 入口页。
- 新增 `entry-sid.ts` 纯逻辑模块，收口 `sid` 归一化、自动生成和命名路由目标生成。
- 扩展 `Button`、`TextInput` 和 `AppShell`，让首页支持主次 CTA、语义化表单提交和更贴近产品的全局壳体文案。
- 新增 `home-entry.spec.ts`，并通过前端 `typecheck`、`test`、`build` 验证 Story 1.2 的实现结果。
