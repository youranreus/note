---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
inputDocuments:
  - "/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/prd.md"
  - "/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/product-brief-note.md"
  - "/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/product-brief-note-distillate.md"
  - "/Users/youranreus/Code/Projects/note/_bmad-output/planning-artifacts/research/technical-note-frontend-backend-architecture-research-2026-04-01.md"
  - "/Users/youranreus/Code/Projects/note/_bmad-output/project-context.md"
  - "/Users/youranreus/Code/Projects/note/docs/tech-solution.md"
  - "/Users/youranreus/Code/Projects/note/docs/database-design.md"
  - "/Users/youranreus/Code/Projects/note/docs/note.pen"
workflowType: "architecture"
project_name: "note"
user_name: "Youranreus"
date: "2026-04-01"
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
`note` 的核心能力围绕固定 `sid` 的文本对象展开。系统需要支持访客和已登录用户创建便签、通过固定 `sid` 访问内容、在同一 `sid` 下持续更新、基于登录身份或编辑密钥控制编辑权限，并支持接收者查看、登录后收藏，以及创建者通过“我的创建 / 我的收藏”管理内容。删除被定义为不可恢复终态，因此生命周期管理也属于核心架构范围。

**Non-Functional Requirements:**
架构将主要受以下 NFR 驱动：分享主路径需要短链路和低等待感；固定 `sid` 链接必须稳定可访问；已保存内容必须可靠持久化；编辑密钥不得明文持久化；SSO 登录与回调链路必须稳定；前后端必须一致处理 `sid`、权限与收藏状态；在线与本地便签必须保持明确边界，不互相污染数据语义。

**Scale & Complexity:**
该项目不是高监管或高行业复杂度系统，但产品机制复杂度中等，因为它把匿名创建、登录创建、编辑密钥共享、公开查看、登录收藏、本地便签和在线便签同时纳入一个体验闭环。

- Primary domain: full-stack web application
- Complexity level: medium
- Estimated architectural components: 8-10 个核心组件/模块

### Technical Constraints & Dependencies

已知约束包括：前端固定选型为 Vue 3 + Tailwind CSS + alova.js + axios；后端固定选型为 Fastify；数据库为 MySQL + Prisma；SSO 集成为 `@reus-able/sso-utils`，但项目侧需要本地 facade 来补齐 `state`、多 baseURL、错误治理和前后端边界隔离；`notes.sid` 必须唯一；编辑密钥只能以安全形式持久化；删除为不可恢复；内容页 SEO 优先级低于首页 SEO。

### Cross-Cutting Concerns Identified

会影响多个模块的跨切关注点包括：身份认证与会话恢复、资源所有权判断、编辑密钥校验、固定 `sid` 路由与数据一致性、分享链接稳定性、收藏与个人资产视图同步、异常状态反馈、以及本地便签与在线便签两套存储模型的清晰隔离。

## Starter Template Evaluation

### Primary Technology Domain

full-stack web application based on project requirements analysis

### Starter Options Considered

本项目的前端与后端不适合采用单一“全栈重型 starter”统一初始化。更合适的方式是：

- 前端使用 Vite 官方 Vue TypeScript starter，确保 SPA、TypeScript、现代浏览器支持和轻量工程骨架；
- 后端使用最小 Fastify TypeScript 起步结构，再按项目需要接入 Prisma、MySQL、SSO facade 与插件体系；
- 整体通过 pnpm workspace 组织为 `apps/web`、`apps/api`、`packages/shared-types`。

### Selected Starter: Vite Vue TypeScript + Custom Fastify TypeScript Workspace Bootstrap

**Rationale for Selection:**
这个组合最符合 `note` 当前的技术偏好和架构目标。前端需要的是稳定、轻量、可控的 SPA 骨架，而不是带 SSR 或全栈约束的元框架；后端需要的是清晰的插件边界和业务分层，而不是被现成脚手架预设太多应用结构。该方案既保持实现自由度，又与当前 PRD、技术研究和项目上下文完全一致。

