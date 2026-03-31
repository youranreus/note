---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - "/Users/youranreus/Code/Projects/note/docs/tech-solution.md"
  - "/Users/youranreus/Code/Projects/note/docs/database-design.md"
  - "/Users/youranreus/Code/Projects/note/docs/note.pen"
  - "/Users/youranreus/Code/Projects/note/package.json"
  - "/Users/youranreus/Code/Projects/note/.env.example"
  - "/Users/youranreus/Code/Projects/note/tsconfig.base.json"
  - "/Users/youranreus/Code/Projects/note/_bmad-output/project-context.md"
workflowType: "research"
lastStep: 6
research_type: "technical"
research_topic: "note 项目前后端架构"
research_goals: "结合当前 note 仓库现状与最新官方资料，评估并补充前端、后端、数据层、集成模式与实施路径，形成可指导重构落地的技术研究报告。"
user_name: "Youranreus"
date: "2026-04-01"
web_research_enabled: true
source_verification: true
status: "complete"
---

# Note 项目前后端架构技术研究报告

**Date:** 2026-04-01  
**Author:** Youranreus  
**Research Type:** technical

---

## Executive Summary

本次研究结论很明确：`note` 当前最适合沿着“`pnpm` 工作区 + Vue 3/Vite/Tailwind 前端 + Fastify/Prisma/MySQL 后端”的方向继续推进，而且这条路线与仓库里现有的脚本、环境变量、设计稿和技术方案文档是高度一致的。现阶段仓库还没有真正落地 `apps/web` 和 `apps/api` 代码，因此当前最重要的不是替换技术栈，而是把现有设计蓝图转换成一套低耦合、可增量实施的工程骨架。

从官方资料看，这套选型具备较好的相容性。Vue 官方仍把 Vite 作为 Vue 3 项目的一等公民工具链；Pinia 提供更适合 TypeScript 和调试体验的轻量全局状态方案；Vue Router 的导航守卫很适合承接 SSO 回跳与登录态恢复。后端侧，Fastify 仍然以插件化、封装和 Hook 生命周期为核心优势，适合把 SSO、用户、便签、收藏拆成边界清晰的模块；Prisma 对 MySQL、自增主键、唯一约束、复合主键、`upsert` 和 referential actions 都有成熟支持，正好对应 `note` 的 `sid` 唯一、收藏幂等和作者/收藏级联策略。

因此，本报告的核心建议不是“要不要换栈”，而是“如何把现有规划正确落地”：前端坚持请求缓存归 `alova`、全局会话归 Pinia；后端坚持 Fastify 插件边界和 JSON Schema 校验；数据库坚持以内部主键做关联、以 `sid` 做唯一业务键、以 `key_hash` 替代明文口令；实施上采用“先骨架、再主链路、再数据收敛”的分阶段迁移方式，优先打通首页、SSO 回跳、在线便签详情、我的创建/收藏四个关键闭环。

**Key Findings**

- 当前仓库是“方案主导型”项目，核心实现证据来自 `docs/` 与环境变量/工作区配置，而不是现成业务代码。
- 现有目标技术栈彼此兼容，且都能从官方文档中找到直接支撑当前设计蓝图的能力。
- 最大风险不在框架选择，而在于 SSO 集成验证、历史重复 `sid` 清洗、以及工作区骨架未落地前的边界失真。
- 数据层设计已经接近正确答案，后续重点应放在 Prisma schema、迁移顺序和 API 幂等语义的一致实现。

**Top Recommendations**

- 先落地 `apps/web`、`apps/api`、`packages/shared-types` 的最小工作区结构，再填业务代码。
- 用 Fastify 插件和 Hook 严格隔离 SSO、会话、路由、服务层，避免把认证逻辑散落在 handler 中。
- 用 Prisma 明确实现 `notes.sid @unique`、`note_favorites @@id([noteId, userId])`、`author onDelete: SetNull`、`favorite onDelete: Cascade`。
- 前端只把 `auth` 与 UI 弹层状态放进 Pinia，列表与详情缓存全部交给 `alova`。
- 在正式实现前先做一轮 SSO PoC，验证 `@reus-able/sso-utils` 与 Fastify `preHandler`/回调链路的适配。

