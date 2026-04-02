# Story 1.1: 基于 starter template 建立可进入主流程的应用骨架

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 访客用户，
I want 应用提供可用的首页、在线便签页和本地便签页骨架，
so that 我可以从同一个产品入口进入不同便签流程而不会被工程未完成状态阻塞。

## Acceptance Criteria

1. 前端应基于 `Vite Vue TypeScript starter` 初始化，后端应以 `Fastify TypeScript` 最小骨架完成 `apps/api` 初始化。
2. 仓库中应存在 `apps/web`、`apps/api`、`packages/shared-types` 的基础结构，前端应提供 `/`、`/note/o/:sid`、`/note/l/:sid`、`/auth/callback` 的基础路由壳体。
3. 首页完成加载后，应显示统一的应用壳体、右上状态入口和主内容容器，且主内容容器在移动端和桌面端都保持可用的响应式宽度约束。
4. 应建立最小 design token 与 foundation 组件基础，至少覆盖输入框、按钮、模态框、分段 tab、列表项、状态提示、空态、加载态和基础容器样式的一致性。
5. 每个高频组件至少应具备 `default`、`focus`、`error`、`disabled` 四类状态定义，并在页面开发初期一并落地，而不是事后补齐。

## Tasks / Subtasks

- [x] Task 1: 校准 monorepo 骨架并修复当前工作区入口不一致问题 (AC: 1, 2)
  - [x] 新建 `pnpm-workspace.yaml`，明确包含 `apps/*` 与 `packages/*`。
  - [x] 为 `apps/web`、`apps/api`、`packages/shared-types` 创建最小 `package.json` 与 `tsconfig.json`，使根脚本可解析到真实 workspace 包。
  - [x] 处理当前根目录 `package.json` 与实际仓库结构的冲突：现有脚本引用了 `@note/web`、`@note/api`、`scripts/boot.mjs`、`scripts/sync-env.mjs`，但这些文件目前不存在，需在本故事中补齐或等价调整到可运行状态。
  - [x] 明确环境变量同步策略：根级 `.env` / `.env.example` 仍作为源头，前后端应用只消费同步后的配置，不新增分散且互相漂移的环境定义。
  - [x] 校准 SSO 回调环境约定，确保默认前端回调目标与 `/auth/callback` 路由壳体一致，而不是留下一半在根配置、一半在页面代码中的隐式耦合。
  - [x] 保留 `apps/server` 作为待迁移遗留目录，不要在本故事中直接删除或重命名未确认的用户资产；如果需要停用，只能通过文档或脚本隔离，而不是破坏性清理。

- [x] Task 2: 搭建 `apps/web` 的 Vue SPA 基础壳体 (AC: 1, 2, 3)
  - [x] 使用 Vite Vue TypeScript 方案初始化前端，而不是沿用当前 `apps/web/node_modules` 中残留的 React 依赖痕迹。
  - [x] Vue SFC 默认使用 Composition API 和 `<script setup lang=\"ts\">`，不要回退到 Options API，也不要把逻辑塞进超大的 view 文件。
  - [x] 接入 `vue-router`，建立 `/`、`/note/o/:sid`、`/note/l/:sid`、`/auth/callback` 四个路由壳体页面。
  - [x] 建立 `src/main.ts`、`App.vue`、`router/index.ts`、`views/*`、`components/layout/*`、`components/ui/*`、`app/styles/*` 的基础目录。
  - [x] 在应用壳体中预留右上 `AuthStatusPill` 占位和主内容容器，首页采用单列居中布局，宽度策略使用“百分比宽度 + 最大宽度”而不是固定像素。

- [x] Task 3: 建立前端 design token 与 foundation 组件最小层 (AC: 3, 4, 5)
  - [x] 通过 Tailwind CSS 建立最小 token 基线：颜色、排版、字号、圆角、边框、阴影、间距、状态色、动效时长。
  - [x] 先创建基础组件接口或最小实现：`Button`、`TextInput`、`Modal`、`SegmentedTabs`、`StatusPill`、`ListItem`、`InlineFeedback`、`LoadingCard`。
  - [x] 在组件实现阶段同步落地 `default`、`focus`、`error`、`disabled` 状态，不允许只实现默认态。
  - [x] 本故事的 foundation 组件以“可复用壳体 + 样式约束”优先，不提前实现收藏、权限、SSO 业务逻辑。