**Initialization Command:**

```bash
pnpm create vite apps/web --template vue-ts
```

后端建议使用自建最小骨架，在 `apps/api` 中初始化 TypeScript + Fastify，并随后接入 Prisma。

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
前端采用 TypeScript + Vue 3；后端采用 TypeScript + Node.js + Fastify。

**Styling Solution:**
前端在 Vite 基础上接入 Tailwind CSS 官方 Vite 插件方案。

**Build Tooling:**
前端由 Vite 提供开发与构建能力；后端由 TypeScript 编译和 Node.js 运行时支撑。

**Testing Framework:**
starter 本身不强绑定测试框架，适合后续按项目需要补入 Vitest、Cypress 和 Fastify inject 测试。

**Code Organization:**
以 pnpm workspace 为顶层组织，拆分为 `apps/web`、`apps/api`、`packages/shared-types`，符合当前项目文档中的目标结构。

**Development Experience:**
该方案保留快速启动、热更新、TypeScript 类型安全和最小脚手架复杂度，同时不给架构决策增加不必要约束。

**Note:** 项目初始化与 workspace 骨架搭建应作为第一个实现故事优先完成。

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- 单仓 `pnpm workspace` 结构
- 前后端分离的 SPA + API 架构
- Prisma + MySQL 的唯一 `sid` 数据模型
- SSO facade 的服务端收口方案
- 在线便签 / 本地便签双存储边界
- 编辑权限模型：登录创建者默认编辑权 + 编辑密钥共享编辑权

**Important Decisions (Shape Architecture):**

- 前端状态分层：Pinia 管会话/UI，Alova 管远端数据缓存
- Fastify 插件化组织和服务层边界
- REST API 边界与错误语义
- 删除不可恢复的一致性处理
- 收藏与“我的创建 / 我的收藏”的聚合方式

**Deferred Decisions (Post-MVP):**

- 更细粒度权限模型
- 高级检索与内容组织
- 分享后增强体验
- 更复杂的可观测性与平台化扩展

### Data Architecture

- **Primary datastore:** MySQL
- **ORM / access layer:** Prisma
- **Primary resource identity:** `notes.sid` 作为业务唯一键，`notes.id` 作为内部主键
- **Relation strategy:** 用户、便签、收藏全部通过内部主键关联
- **Password/key storage:** 编辑密钥只存安全摘要，不存明文
- **Deletion model:** 删除为不可恢复终态；若技术上采用软删除字段，也只能作为内部实现细节，产品语义仍是不可恢复
- **Caching strategy:** 不做复杂后端缓存作为首版前提，优先保证数据库模型和查询路径正确

### Authentication & Security

- **Authentication method:** SSO 登录，前端只负责跳转和回调承接，服务端负责 code exchange、userinfo 获取、会话建立
- **Authorization model:** 资源所有权 + 编辑密钥双轨制
- **Session strategy:** 服务端会话 / 安全 cookie 驱动，前端只持有会话状态感知
- **SSO integration approach:** `@reus-able/sso-utils` 不直接裸用，必须在 API 侧封装 `sso-facade`
- **Key validation:** 编辑密钥校验在服务端完成
- **Security middleware:** 请求级鉴权 hook、统一错误映射、输入校验

### API & Communication Patterns

- **API style:** REST
- **Core resource routes:** 围绕 `notes`、`favorites`、`me/session`、`auth/callback`
- **Validation approach:** Fastify schema 校验 + Prisma 约束双层保证
- **Error handling standard:** 统一错误语义，至少区分无权限、密钥错误、资源不存在、资源已删除、会话失效
- **Frontend-backend communication:** Axios transport + Alova request state/cache
- **Cross-module contract:** DTO 优先放到 `packages/shared-types`

### Frontend Architecture