## Table of Contents

1. 研究背景与方法
2. 当前项目现状判断
3. 技术栈分析
4. 集成模式分析
5. 架构模式与设计决策
6. 实施路径与工程化建议
7. 风险与缓解方案
8. 最终建议与下一步
9. 来源与验证说明

## 1. 研究背景与方法

### 1.1 研究背景

本次研究围绕 `note` 项目的前后端重构架构展开，目标不是做抽象技术比较，而是回答一个更具体的问题：基于当前仓库已有设计稿、技术方案和数据库方案，如何补齐一份“能指导实现落地”的技术研究结论。

### 1.2 研究方法

本研究采用“两层证据”方法：

- 本地证据：阅读 [tech-solution.md](/Users/youranreus/Code/Projects/note/docs/tech-solution.md)、[database-design.md](/Users/youranreus/Code/Projects/note/docs/database-design.md)、[note.pen](/Users/youranreus/Code/Projects/note/docs/note.pen)、[package.json](/Users/youranreus/Code/Projects/note/package.json)、[.env.example](/Users/youranreus/Code/Projects/note/.env.example)、[tsconfig.base.json](/Users/youranreus/Code/Projects/note/tsconfig.base.json) 与 [project-context.md](/Users/youranreus/Code/Projects/note/_bmad-output/project-context.md)。
- 网页证据：优先使用官方文档验证 Vue、Vite、Pinia、Vue Router、Tailwind CSS、Fastify、Axios、Alova、Prisma、MySQL 的最新能力与限制。

### 1.3 研究边界

- 报告聚焦当前选型能否支撑 `note` 的目标架构，不做“全栈重新选型”。
- `@reus-able/sso-utils` 没有可验证的公开官方文档，本报告只基于当前仓库中的使用意图推断其接入位置，不对其内部行为做未经验证的断言。
- 由于仓库中尚无 `apps/web` / `apps/api` 实际源码，所有“现状判断”都要区分“已实现”与“目标架构”。

## 2. 当前项目现状判断

### 2.1 仓库状态

从根目录 [package.json](/Users/youranreus/Code/Projects/note/package.json) 可以确认，仓库已经按工作区思路预留了 `@note/web` 与 `@note/api` 的脚本入口，但实际目录尚未落地。这意味着当前项目处在“架构蓝图已明确，工程骨架待实现”的阶段。

### 2.2 已确定的架构方向

从 [tech-solution.md](/Users/youranreus/Code/Projects/note/docs/tech-solution.md) 与 [project-context.md](/Users/youranreus/Code/Projects/note/_bmad-output/project-context.md) 可以确认：

- 前端目标栈：`Vue 3 + Tailwind CSS + alova.js + axios`
- 后端目标栈：`Fastify + @reus-able/sso-utils`
- 数据层：`MySQL + Prisma`
- 工程组织目标：`apps/web`、`apps/api`、`packages/shared-types`

### 2.3 架构问题不是“技术错了”，而是“边界还没落地”

目前最大的技术问题不是框架本身，而是三类工程空档：

- 工作区目录未落地，导致文档中定义的分层尚无法被代码约束。
- SSO 真实对接方式尚未通过 PoC 证明。
- 数据库迁移和唯一性约束虽已在文档中明确，但还没有映射到 Prisma schema 和迁移脚本。

## 3. 技术栈分析

## 3.1 前端：Vue 3 + Vite + Vue Router + Pinia + Tailwind CSS

