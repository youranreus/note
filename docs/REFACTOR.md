# 重构技术选型与架构设计文档

> **项目**：季悠然的便签（note）重构方案  
> **文档版本**：v1.0  
> **制定时间**：2026-03-05  
> **状态**：待评审

---

## 一、现有项目问题分析

### 1.1 当前技术栈（旧）

| 层级 | 当前技术 | 问题 |
|------|---------|------|
| 框架 | Nuxt 3.10 | 版本偏旧，未跟进最新特性 |
| UI 组件库 | Naive UI + Tailwind | Naive UI 与 Tailwind 存在样式冲突，维护成本高 |
| ORM | Prisma 5 | 冷启动慢，bundle 体积大，不适合 Edge 部署 |
| 数据库 | MySQL | 需要独立服务器，运维成本高 |
| 认证 | 强依赖外部 SSO | 耦合度高，无法独立运行 |
| 状态管理 | Pinia + persist | 相对合理，保留 |
| 本地存储 | localforage | 相对合理，考虑升级 |
| 部署 | 传统服务器 | 缺少 CI/CD，无边缘部署支持 |

### 1.2 核心痛点

1. **UI 层混乱**：Naive UI（非 Tailwind-first）与 Tailwind 并存，主题定制困难
2. **ORM 过重**：Prisma 的 query engine 体积大，冷启动延迟高
3. **强 SSO 依赖**：登录系统与外部服务强耦合，无法自主部署
4. **无 Edge 支持**：无法部署到 Cloudflare Workers 等边缘环境
5. **数据模型简单但代码冗余**：3 张表的业务用了过多样板代码

---

## 二、技术选型

### 2.1 框架层：保留 Nuxt 3（升级到最新版）

**决策**：继续使用 Nuxt 3，升级到最新稳定版（2026-03）

**理由**：
- 项目本身是 Vue 生态，迁移到 Next.js 成本高且无必要
- Nuxt 3 的 Nitro Server Engine 已成熟，支持 Edge 部署
- Nuxt UI v3 已发布，解决了 UI 方案问题
- Auto-import、File-based routing 等特性保留价值