- **Application model:** SPA
- **Routing:** Vue Router，明确区分 `/`、`/auth/callback`、`/note/o/:sid`、`/note/l/:sid`
- **State management:** Pinia 只管理 `auth` 与 UI 状态
- **Remote data management:** Alova 负责详情、列表、收藏状态和分页缓存
- **Component structure:** `views` + `features` + `components` 三层
- **Rendering priority:** 首先保证首页、分享查看页、编辑页和用户面板的主路径稳定
- **SEO strategy:** 首页基础 SEO，内容页不以搜索收录为目标

### Infrastructure & Deployment

- **Repository structure:** `apps/web`、`apps/api`、`packages/shared-types`
- **Environment management:** 根目录统一 `.env` 映射到各应用
- **Deployment shape:** Web 与 API 可独立部署，但共享同一业务域模型
- **CI baseline:** 至少支持 lint / typecheck / test / build
- **Observability baseline:** 请求日志、SSO 异常、保存失败、权限异常
- **Scaling posture:** 首版按单体前后端应用组织，优先保证清晰边界，暂不拆微服务

### Decision Impact Analysis

**Implementation Sequence:**

1. 建立 workspace 骨架
2. 落 Prisma schema 与数据库迁移
3. 落 Fastify 基础插件和 `sso-facade`
4. 落核心 notes/favorites/session API
5. 落 Vue SPA 路由与页面骨架
6. 接入 Alova/Pinia 与主路径缓存策略
7. 打通“创建 -> 分享 -> 查看 -> 收藏 -> 更新 -> 删除”闭环

**Cross-Component Dependencies:**

- `sid` 唯一模型会直接影响 API、路由、收藏、删除和分享链路
- SSO facade 会影响登录、我的创建、我的收藏和默认编辑权
- 编辑密钥模型会影响详情页、更新接口、错误语义和安全策略
- 在线/本地双模式边界会影响前端路由、存储策略和用户心智

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**  
当前至少有 6 类地方最容易出现 agent 冲突：

- 数据库/接口命名不一致
- 前后端 DTO 字段风格不一致
- 错误响应和状态码语义不一致
- 前端状态归属不一致
- 在线便签 / 本地便签边界被混写
- SSO / 权限逻辑在多个位置重复实现

### Naming Patterns

**Database Naming Conventions:**

- 表名统一使用 `snake_case` 复数形式：`users`、`notes`、`note_favorites`
- 列名统一使用 `snake_case`：`author_id`、`key_hash`、`created_at`
- 外键统一使用 `{resource}_id` 格式
- 索引统一使用有语义前缀：`idx_author_updated`、`idx_user_created`

**API Naming Conventions:**

- REST 路由统一使用资源复数：`/api/notes/:sid`、`/api/me/favorites`
- 路由参数统一使用 `:sid`、`:id` 这种 Vue Router / REST 常见形式
- 查询参数与请求体对外默认使用 `camelCase`
- 前端消费 API 时，不暴露数据库 `snake_case` 结构给 UI 层

**Code Naming Conventions:**

- Vue 组件文件使用 `PascalCase`，例如 `NoteEditor.vue`
- 普通 TypeScript 模块使用 `kebab-case` 或语义目录命名，例如 `sso-facade.ts`、`note-service.ts`
- 函数与变量统一使用 `camelCase`
- 类型、DTO、接口使用 `PascalCase`

### Structure Patterns

**Project Organization:**

- 前端按 `views / features / components / stores / services / router` 分层
- 后端按 `plugins / routes / services / schemas / infra` 分层
- 共享 DTO 和基础类型放在 `packages/shared-types`
- 测试优先与代码近邻或按应用边界组织，不跨模块散落

**File Structure Patterns:**

- 与 SSO 相关的三方适配逻辑只放在 `apps/api` 的 auth/plugin/facade 层
- 本地便签逻辑只存在前端本地模式模块，不与在线便签服务层混写
- 数据库 schema、迁移、Prisma client 统一收口在后端数据基础设施层
- 文档与规划产物继续集中在 `_bmad-output/planning-artifacts`