- [x] Task 4: 搭建 `apps/api` 的 Fastify TypeScript 最小骨架 (AC: 1, 2)
  - [x] 建立 `src/main.ts`、`src/app.ts`、`src/plugins/*`、`src/routes/*`、`src/services/*`、`src/schemas/*`、`src/infra/*` 的基础目录。
  - [x] 初始化最小 Fastify 启动链路与基础插件注册点，为后续 `auth`、`notes`、`favorites`、`me` 路由预留文件位置。
  - [x] 预留 `prisma/` 目录与基础文件位，不在本故事中提前实现完整业务 schema、SSO facade 或权限逻辑。
  - [x] 保持 API 边界命名对齐架构文档，但本故事只交付“可启动骨架”，不扩展到完整业务实现。

- [x] Task 5: 建立共享类型与开发流程基线 (AC: 1, 2, 4)
  - [x] 初始化 `packages/shared-types`，提供最小 barrel export，作为前后端共享 DTO 的落点。
  - [x] 确保根级 `dev`、`build`、`test` 至少能正确解析 workspace 包；如本故事尚未引入完整测试框架，也应保证脚本不会指向不存在的文件。
  - [x] 为后续 `axios` / `alova`、Pinia、Prisma 接入预留目录，但不在本故事中实现真实请求与数据流。

- [x] Task 6: 以 Story 1.2 之前置骨架的标准做验收 (AC: 2, 3, 4, 5)
  - [x] 验证首页、在线便签页、本地便签页、回调页都能渲染基础 shell，而不是空白页或 404。
  - [x] 验证首页壳体已包含右上状态入口占位、主内容容器、响应式宽度约束和基础语义结构。
  - [x] 验证 foundation 组件至少具备统一的视觉 token 和四种交互状态定义。
  - [x] 明确将 `sid` 自动生成、在线便签读取/保存、登录回跳恢复、收藏和删除等业务逻辑留给后续 stories，避免 Story 1.1 过度扩张。

### Review Findings

- [x] [Review][Patch] 回调地址归一化忽略应用 base path，`/auth/callback` 被硬编码为根路径 [scripts/sync-env.mjs:42]
- [x] [Review][Patch] `WEB_ORIGIN` 未做标准化，尾部斜杠会导致 CORS origin 不匹配 [apps/api/src/infra/config.ts:51]
- [x] [Review][Patch] `SegmentedTabs` 声明了 tab 语义但没有实现对应键盘交互，当前 ARIA 语义不完整 [apps/web/src/components/ui/SegmentedTabs.vue:1]
- [x] [Review][Patch] 空字符串环境变量会绕过默认值并破坏同步/启动 [scripts/sync-env.mjs:8]
- [x] [Review][Patch] 构建后的 API 会读取错误的 `.env` 相对路径 [apps/api/src/infra/config.ts:34]
- [x] [Review][Patch] `@note/shared-types` 缺少开发态预构建链路，后续 runtime export 会在干净工作树下断掉 [package.json:8]
- [x] [Review][Patch] `sid` 路由边界会把异常参数静默字符串化 [apps/web/src/router/sid.ts:1]
- [x] [Review][Patch] `VITE_BASE_URL` 没有同步进入 `apps/api/.env`，导致 API 侧回调路径在子路径部署下仍回落到根路径 [scripts/sync-env.mjs:170]
- [x] [Review][Patch] API `.env` 寻址没有真正回退到仓库根 `.env`，缺失包内 `.env` 时会静默使用默认值 [apps/api/src/infra/config.ts:54]
- [x] [Review][Patch] 包级 `dev` 缺少环境与 shared-types 预备步骤，直接在 package 内启动会跳过守卫 [apps/web/package.json:6]
- [x] [Review][Patch] 根级 `dev` 聚合脚本会重复触发 `prepare:types` 与 `sync:env`，已改为直接启动 workspace 包级 dev 命令以避免重复 pre-hook [package.json:15]
- [x] [Review][Patch] 明确配置了非法 origin 时应 fail fast，而不是静默回退到 localhost [scripts/sync-env.mjs:38]
- [x] [Review][Patch] 缺失 sid 的 `/note/o` 与 `/note/l` 路由现在会命中兜底壳体，而不是落成空白未匹配状态 [apps/web/src/router/index.ts:22]
- [x] [Review][Patch] `SegmentedTabs` 键盘切换会同步移动焦点，并在 model 无效时回退到首个可用选项 [apps/web/src/components/ui/SegmentedTabs.vue:1]