**参考**：[Next.js vs Nuxt in 2026 Comprehensive Analysis](https://www.dayzero.live/web-development/nextjs-vs-nuxt-2026-comprehensive-framework-analysis)

---

### 2.2 UI 组件库：迁移到 Nuxt UI v3

**决策**：从 Naive UI → **Nuxt UI v3**

**对比**：

| | Naive UI | Nuxt UI v3 | shadcn-vue |
|---|---------|-----------|-----------|
| Tailwind 集成 | ❌ 存在冲突 | ✅ 原生 Tailwind-first | ✅ 原生 Tailwind |
| Nuxt 官方支持 | ❌ 第三方 | ✅ 官方出品 | ⚠️ 社区 |
| 组件数量 | 多（80+） | 丰富（125+） | 中等 |
| 主题定制 | 复杂 | 简单（CSS 变量） | 灵活但复杂 |
| 暗黑模式 | 支持 | 内置支持 | 需配置 |
| 2026 活跃度 | 一般 | ✅ 高度活跃 | ✅ 活跃 |

**选型理由**：
- Nuxt UI v3 是 Nuxt 官方出品，与 Nuxt 3 无缝集成
- 基于 Tailwind CSS v4 + Reka UI（无障碍）
- 125+ 组件覆盖便签应用所有需求
- 内置 Dark Mode、响应式，减少配置成本

**参考**：[Nuxt UI vs Shadcn Vue: Choosing Your Vue UI Library in 2026](https://preblocks.com/blog/nuxt-ui-vs-shadcn)

---

### 2.3 ORM：迁移到 Drizzle ORM

**决策**：从 Prisma 5 → **Drizzle ORM**

**对比**：

| | Prisma | Drizzle |
|---|--------|---------|
| Bundle 体积 | 重（含 query engine） | 轻量（纯 TS） |
| Edge 兼容 | ⚠️ 需额外配置 | ✅ 原生支持 |
| 类型安全 | ✅ 强 | ✅ 更强（SQL-like API） |
| 冷启动 | 慢 | 快 |
| 迁移工具 | Prisma Migrate | Drizzle Kit |
| 学习曲线 | 低 | 中（接近 SQL） |
| 2026 趋势 | 稳定 | ✅ 高速增长 |

**选型理由**：
- 项目数据模型简单（3 张表），无需 Prisma 的高级抽象
- Drizzle 更轻量，适合 Edge / Serverless 部署
- 类型安全更强，SQL-like API 直观易读

**参考**：[Drizzle vs Prisma ORM in 2026: A Practical Comparison](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma)

---

### 2.4 数据库：迁移到 Cloudflare D1（SQLite）

**决策**：从 MySQL → **Cloudflare D1**（SQLite on the Edge）

**理由**：
- 便签应用数据量小，SQLite 完全满足
- D1 是 Cloudflare 托管的 SQLite，零运维成本
- 与 Drizzle ORM 原生集成
- 免费套餐：500MB 存储，每天 500 万读取
- 与 NuxtHub + Cloudflare Workers 完美配合

**备选方案**（如不使用 Cloudflare）：
- **Turso**（分布式 SQLite，免费套餐 9GB）
- **PlanetScale**（MySQL serverless，如需兼容现有数据）

---

### 2.5 认证系统：内置 JWT 认证

**决策**：移除强 SSO 依赖 → **内置 nuxt-auth-utils + JWT**

**方案**：
- 使用 [`nuxt-auth-utils`](https://github.com/atinux/nuxt-auth-utils) 处理 Session
- 支持**邮箱/密码**登录（基础认证）
- 支持 **GitHub OAuth** 登录（可选，免第三方 SSO 依赖）
- JWT 存储在 httpOnly Cookie，安全可靠

**保留 SSO 支持**：
- 通过环境变量配置，SSO 作为可选认证方式
- 未配置 SSO 时，自动回退到内置认证

**理由**：
- 解耦强依赖，项目可独立部署
- nuxt-auth-utils 是 Nuxt 官方推荐方案
- 数据迁移时保留原 ssoId 字段做兼容

---

### 2.6 部署平台：NuxtHub（Cloudflare）

**决策**：从传统服务器 → **NuxtHub + Cloudflare Workers**

**理由**：
- NuxtHub 是 Nuxt 官方的 Cloudflare 部署平台
- 一命令部署：`npx nuxthub deploy`
- 自动配置 D1 数据库、KV 存储、R2 对象存储
- 免费套餐足够支撑个人便签应用
- 全球边缘节点，访问速度快

---

### 2.7 技术栈汇总（新）

| 层级 | 新技术 | 替换原因 |
|------|-------|---------|
| **框架** | Nuxt 3（最新版） | 升级版本，保持生态同步 |
| **UI 组件** | Nuxt UI v3 | 替换 Naive UI，Tailwind-first |
| **样式** | Tailwind CSS v4 | 随 Nuxt UI v3 升级 |
| **ORM** | Drizzle ORM | 替换 Prisma，更轻量 Edge 友好 |
| **数据库** | Cloudflare D1（SQLite）| 替换 MySQL，零运维 |
| **认证** | nuxt-auth-utils + JWT | 移除强 SSO 依赖 |
| **状态管理** | Pinia | 保留，无变化 |
| **本地存储** | localforage | 保留，无变化 |
| **包管理** | pnpm | 保留，无变化 |
| **部署** | NuxtHub（Cloudflare） | 替换传统服务器 |

---

## 三、架构设计

### 3.1 目录结构

```
note/
├── app/                    # 前端应用层
│   ├── assets/
│   ├── components/
│   │   ├── note/           # 便签相关组件
│   │   │   ├── NoteEditor.vue
│   │   │   ├── NoteToolbar.vue
│   │   │   ├── NoteStatusBar.vue
│   │   │   └── NoteList.vue
│   │   └── user/           # 用户相关组件
│   │       ├── UserPanel.vue
│   │       ├── UserDrawer.vue
│   │       └── LoginForm.vue
│   ├── composables/
│   │   ├── useNote.ts      # 便签核心逻辑
│   │   ├── useLocalNote.ts # 本地便签
│   │   ├── useOnlineNote.ts# 在线便签
│   │   └── useAuth.ts      # 认证逻辑
│   ├── layouts/
│   │   └── default.vue
│   └── pages/
│       ├── index.vue       # 首页
│       ├── [type]/
│       │   └── [id].vue    # 便签详情页
│       └── auth/
│           └── login.vue   # 登录页
│
├── server/                 # 服务端层
│   ├── api/
│   │   ├── note/           # 便签接口（按资源分组）
│   │   │   ├── [sid].get.ts    # GET /api/note/:sid
│   │   │   ├── [sid].post.ts   # POST /api/note/:sid
│   │   │   └── [sid].delete.ts # DELETE /api/note/:sid
│   │   ├── user/           # 用户接口
│   │   │   ├── notes.get.ts    # GET /api/user/notes
│   │   │   └── favourites.get.ts
│   │   ├── favour/         # 收藏接口
│   │   │   ├── index.post.ts   # POST /api/favour
│   │   │   └── index.delete.ts # DELETE /api/favour
│   │   └── auth/           # 认证接口
│   │       ├── login.post.ts
│   │       └── logout.post.ts
│   ├── database/
│   │   ├── schema.ts       # Drizzle Schema 定义
│   │   ├── client.ts       # D1 数据库连接
│   │   └── repos/          # 数据访问层
│   │       ├── noteRepo.ts
│   │       └── userRepo.ts
│   ├── middleware/
│   │   └── auth.ts         # 认证中间件
│   └── utils/
│       ├── transform.ts    # 数据转换工具
│       └── error.ts        # 统一错误处理
│
├── shared/                 # 前后端共享
│   └── types/
│       └── index.ts        # 共享类型定义
│
├── docs/                   # 项目文档
│   ├── API.md
│   ├── FEATURES.md
│   └── REFACTOR.md         # 本文档
│
├── nuxt.config.ts
├── drizzle.config.ts       # Drizzle 配置
└── wrangler.toml           # Cloudflare 配置
```

---

### 3.2 数据库 Schema 设计（Drizzle）

```typescript
// server/database/schema.ts

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// 便签表
export const notes = sqliteTable('notes', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  sid:       text('sid').notNull().unique(),   // URL 标识符（加唯一索引）
  content:   text('content').notNull().default(''),
  key:       text('key'),                      // 加密密钥（可为空）
  authorId:  integer('author_id'),             // 关联用户ID（可为空）
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// 用户表
export const users = sqliteTable('users', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  ssoId:     integer('sso_id').unique(),       // SSO ID（兼容旧数据）
  email:     text('email').unique(),
  password:  text('password'),                 // hash 后的密码
  role:      text('role', { enum: ['USER', 'ADMIN'] }).default('USER'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// 收藏关联表
export const favourites = sqliteTable('favourites', {
  noteId:    integer('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  userId:    integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  pk: primaryKey({ columns: [table.noteId, table.userId] }),
}))
```

**相比旧 Schema 的改进**：
- `sid` 字段添加唯一索引，查询更快
- 添加 `createdAt`/`updatedAt` 时间戳（原来缺少）
- `users` 表添加 `email`/`password` 支持内置认证
- `favourites` 表添加 `onDelete: cascade`，删除便签时自动清理收藏

---

### 3.3 API 路由设计（重构后）

重构后的 API 遵循 RESTful 规范，利用 Nuxt 3 的文件名路由约定：

| 新路径 | 旧路径 | 说明 |
|--------|--------|------|
| `GET /api/note/:sid` | `GET /api/getNote` | 获取便签 |
| `POST /api/note/:sid` | `POST /api/updateNote` | 创建/更新便签 |
| `DELETE /api/note/:sid` | `DELETE /api/delNote` | 删除便签 |
| `GET /api/user/notes` | `GET /api/getUserNote` | 我的便签列表 |
| `GET /api/user/favourites` | `GET /api/getFavourNote` | 收藏列表 |
| `POST /api/favour` | `POST /api/addFavourNote` | 收藏便签 |
| `DELETE /api/favour` | `DELETE /api/delFavourNote` | 取消收藏 |
| `POST /api/auth/login` | `GET /api/login` | 登录（新增内置认证） |
| `POST /api/auth/logout` | -（无） | 登出（新增） |

---

### 3.4 认证流程设计

```
旧流程：
  前端 → 跳转 SSO → 获取 ticket → GET /api/login?ticket=xxx → 服务端验证

新流程（双认证模式）：
  ┌──────────────────────────────────────────┐
  │  内置认证（默认）                           │
  │  前端登录表单 → POST /api/auth/login       │
  │  → 验证 email/password                    │
  │  → 写入 httpOnly Cookie（Session Token）   │
  └──────────────────────────────────────────┘
  ┌──────────────────────────────────────────┐
  │  SSO 认证（可选，通过环境变量开启）           │
  │  前端 → 跳转 SSO → 获取 ticket             │
  │  → POST /api/auth/sso?ticket=xxx          │
  │  → 服务端验证 → 写入 Session              │
  └──────────────────────────────────────────┘
```

---

## 四、重构计划

### 4.1 重构阶段

```
Phase 1：基础设施搭建（Week 1）
  ├─ 初始化新项目结构
  ├─ 配置 Drizzle ORM + D1
  ├─ 迁移数据库 Schema
  └─ 配置 NuxtHub 部署

Phase 2：服务端重构（Week 2）
  ├─ 重构 API 路由（RESTful 规范）
  ├─ 迁移 Repo 层（Prisma → Drizzle）
  ├─ 实现内置认证（nuxt-auth-utils）
  └─ 统一错误处理和中间件

Phase 3：前端重构（Week 3）
  ├─ 迁移 UI（Naive UI → Nuxt UI v3）
  ├─ 重构 Composables
  ├─ 优化组件结构
  └─ 响应式适配

Phase 4：测试与部署（Week 4）
  ├─ 功能完整性测试
  ├─ 数据迁移验证
  ├─ 部署到 NuxtHub
  └─ 文档更新
```

---

### 4.2 向后兼容策略

- **URL 兼容**：保留 `/:type/:id` 路由格式，不破坏已有分享链接
- **数据迁移**：提供 MySQL → D1 的数据迁移脚本
- **SSO 兼容**：`ssoId` 字段保留，老用户数据无损迁移
- **本地便签**：localforage key 格式不变（`memo-${sid}`）

---

## 五、技术栈总结

```
┌─────────────────────────────────────────┐
│              前端（Browser）              │
│  Nuxt 3 + Vue 3 + Nuxt UI v3            │
│  Pinia（状态管理）+ localforage（本地存储）│
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│              服务端（Edge）               │
│  Nitro Server（Nuxt 内置）               │
│  Drizzle ORM + nuxt-auth-utils          │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│            数据层（Cloudflare）           │
│  D1（SQLite 数据库）                     │
└─────────────────────────────────────────┘

部署：NuxtHub（Cloudflare Workers + Pages）
```

---

## 六、风险与注意事项

| 风险 | 影响 | 应对策略 |
|------|------|---------|
| D1 SQLite 并发限制 | 高并发写入性能 | 便签应用写入量小，可接受 |
| Drizzle 学习成本 | 开发周期 | 语法接近 SQL，迁移成本中等 |
| Nuxt UI v3 组件差异 | UI 重写工作量 | 组件一一对应，逐步迁移 |
| SSO 数据兼容性 | 用户数据迁移 | 保留 ssoId 字段，编写迁移脚本 |

---

*文档由 OpenClaw v3 生成 · 2026-03-05*