### Format Patterns

**API Response Formats:**

- 成功响应优先返回直接业务对象或列表，不引入不必要的深层包装
- 错误响应统一返回可判读结构，至少包含稳定的错误 code 和 message
- “无权限”“密钥错误”“资源不存在”“资源已删除”“会话失效”必须是可区分的错误语义
- 日期时间在 API 中统一使用 ISO 8601 字符串

**Data Exchange Formats:**

- 前后端业务字段统一使用 `camelCase`
- 数据库持久化字段使用 `snake_case`，通过 ORM 映射转换
- 布尔值统一使用原生 `true/false`
- 单资源返回对象，集合返回数组或分页对象，不做语义模糊的混合格式

### Communication Patterns

**State Management Patterns:**

- Pinia 只管理会话状态与 UI 状态
- Alova 管理远端数据请求、缓存、分页和失效
- 不允许同一份远端业务数据同时在 Pinia 和 Alova 中作为双真值源存在
- 收藏、详情、我的创建、我的收藏的刷新必须通过统一缓存失效策略完成

**Cross-Module Coordination:**

- 编辑权限判断统一在服务端完成，前端只做能力展示与提示
- `sid` 是资源访问标识，`id` 是内部实现标识，二者语义不得混用
- 登录创建者默认编辑权与编辑密钥共享编辑权必须共用同一套服务端权限入口
- 删除后的终态语义必须在前后端一致

### Process Patterns

**Error Handling Patterns:**

- 前端统一把“用户可见错误”和“开发/日志错误”分开处理
- 后端统一进行错误映射，不允许 route handler 各自返回随意错误格式
- 密钥错误、无权限、资源失效、会话失效必须有稳定处理分支
- 删除不可恢复语义要求删除前确认、删除后统一状态反馈

**Loading State Patterns:**

- 主路径页面必须有明确 loading / success / error 三态
- 不允许因长时间无反馈让用户误判操作失败
- 保存、收藏、删除等关键动作都需要有明确结果反馈
- SSO 回调页使用独立加载状态，不与普通页面混合处理

### Enforcement Guidelines

**All AI Agents MUST:**

- 遵守“数据库 `snake_case`、应用层 `camelCase`”的边界
- 遵守“Pinia 管会话/UI，Alova 管远端数据”的边界
- 遵守“SSO 与权限逻辑只在服务端收口”的边界
- 遵守“本地便签与在线便签数据模型不混写”的边界
- 遵守统一错误语义和响应结构

**Pattern Enforcement:**

- 新增模块时优先放入既有分层目录，不新增平行结构
- 新 API 必须对齐既有 REST 命名与错误结构
- 新状态逻辑必须先判断属于 Pinia 还是 Alova，而不是直接新增 store
- 出现模式冲突时，以架构文档规则为准，而不是以局部实现习惯为准

### Pattern Examples

**Good Examples:**

- API 返回 `favoriteCount`，数据库字段映射自 `favorite_count`
- 前端通过 Alova 拉取 `myFavorites`，Pinia 只保存 `currentUser`
- 服务端在同一个权限入口里判断“是否创建者”或“是否提供有效编辑密钥”

**Anti-Patterns:**

- 在前端直接持久化或校验编辑密钥
- 同时在 Pinia 和组件本地 state 中各保存一份在线便签详情
- 让本地便签和在线便签共用同一个未经区分的数据持久化逻辑
- 为不同接口返回不同形状的错误对象

## Project Structure & Boundaries

### Complete Project Directory Structure