## Dev Notes

### Story Intent

这条 story 的目标不是交付业务功能，而是把仓库拉到“后续故事可以稳定落地”的状态。完成标准是：前后端工程骨架、路由壳体、基础组件层和 workspace 结构都建立起来，并且不会让后续故事继续在错误目录、错误技术栈或缺失脚手架的状态下推进。

### Cross-Story Context

- Epic 1 的后续故事会在这个骨架上继续推进：
  - Story 1.2 负责首页 `sid` 输入、自动生成和在线/本地模式入口。
  - Story 1.3 负责通过 `sid` 读取在线便签。
  - Story 1.4 负责在线便签首次保存与持续更新。
  - Story 1.5 负责对象头部状态与反馈。
  - Story 1.6 负责本地便签模式。
- 因此本故事必须优先保证“路由和组件壳体存在”，但不要提前实现远端数据流、权限或持久化逻辑。后续故事需要扩展的是 feature 层，而不是返工基础目录。

### Repository Reality Check

- 当前仓库根 `package.json` 已经声明了 `@note/web`、`@note/api` 的过滤脚本，但仓库中还没有对应 package 文件。
- 根目录缺少 `pnpm-workspace.yaml`，而架构文档把它视为 monorepo 基线。
- 当前 `apps/web` 目录没有源码文件，仅残留 `node_modules`；其中还出现 React 相关依赖痕迹，这与既定 Vue 3 方案冲突。
- 当前 `apps/server` 仅有遗留 `.env`，而目标结构要求的是 `apps/api`。本故事应把它视为待迁移遗留物，而不是新的实现落点。
- 根脚本引用的 `scripts/boot.mjs`、`scripts/sync-env.mjs` 当前不存在；若不在本故事内补齐或调整，`pnpm dev` / `pnpm test` 仍会处于坏状态。

### Technical Requirements

- 前端固定选型：`Vue 3 + TypeScript + Vite + Tailwind CSS + Vue Router`。
- Vue 组件默认采用 Composition API + `<script setup lang="ts">`；route view 只做组合面，不承载大段业务实现。
- 后端固定选型：`Fastify + TypeScript`。
- 仓库固定组织：`apps/web`、`apps/api`、`packages/shared-types`。
- 前端应用模型固定为 SPA，不引入 SSR/全栈元框架。
- 路由必须预留 `/`、`/auth/callback`、`/note/o/:sid`、`/note/l/:sid`。
- 共享 DTO 应落在 `packages/shared-types`，不要把跨端契约散落在前后端各自目录。
- 根级 `.env` / `.env.example` 是当前唯一可见环境配置基线；本故事要做的是把它们收口进新骨架，而不是再发明第二套配置入口。
- 本故事只交付骨架，不实现真实 `notes` / `favorites` / `me/session` API，也不实现 Prisma schema 细节。

### Architecture Compliance Guardrails

- 遵守 “Pinia 只管会话/UI，Alova 管远端数据” 的边界；即使本故事暂未引入真实请求，也应为该边界保留目录和初始化位置。
- 遵守 “数据库 `snake_case`、应用层 `camelCase`” 的后续规则，但本故事不需要实现实际数据库字段映射。
- 遵守 “SSO 与权限逻辑只在服务端收口” 的边界；前端页面只能做占位，不要在本故事里把 SSO 逻辑散到页面。
- 遵守 “本地便签与在线便签分模块” 的边界；即使当前只是壳体，也要在目录层先分出 `features/note` 与 `features/local-note`。