Vue 官方在 Tooling 指南中继续把 Vite 作为 Vue 3 的核心开发工具链，并明确提到 Vue + Vite 是推荐起步方式；同时官方建议使用 `vue-tsc`、Vitest、Cypress 等围绕 Vite 的工具生态，这与 `note` 目前基于 TypeScript 严格模式的方向一致。来源：[Vue Tooling](https://vuejs.org/guide/scaling-up/tooling)、[Vite Why](https://vite.dev/guide/why.html)。

对 `note` 来说，选择 Vue 3 + Vite 的价值主要体现在三点：

- 与现有设计稿驱动的页面拆分方式天然匹配，适合把首页、SSO 回调页、便签详情页和用户面板拆成独立视图与 feature 模块。
- Vite 的 `import.meta.env` 与 `.env.[mode]` 机制能很好承接当前 [`.env.example`](/Users/youranreus/Code/Projects/note/.env.example) 里的 `VITE_API_BASE_URL`、`VITE_SSO_URL`、`VITE_SSO_REDIRECT` 等变量。来源：[Vite Env Variables and Modes](https://vite.dev/guide/env-and-mode)。
- 现有 `tsconfig.base.json` 使用 `ES2022 + NodeNext + strict`，与现代 Vue 3/TypeScript 开发兼容良好。

Vue Router 官方的导航守卫能力非常适合 `note` 的登录链路。`router.beforeEach` / `beforeResolve` 可以用于：

- 进入需要登录的面板或收藏相关页面前检查会话；
- 在 `/auth/callback` 回跳时控制重定向和异常处理；
- 避免未登录访问受保护动作时出现无限跳转。  
来源：[Vue Router Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html)。

Pinia 官方强调其对 TypeScript、Devtools、HMR 和 SSR 的支持，并将 store 明确组织为 `state / getters / actions`。这与当前项目上下文里“仅把会话和 UI 状态放进 store”的原则是吻合的：`authStore` 和 `uiStore` 可以保持轻量，业务列表不应进入全局 store。来源：[Pinia Introduction](https://pinia.vuejs.org/introduction.html)、[Pinia Core Concepts](https://pinia.vuejs.org/core-concepts/)、[Pinia Actions](https://pinia.vuejs.org/core-concepts/actions.html)。

Tailwind CSS 官方当前对 Vite 的推荐方式是通过 `@tailwindcss/vite` 插件接入，并强调其“扫描模板生成静态 CSS、零运行时”的模式。对 `note` 来说，这很适合承接设计稿里高度明确的布局、状态和表单视觉，而不会引入运行时样式系统复杂度。来源：[Tailwind CSS with Vite](https://tailwindcss.com/docs/installation/using-vite)。

### 3.2 请求层：Axios + Alova

Axios 官方文档明确支持 request/response interceptors，也支持对自定义实例单独挂载拦截器。这正好适合 `note` 的需求：

- 在 request interceptor 中统一注入 Bearer token 或 Cookie 相关头；
- 在 response interceptor 中集中处理 401、口令校验失败、SSO 失效等错误；
- 保持 API 层对业务组件透明。  
来源：[Axios Interceptors](https://axios-http.com/docs/interceptors)。

Alova 官方文档说明其支持响应缓存、多级缓存和 `usePagination`，并提到分页预加载依赖缓存能力。对 `note` 来说，`我的创建` / `我的收藏` 两个分页列表交给 `usePagination` 非常契合；详情页和列表失效可以围绕缓存操作 API 统一处理。来源：[Alova Response Cache Details](https://alova.js.org/tutorial/cache/)、[Alova usePagination](https://alova.js.org/v2/tutorial/strategy/usePagination/)。

因此，当前文档中“Axios 负责 transport，Alova 负责状态与缓存”的分工是合理的，不建议把它们重新混成一个更重的状态层。

### 3.3 后端：Fastify

Fastify 官方文档持续强调两件核心能力：插件化与封装（encapsulation）。`register()` 默认创建新作用域，hooks、decorators 和 plugins 会形成有继承关系但可隔离的上下文图。对 `note` 这样的中小型业务后端来说，这意味着：

- `plugins/auth` 可以只暴露认证后的用户上下文；
- `routes/notes`、`routes/favorites`、`routes/users` 可以独立注册；
- 后续即便拆分服务，也能保留相似的模块边界。  
来源：[Fastify Plugins Guide](https://fastify.dev/docs/latest/Guides/Plugins-Guide/)、[Fastify Plugins](https://fastify.dev/docs/v5.3.x/Reference/Plugins/)、[Fastify Encapsulation](https://fastify.dev/docs/v5.7.x/Reference/Encapsulation/)。

Fastify 的 Hook 生命周期也与 SSO 鉴权和请求审计高度匹配。官方文档列出 `onRequest`、`preValidation`、`preHandler`、`onResponse` 等标准阶段，其中 `preHandler` 很适合做“已解析出会话后的业务前置鉴权”，`onResponse` 适合做日志和统计。来源：[Fastify Hooks](https://fastify.dev/docs/latest/Reference/Hooks/)、[Fastify Lifecycle](https://fastify.dev/docs/v5.7.x/Reference/Lifecycle/)。

另外，Fastify 官方推荐基于 schema 的验证与序列化，内部使用高性能编译函数。这支持 `note` 在每条 REST 路由上显式声明参数和响应结构，减少前后端契约漂移。来源：[Fastify Validation and Serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)。

### 3.4 数据层：Prisma + MySQL

Prisma 官方文档确认其对 MySQL 的一等支持，且能直接对接标准 `mysql://` 连接串，这与当前环境变量中的 `DATABASE_URL` 约定一致。来源：[Prisma MySQL Connector](https://docs.prisma.io/docs/orm/core-concepts/supported-databases/mysql)、[Prisma Supported Databases](https://docs.prisma.io/docs/orm/reference/supported-databases)。

对 `note` 当前设计最关键的几个数据能力，Prisma 都能直接支撑：

- `upsert()`：适合按唯一 `sid` 做“存在即更新，不存在即创建”的语义。来源：[Prisma CRUD / upsert](https://docs.prisma.io/docs/orm/prisma-client/queries/crud)。
- 复合主键 `@@id([noteId, userId])`：适合 `note_favorites` 的幂等收藏关系。来源：[Prisma Compound IDs](https://docs.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints)。
- Referential actions：适合把 `notes.author_id` 设计为 `SetNull`，把收藏关系设计为 `Cascade`。来源：[Prisma Referential Actions](https://docs.prisma.io/docs/v6/orm/prisma-schema/data-model/relations/referential-actions)。

MySQL 官方文档也明确支持 `RESTRICT`、`CASCADE`、`SET NULL`、`NO ACTION` 等 referential actions，并要求外键列具备索引。这与文档中为 `notes.author_id`、`note_favorites.user_id/note_id` 增加索引和约束的设计方向一致。来源：[MySQL FOREIGN KEY Constraints](https://dev.mysql.com/doc/en/constraint-foreign-key.html)、[MySQL CREATE TABLE FOREIGN KEY Constraints](https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html)。

## 4. 集成模式分析

## 4.1 前后端 API 边界

当前 `docs/tech-solution.md` 中的 REST 边界是合理的，尤其适合当前业务规模：

- `GET /api/notes/:sid`
- `PUT /api/notes/:sid`
- `DELETE /api/notes/:sid`
- `GET /api/me/notes`
- `GET /api/me/favorites`
- `POST /api/notes/:id/favorite`
- `DELETE /api/notes/:id/favorite`

这套接口的优点是：

- 与前端路由和页面模型一一对应，降低“后端接口模型”与“页面任务模型”的转换成本。
- 有利于 Alova 做基于 URL 和参数的缓存失效。
- 对 Fastify 的 schema 校验和 Prisma 的唯一查询方式都比较友好。

### 4.2 SSO 与会话恢复

结合当前 [`.env.example`](/Users/youranreus/Code/Projects/note/.env.example) 可见，项目计划同时支持真实 SSO 和本地 mock 登录。架构上更合理的做法是：

- 前端只负责发起登录跳转与承接 `/auth/callback`；
- 后端负责票据交换、会话落地、Cookie 写入和用户 `upsert`；
- 前端回到首页后仅调用一次 `me/session` 或等价接口恢复用户态。

在 Fastify 中，这意味着：

- `plugins/auth` 内部完成 SSO 校验和 `request.user` 注入；
- 公开路由与受保护路由通过 `preHandler` 区分；
- 不把 SSO SDK 逻辑直接散落在每个 route handler 中。

### 4.3 前端状态与缓存边界

当前方案里“Pinia 管会话和 UI，Alova 管请求与缓存”的边界应保持不动。理由是：

- `authStore` 更像客户端 session 容器，而不是业务真值源；
- `我的创建`、`我的收藏`、便签详情都有天然远端真值；
- 把列表放进 store 容易造成双写、失效困难和组件间时序问题。

建议的缓存失效策略：

- `PUT /api/notes/:sid` 成功后失效该详情缓存和“我的创建”第一页缓存；
- 收藏/取消收藏后失效详情缓存、“我的收藏”列表缓存和可能的局部派生状态；
- 删除后失效详情和两个列表缓存，并在 UI 侧做跳转。

## 5. 架构模式与设计决策

## 5.1 推荐目标结构

建议严格按文档中的分层落地为：

```txt
apps/
  web/
    src/
      app/
      views/
      features/
      components/
      stores/
      services/
      router/
  api/
    src/
      app/
      plugins/
      routes/
      services/
      schemas/
      infra/
packages/
  shared-types/
```

这个结构背后的关键目的不是“好看”，而是让边界天然对应：

- `views` 对应页面和路由级容器
- `features` 对应业务模块
- `routes` 对应 HTTP 边界
- `services` 对应业务逻辑
- `infra` 对应 Prisma、日志、配置

## 5.2 前端架构建议

### 5.2.1 页面层

首批页面只需要四个：

- `/` 首页
- `/auth/callback`
- `/note/o/:sid`
- `/note/l/:sid`

“用户信息面板”保持为全局弹层，不单独建路由。这样可以保持记录流最短，不会因为进入资产管理就丢掉当前上下文。

### 5.2.2 Feature 切分

建议拆为：

- `features/auth`
- `features/note`
- `features/favorite`
- `features/user-panel`

其中：

- `auth` 负责登录跳转、会话恢复、回调页逻辑
- `note` 负责详情读写、ID 初始化、口令输入
- `favorite` 负责收藏状态与收藏列表
- `user-panel` 负责“我的创建 / 我的收藏”弹层

### 5.2.3 类型与 API 契约

建议把 DTO 放到 `packages/shared-types`，供 `web` 和 `api` 共用：

- `NoteDetailDto`
- `UserSummaryDto`
- `FavoriteListItemDto`
- `PagedResponse<T>`
- `AuthSessionDto`

这样做可以降低前后端文档和实现的偏差，尤其适合当前“文档先于代码”的项目状态。

## 5.3 后端架构建议

### 5.3.1 插件化组织

建议的 Fastify 插件顺序：

1. 配置与环境加载
2. 基础插件：cookie、cors、日志、错误处理
3. 基础设施插件：Prisma、SSO facade
4. 鉴权插件：会话恢复、`request.user` 注入
5. 业务路由插件：users / notes / favorites

这与 Fastify 官方建议的“plugins -> decorators -> hooks -> services”顺序一致。来源：[Fastify Getting Started](https://fastify.dev/docs/latest/Guides/Getting-Started/)。

### 5.3.2 Route + Service 边界

每个 route 文件只负责：

- schema
- 参数解析
- 调用 service
- 统一错误映射

每个 service 负责：

- Prisma 查询
- 事务
- 权限/所有权判断
- 幂等逻辑

这样可以避免未来在 handler 里出现数据库与业务逻辑混写。

## 5.4 数据架构建议

### 5.4.1 必须坚持的模型约束

结合本地文档与官方数据库能力，以下约束应视为不可退让：

- `notes.sid` 必须唯一
- 口令只能存 `key_hash`
- 用户内部关联必须基于 `users.id`
- 收藏关系必须是显式 join table
- 收藏表必须使用复合主键或等价复合唯一键

### 5.4.2 推荐 Prisma 关系策略

- `Note.authorId -> User.id` 设为可空，`onDelete: SetNull`
- `NoteFavorite.noteId -> Note.id` 设为 `onDelete: Cascade`
- `NoteFavorite.userId -> User.id` 设为 `onDelete: Cascade`

这与 `note` 的业务语义一致：

- 删除用户后不必删除便签本体，但作者归属可清空
- 删除便签或用户时，收藏关系应自动回收

## 6. 实施路径与工程化建议

## 6.1 推荐分阶段实施

### Phase 0：PoC 与骨架

- 初始化 `apps/web`、`apps/api`、`packages/shared-types`
- 建立最小 Vite + Vue + Tailwind 工程
- 建立最小 Fastify + Prisma 工程
- 验证 `@reus-able/sso-utils` 的真实接入链路

### Phase 1：主链路打通

- 首页
- `/auth/callback`
- 在线便签详情读写
- 用户会话恢复

### Phase 2：资产管理

- 我的创建分页
- 我的收藏分页
- 收藏/取消收藏
- 用户信息面板

### Phase 3：数据收敛与质量

- Prisma migration
- 重复 `sid` 清洗
- 口令哈希迁移
- E2E 与核心 API 测试

## 6.2 测试建议

前端建议：

- 单元/组件测试：Vitest
- 关键交互和主链路：Cypress

后端建议：

- 路由契约测试：Fastify inject
- Service 层事务测试：Prisma + 测试数据库
- 鉴权链路测试：mock ticket + 真实 ticket 双模式

## 6.3 可观测性建议

建议从一开始就落下三个最小可观测性点：

- 请求日志：包含路由、用户 ID、耗时、状态码
- 关键业务事件：创建便签、收藏、删除、SSO 回调失败
- 数据异常告警：重复 `sid`、外键错误、口令校验异常

## 7. 风险与缓解方案

## 7.1 SSO 集成风险

风险：

- `@reus-able/sso-utils` 行为细节未知
- 真实 IdP 的 token/userinfo 接口与本地 mock 可能不一致

缓解：

- 先做 PoC，不要等全部代码写完再验证
- 在 `plugins/auth` 外面包一层 facade，屏蔽三方差异

## 7.2 数据一致性风险

风险：

- 历史表可能存在重复 `sid`
- 删除与收藏关系若未按外键策略实现，容易出现脏数据

缓解：

- 上线前做 `sid` 去重脚本
- 迁移前先引入显式索引与外键检查

## 7.3 前端状态失控风险

风险：

- 若把列表、详情、会话混放进 Pinia，会很快形成双真值源

缓解：

- 坚持“远端数据由 Alova，客户端会话由 Pinia”
- 缓存失效点写成统一工具函数

## 7.4 工程边界漂移风险

风险：

- 在缺少真实目录结构的早期阶段，业务逻辑容易全部堆进单文件

缓解：

- 先建目录再写业务
- 让文件位置本身约束职责

## 8. 最终建议与下一步

## 8.1 最终判断

`note` 当前的目标架构是正确的，且不需要换栈。真正需要补的是“从设计方案到工程实现”的中间层：目录骨架、SSO PoC、Prisma schema、共享 DTO、缓存边界和测试主链路。

## 8.2 建议的立即行动

1. 创建 `apps/web`、`apps/api`、`packages/shared-types` 基础目录。
2. 落一版最小 `Fastify + Prisma + MySQL` 与 `Vue + Vite + Tailwind` 可运行样板。
3. 做 SSO PoC，验证真实回调和本地 mock 两种模式。
4. 先实现在线便签主链路，再补个人面板与收藏。
5. 在实现前把 Prisma schema 和迁移计划单独固化成文档或 story。

## 8.3 适合后续继续研究的开放点

- `@reus-able/sso-utils` 的最佳封装方式
- 是否需要会话接口 `GET /api/me/session`
- 本地便签与在线便签未来是否共享更多编辑器逻辑
- 是否启用软删除与回收站

## 9. 来源与验证说明

### 9.1 本地输入

- [tech-solution.md](/Users/youranreus/Code/Projects/note/docs/tech-solution.md)
- [database-design.md](/Users/youranreus/Code/Projects/note/docs/database-design.md)
- [note.pen](/Users/youranreus/Code/Projects/note/docs/note.pen)
- [package.json](/Users/youranreus/Code/Projects/note/package.json)
- [.env.example](/Users/youranreus/Code/Projects/note/.env.example)
- [tsconfig.base.json](/Users/youranreus/Code/Projects/note/tsconfig.base.json)
- [project-context.md](/Users/youranreus/Code/Projects/note/_bmad-output/project-context.md)

### 9.2 网页来源

- [Vue Tooling](https://vuejs.org/guide/scaling-up/tooling)
- [Vite Why](https://vite.dev/guide/why.html)
- [Vite Env Variables and Modes](https://vite.dev/guide/env-and-mode)
- [Vue Router Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html)
- [Pinia Introduction](https://pinia.vuejs.org/introduction.html)
- [Pinia Core Concepts](https://pinia.vuejs.org/core-concepts/)
- [Pinia Actions](https://pinia.vuejs.org/core-concepts/actions.html)
- [Tailwind CSS with Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [Alova Response Cache Details](https://alova.js.org/tutorial/cache/)
- [Alova usePagination](https://alova.js.org/v2/tutorial/strategy/usePagination/)
- [Fastify Plugins Guide](https://fastify.dev/docs/latest/Guides/Plugins-Guide/)
- [Fastify Plugins](https://fastify.dev/docs/v5.3.x/Reference/Plugins/)
- [Fastify Encapsulation](https://fastify.dev/docs/v5.7.x/Reference/Encapsulation/)
- [Fastify Hooks](https://fastify.dev/docs/latest/Reference/Hooks/)
- [Fastify Lifecycle](https://fastify.dev/docs/v5.7.x/Reference/Lifecycle/)
- [Fastify Validation and Serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)
- [Prisma MySQL Connector](https://docs.prisma.io/docs/orm/core-concepts/supported-databases/mysql)
- [Prisma Supported Databases](https://docs.prisma.io/docs/orm/reference/supported-databases)
- [Prisma CRUD / upsert](https://docs.prisma.io/docs/orm/prisma-client/queries/crud)
- [Prisma Compound IDs](https://docs.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints)
- [Prisma Referential Actions](https://docs.prisma.io/docs/v6/orm/prisma-schema/data-model/relations/referential-actions)
- [MySQL FOREIGN KEY Constraints](https://dev.mysql.com/doc/en/constraint-foreign-key.html)
- [MySQL CREATE TABLE FOREIGN KEY Constraints](https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html)

### 9.3 置信度

- 前端工具链建议：高
- Fastify/Prisma/MySQL 架构建议：高
- SSO 具体封装策略：中
- 迁移顺序与数据清洗复杂度：中

### 9.4 研究不足

本次研究没有拿到 `@reus-able/sso-utils` 的公开官方文档，也没有真实业务代码可供审查，因此对 SSO 接入细节、最终目录层级和 API 细节的判断，部分是基于本地方案文档做的工程推断，而不是对现有实现的验证。