```txt
note/
├── README.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env
├── .env.example
├── .gitignore
├── docker-compose.yml
├── docs/
│   ├── note.pen
│   ├── tech-solution.md
│   ├── database-design.md
│   └── bmad-workflow.md
├── _bmad-output/
│   └── planning-artifacts/
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── public/
│   │   └── src/
│   │       ├── main.ts
│   │       ├── App.vue
│   │       ├── app/
│   │       │   ├── providers/
│   │       │   └── styles/
│   │       ├── router/
│   │       │   └── index.ts
│   │       ├── views/
│   │       │   ├── HomeView.vue
│   │       │   ├── AuthCallbackView.vue
│   │       │   ├── OnlineNoteView.vue
│   │       │   └── LocalNoteView.vue
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   │   ├── api/
│   │       │   │   ├── components/
│   │       │   │   ├── stores/
│   │       │   │   └── utils/
│   │       │   ├── note/
│   │       │   │   ├── api/
│   │       │   │   ├── components/
│   │       │   │   ├── composables/
│   │       │   │   └── utils/
│   │       │   ├── local-note/
│   │       │   │   ├── storage/
│   │       │   │   ├── components/
│   │       │   │   └── composables/
│   │       │   ├── favorite/
│   │       │   │   ├── api/
│   │       │   │   └── components/
│   │       │   └── user-panel/
│   │       │       ├── api/
│   │       │       ├── components/
│   │       │       └── composables/
│   │       ├── components/
│   │       │   ├── ui/
│   │       │   └── layout/
│   │       ├── stores/
│   │       │   ├── authStore.ts
│   │       │   └── uiStore.ts
│   │       ├── services/
│   │       │   ├── http/
│   │       │   │   ├── axios.ts
│   │       │   │   └── alova.ts
│   │       │   └── cache/
│   │       ├── types/
│   │       └── utils/
│   └── api/
│       ├── package.json
│       ├── tsconfig.json
│       ├── Dockerfile
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.ts
│       │   ├── config/
│       │   ├── plugins/
│       │   │   ├── auth/
│       │   │   │   ├── index.ts
│       │   │   │   ├── sso-facade.ts
│       │   │   │   ├── session.ts
│       │   │   │   └── guards.ts
│       │   │   ├── prisma.ts
│       │   │   ├── cors.ts
│       │   │   ├── cookies.ts
│       │   │   ├── static-assets.ts
│       │   │   └── error-handler.ts
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── notes.ts
│       │   │   ├── favorites.ts
│       │   │   └── me.ts
│       │   ├── services/
│       │   │   ├── note-service.ts
│       │   │   ├── favorite-service.ts
│       │   │   ├── auth-service.ts
│       │   │   └── user-service.ts
│       │   ├── schemas/
│       │   │   ├── auth.ts
│       │   │   ├── notes.ts
│       │   │   ├── favorites.ts
│       │   │   └── me.ts
│       │   ├── infra/
│       │   │   ├── prisma/
│       │   │   │   ├── client.ts
│       │   │   │   └── mappers.ts
│       │   │   └── logger/
│       │   ├── repositories/
│       │   │   ├── note-repository.ts
│       │   │   ├── favorite-repository.ts
│       │   │   └── user-repository.ts
│       │   ├── types/
│       │   └── utils/
│       └── prisma/
│           ├── schema.prisma
│           └── migrations/
├── packages/
│   └── shared-types/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── auth.ts
│           ├── note.ts
│           ├── favorite.ts
│           ├── common.ts
│           └── index.ts
└── tests/
    ├── e2e/
    ├── api/
    └── fixtures/
```

### Architectural Boundaries

**API Boundaries:**

- `apps/api/routes/auth.ts` 只承接登录、回调、会话恢复入口
- `apps/api/routes/notes.ts` 只负责在线便签读写删和查看
- `apps/api/routes/favorites.ts` 只负责收藏/取消收藏
- `apps/api/routes/me.ts` 只负责“我的创建 / 我的收藏 / 当前会话”

**Component Boundaries:**