### Frontend Implementation Notes

- 采用 `views + features + components + stores + services + router` 分层。
- `views` 保持薄层，只负责拼装页面壳体；将后续可增长的 UI 区块留在 `components` / `features`。
- 首页保持单列中心化壳体，右上保留 `AuthStatusPill` 占位，避免引入后台式侧栏布局。
- Layout 宽度应采用移动优先方案，并使用最大宽度约束；不要用固定像素把首页壳体锁死。
- foundation 组件优先做“外观与状态一致性”，而不是复杂业务行为。
- 组件命名使用 `PascalCase`，普通 TypeScript 文件使用语义化 `kebab-case`。
- 若在本故事内加入类型检查，前端优先采用 `vue-tsc` 路径，而不是只依赖普通 `tsc` 假装覆盖 `.vue` 文件。

### Backend Implementation Notes

- `apps/api` 应按 `plugins / routes / services / schemas / infra` 分层。
- 为 `auth`、`notes`、`favorites`、`me` 预留路由与 schema 文件位，但只保留最小占位。
- SSO facade、Prisma、错误映射、会话恢复都属于后续故事/后续阶段，不要在 Story 1.1 中过早展开。
- 如果需要提供运行验证，可以保留健康检查或基础 `GET /health` 风格接口，但不要让占位接口冒充完成业务能力。
- 根级环境变量中的 Web/API origin 与 SSO 配置需要能被后端骨架消费，但本故事不要把真实密钥硬编码到源码或示例配置里。

### File Structure Requirements

- 目标目录优先对齐：
  - `apps/web/src/main.ts`
  - `apps/web/src/App.vue`
  - `apps/web/src/router/index.ts`
  - `apps/web/src/views/HomeView.vue`
  - `apps/web/src/views/AuthCallbackView.vue`
  - `apps/web/src/views/OnlineNoteView.vue`
  - `apps/web/src/views/LocalNoteView.vue`
  - `apps/web/src/components/ui/*`
  - `apps/web/src/components/layout/*`
  - `apps/web/src/app/styles/*`
  - `apps/api/src/main.ts`
  - `apps/api/src/app.ts`
  - `apps/api/src/plugins/*`
  - `apps/api/src/routes/*`
  - `apps/api/prisma/*`
  - `packages/shared-types/src/index.ts`
- 除非用户明确要求，不要删除遗留目录；优先通过新结构落位并为后续迁移保留空间。

### Testing Requirements

- 本故事的最低验证重点是“骨架可运行”，不是业务正确性。
- 至少覆盖：
  - workspace 脚本可解析，不再引用缺失文件；
  - 环境变量同步后，前端回调路由与 `SSO_REDIRECT` 配置不再相互打架；
  - 前端四个路由壳体可渲染；
  - 首页和基础组件在移动端/桌面端不出现明显布局断裂；
  - foundation 组件存在 `default`、`focus`、`error`、`disabled` 状态定义。
- 若本故事没有完整测试框架，可接受先以 `typecheck` / `build` / 最小 smoke test 验证为主，但不要把未来 CI 所需的 `lint / typecheck / test / build` 基线抛开不管。

### Scope Boundaries

- 不在本故事实现：
  - `sid` 自动生成逻辑；
  - 在线便签读取和保存；
  - 本地便签存储逻辑；
  - SSO 回跳恢复；
  - 收藏、我的创建、我的收藏；
  - 删除不可恢复语义；
  - Prisma 数据模型和数据库迁移细节。
- 这些能力分别由 Story 1.2 以后逐步承接；Story 1.1 的职责是“把正确的工程壳体搭起来”。

### Project Structure Notes

- 当前仓库真实状态与规划文档存在明显偏差：
  - 文档要求 `apps/api`，实际仍存在遗留 `apps/server`；
  - 文档要求 `pnpm-workspace.yaml`，当前仓库缺失；
  - 根脚本已按 workspace 组织编写，但基础包和脚本文件尚未落位。
- 实现时要以规划文档和项目上下文为准，而不是把当前空目录或遗留依赖当成正确基线。

### References

- Story 来源：`_bmad-output/planning-artifacts/epics.md` -> `Epic 1` / `Story 1.1`
- 后续故事边界：`_bmad-output/planning-artifacts/epics.md` -> `Story 1.2` 至 `Story 1.6`
- Web 产品要求：`_bmad-output/planning-artifacts/prd.md` -> `Web App Specific Requirements`
- 技术选型与 starter 决策：`_bmad-output/planning-artifacts/architecture.md` -> `Starter Template Evaluation`
- 前端/接口/部署边界：`_bmad-output/planning-artifacts/architecture.md` -> `Frontend Architecture` / `API & Communication Patterns` / `Infrastructure & Deployment`
- 目录结构与命名规则：`_bmad-output/planning-artifacts/architecture.md` -> `Implementation Patterns & Consistency Rules` / `Project Structure & Boundaries`
- 设计系统与基础组件：`_bmad-output/planning-artifacts/ux-design-specification.md` -> `Design System Foundation` / `Component Strategy`
- 响应式与无障碍基线：`_bmad-output/planning-artifacts/ux-design-specification.md` -> `Spacing & Layout Foundation` / `Responsive Design & Accessibility`
- 现有技术方案补充：`docs/tech-solution.md` -> `4. 前端技术方案` / `5. 后端技术方案` / `7. 目录与工程组织` / `8. 分阶段实施计划`
- 项目级 AI 规则：`_bmad-output/project-context.md` -> `技术栈与项目现状` / `关键实施规则`
- Vue 约束补充：`/Users/reuszeng/.agents/skills/vue-best-practices/SKILL.md`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `package.json` 当前脚本与缺失的 `pnpm-workspace.yaml`、`scripts/*.mjs` 之间存在坏链路。
- `apps/web` 当前无源码文件，`apps/server` 是遗留结构而非目标结构。
- 通过 `scripts/sync-env.mjs` 将根级 `.env` / `.env.example` 统一同步到 `apps/web/.env.local` 与 `apps/api/.env`，并强制收口到 `/auth/callback`。
- 根级验证已通过 `pnpm boot`、`pnpm build`、`pnpm test` 完整回归，Vue Router 壳体与 Fastify health/config smoke tests 均为绿色。

### Completion Notes List

- 已建立 `pnpm-workspace.yaml`、`apps/web`、`apps/api`、`packages/shared-types` 基础结构，并补齐根级 `scripts/boot.mjs`、`scripts/sync-env.mjs`。
- 已交付 Vue 3 + Vite + Tailwind + Vue Router 前端壳体，包含 `/`、`/note/o/:sid`、`/note/l/:sid`、`/auth/callback` 四个可渲染路由。
- 已交付最小 foundation 组件层与 design token：`Button`、`TextInput`、`Modal`、`SegmentedTabs`、`StatusPill`、`ListItem`、`InlineFeedback`、`LoadingCard`、`EmptyState`、`SurfaceCard`。
- 已交付 Fastify + TypeScript 最小 API 骨架，包含 `src/main.ts`、`src/app.ts`、`plugins`、`routes`、`services`、`schemas`、`infra`、`prisma/schema.prisma`。
- 已通过 `pnpm boot`、`pnpm --filter @note/web typecheck`、`pnpm --filter @note/api typecheck`、`pnpm build`、`pnpm test` 完成验收。
- 已明确将 `sid` 自动生成、在线读写、SSO 回跳恢复、收藏、删除与 Prisma 细节保留给后续 stories。
- 已处理 code review 中的配置与可访问性问题：base path 回调拼装、origin 标准化、空 env 值兜底、API `.env` 寻址、shared-types 开发链路、tab 键盘交互与 sid 路由边界。
- 已完成第二轮 code review 修复：`VITE_BASE_URL` 向 API 同步、逐层 `.env` 搜索、包级 `predev` 守卫、origin fail-fast、缺失 sid 兜底路由与 tabs 焦点修正。