- `views` 负责路由级页面容器
- `features/note` 只负责在线便签
- `features/local-note` 只负责本地便签
- `features/user-panel` 只负责“我的创建 / 我的收藏”聚合面板
- `components/ui` 不承载业务判断

**Service Boundaries:**

- 路由层只做参数接收、schema 校验、响应返回
- 服务层只做业务逻辑、权限判断、事务编排
- repository/infra 只做数据访问和基础设施映射

**Data Boundaries:**

- 在线便签数据只进入 MySQL/Prisma
- 本地便签数据只存在浏览器本地存储
- 两者共用 UI 交互语言，但不共用同一持久化实现

### Requirements to Structure Mapping

**Feature Mapping:**

- 固定 `sid`、在线便签访问与更新：`apps/web/features/note` + `apps/api/routes/notes.ts`
- SSO 登录与默认编辑权：`apps/web/features/auth` + `apps/api/plugins/auth`
- 编辑密钥共享编辑：`apps/web/features/note` + `apps/api/services/note-service.ts`
- 收藏与我的收藏：`apps/web/features/favorite` / `user-panel` + `apps/api/routes/favorites.ts`
- 我的创建：`apps/web/features/user-panel` + `apps/api/routes/me.ts`
- 本地便签：`apps/web/features/local-note`
- 删除不可恢复：`apps/web/features/note` + `apps/api/services/note-service.ts`

**Cross-Cutting Concerns:**

- 会话恢复：`apps/api/plugins/auth/session.ts` + `apps/web/stores/authStore.ts`
- 错误映射：`apps/api/plugins/error-handler.ts` + 前端统一错误处理层
- DTO 契约：`packages/shared-types`

### Integration Points

**Internal Communication:**

- 前端 feature 通过 `services/http` 调用 API
- 前端远端数据只通过 Alova 管理
- 后端 route 调 service，service 调 repository / prisma
- 权限判断统一通过 auth plugin + service 层

**External Integrations:**

- SSO：`apps/api/plugins/auth/sso-facade.ts`
- MySQL：`apps/api/prisma/schema.prisma`
- 浏览器本地存储：`apps/web/features/local-note/storage`

**Data Flow:**

- 在线模式：UI -> Alova/Axios -> Fastify Route -> Service -> Prisma -> MySQL
- 本地模式：UI -> local-note storage -> browser localStorage
- 登录模式：UI -> callback page -> API auth route -> SSO facade -> session establish -> auth store refresh

### File Organization Patterns

**Configuration Files:**

- 根目录放共享环境与 workspace 配置
- 应用级配置放各自 `apps/web`、`apps/api`
- 数据库 schema 只放 `apps/api/prisma`

**Source Organization:**

- 先按应用边界拆，再按业务模块拆
- 不允许把在线和本地便签逻辑堆到同一 feature 内
- 不允许把 SSO 逻辑直接散落到 route handler 和前端页面中

**Test Organization:**

- `tests/e2e` 负责用户闭环
- `tests/api` 负责 API / service 集成验证
- fixture 集中管理

**Asset Organization:**

- 前端静态资源由 `apps/web` 构建生成
- 运行时静态产物由 `apps/api` 统一托管
- 文档/设计稿不混进应用源码目录

### Development Workflow Integration

**Development Server Structure:**

- 根目录统一 `pnpm dev`
- `web` / `api` 独立可启动，但共享环境同步策略

**Build Process Structure:**

- `apps/web` 在构建阶段先产出静态资源
- `apps/api` 在镜像构建阶段打包后端运行时代码并接收前端静态产物
- `shared-types` 先于应用构建

**Deployment Structure:**

- 前端与后端打包进同一个运行镜像
- 运行镜像由 `apps/api/Dockerfile` 负责构建
- Web 静态资源由 API 运行时统一托管
- MySQL 为外部依赖，通过外部环境变量传入配置，不内置在镜像中
- `docker-compose.yml` 可用于本地联调，但生产标准形态是“单镜像 + 外部 MySQL”