### File List

- `.gitignore`
- `_bmad-output/implementation-artifacts/1-1-app-shell-starter-template.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/api/package.json`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.ts`
- `apps/api/src/infra/config.ts`
- `apps/api/src/main.ts`
- `apps/api/src/plugins/cookies.ts`
- `apps/api/src/plugins/cors.ts`
- `apps/api/src/routes/auth.ts`
- `apps/api/src/routes/favorites.ts`
- `apps/api/src/routes/health.ts`
- `apps/api/src/routes/me.ts`
- `apps/api/src/routes/notes.ts`
- `apps/api/src/schemas/health.ts`
- `apps/api/src/services/module-shell-service.ts`
- `apps/api/tests/app.spec.ts`
- `apps/api/tests/config.spec.ts`
- `apps/api/tsconfig.build.json`
- `apps/api/tsconfig.json`
- `apps/web/index.html`
- `apps/web/package.json`
- `apps/web/postcss.config.js`
- `apps/web/src/App.vue`
- `apps/web/src/app/shell.ts`
- `apps/web/src/app/styles/base.css`
- `apps/web/src/app/styles/index.css`
- `apps/web/src/app/styles/tokens.css`
- `apps/web/src/components/layout/AppShell.vue`
- `apps/web/src/components/layout/AuthStatusPill.vue`
- `apps/web/src/components/ui/Button.vue`
- `apps/web/src/components/ui/EmptyState.vue`
- `apps/web/src/components/ui/InlineFeedback.vue`
- `apps/web/src/components/ui/ListItem.vue`
- `apps/web/src/components/ui/LoadingCard.vue`
- `apps/web/src/components/ui/Modal.vue`
- `apps/web/src/components/ui/SegmentedTabs.vue`
- `apps/web/src/components/ui/StatusPill.vue`
- `apps/web/src/components/ui/SurfaceCard.vue`
- `apps/web/src/components/ui/TextInput.vue`
- `apps/web/src/components/ui/state-presets.ts`
- `apps/web/src/env.d.ts`
- `apps/web/src/features/auth/components/AuthCallbackCard.vue`
- `apps/web/src/features/home/FoundationShowcase.vue`
- `apps/web/src/features/local-note/components/LocalNoteShell.vue`
- `apps/web/src/features/note/components/OnlineNoteShell.vue`
- `apps/web/src/main.ts`
- `apps/web/src/router/index.ts`
- `apps/web/src/services/http-client.ts`
- `apps/web/src/stores/auth-store.ts`
- `apps/web/src/views/AuthCallbackView.vue`
- `apps/web/src/views/HomeView.vue`
- `apps/web/src/views/LocalNoteView.vue`
- `apps/web/src/views/OnlineNoteView.vue`
- `apps/web/tailwind.config.ts`
- `apps/web/tests/router.spec.ts`
- `apps/web/tests/ui-state.spec.ts`
- `apps/web/tsconfig.json`
- `apps/web/vite.config.ts`
- `packages/shared-types/package.json`
- `packages/shared-types/src/index.ts`
- `packages/shared-types/tsconfig.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `scripts/boot.mjs`
- `scripts/sync-env.mjs`

### Change Log

- 2026-04-02: 完成 Story 1.1 应用骨架实现，补齐 monorepo/workspace、Vue SPA 路由壳体、foundation 组件层、Fastify API 骨架、共享类型与根级 build/test 链路，并将故事状态推进到 `review`。
- 2026-04-02: 完成 Story 1.1 code review patch，修复环境同步、回调路径、CORS origin、shared-types 开发链路、SegmentedTabs 可访问性与 sid 参数边界，并将故事状态推进到 `done`。
- 2026-04-02: 完成 Story 1.1 第二轮 code review patch，修复 `VITE_BASE_URL` API 同步、`.env` 回退查找、包级 predev 守卫、origin fail-fast、缺失 sid 路由兜底与 tabs 焦点一致性。
