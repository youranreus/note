# 重构技术选型与架构设计文档

> **项目**：季悠然的便签（note）重构方案  
> **文档版本**：v2.0  
> **制定时间**：2026-03-05  
> **状态**：待评审

---

## 一、现有项目问题分析

### 1.1 当前技术栈（旧）

| 层级 | 当前技术 | 问题 |
|------|---------|------|
| 框架 | Nuxt 3.10 | 版本偏旧，未跟进最新特性 |
| UI 组件库 | Naive UI + Tailwind | Naive UI 非 Tailwind-first，存在样式冲突，维护成本高 |
| ORM | Prisma 5 | bundle 体积大，需要独立 query engine 进程 |
| 数据库 | MySQL | 保留自托管，合理 |
| 认证 | 强依赖外部 SSO | 耦合度高，无法独立运行 |
| 状态管理 | Pinia + persist | 相对合理，保留 |
| 本地存储 | localforage | 相对合理，保留 |
| 部署 | 传统服务器 | 无容器化，环境一致性差，缺少 CI/CD |

### 1.2 核心痛点

1. **UI 层混乱**：Naive UI（非 Tailwind-first）与 Tailwind 并存，主题定制困难
2. **ORM 过重**：Prisma 的 query engine 体积大，启动慢
3. **强 SSO 依赖**：登录系统与外部服务强耦合，无法自主部署
4. **无容器化**：环境依赖靠手动维护，无法快速迁移和复现
5. **数据模型简单但代码冗余**：3 张表的业务用了过多样板代码

---

## 二、技术选型

### 2.1 框架：保留 Nuxt 3（升级到最新版）

**决策**：继续使用 Nuxt 3，升级到最新稳定版

**理由**：
- 项目本身是 Vue 生态，迁移成本不必要
- Nuxt 3 的 Nitro Server Engine 成熟稳定
- Nuxt UI v3 已发布，解决了 UI 方案问题
- Auto-import、File-based routing 等特性保留价值

---

### 2.2 UI 组件库：迁移到 Nuxt UI v3 + @reus-able/theme

**决策**：Naive UI → **Nuxt UI v3**，设计风格层引入 **@reus-able/theme**

| | Naive UI | Nuxt UI v3 | shadcn-vue |
|---|---------|-----------|-----------|
| Tailwind 集成 | ❌ 存在冲突 | ✅ 原生 Tailwind-first | ✅ 原生 Tailwind |
| Nuxt 官方支持 | ❌ 第三方 | ✅ 官方出品 | ⚠️ 社区 |
| 组件数量 | 80+ | 125+ | 中等 |
| 主题定制 | 复杂 | 简单（CSS 变量） | 灵活但复杂 |
| 暗黑模式 | 支持 | ✅ 内置 | 需配置 |
| 2026 活跃度 | 一般 | ✅ 高度活跃 | ✅ 活跃 |

**选型理由**：
- Nuxt 官方出品，与 Nuxt 3 无缝集成
- 基于 Tailwind CSS v4 + Reka UI（无障碍友好）
- 125+ 组件完全覆盖便签应用需求
- 内置 Dark Mode、响应式

#### @reus-able/theme 集成方案

`@reus-able/theme` 是项目组自有的设计 Token 包（提取自 Applog），提供统一的 CSS 变量和排版规范。在重构中作为**设计风格层**叠加在 Nuxt UI v3 之上：

**包含内容**：

| 模块 | 引入路径 | 用途 |
|------|---------|------|
| 全量 | `@reus-able/theme` | 引入所有模块 |
| Design Token | `@reus-able/theme/tokens` | CSS 变量（颜色、字体） |
| 文章排版 | `@reus-able/theme/article` | `.article-content` 排版类 |
| 响应式容器 | `@reus-able/theme/container` | `.common-page-container` |
| 封面图动效 | `@reus-able/theme/cover-image` | shimmer 骨架屏 |

**核心 Token（tokens.css）**：

```css
/* 颜色 Token */
--color-link: #0071e3;
--color-link-hover: rgb(0, 102, 204);
--color-text-primary: #1d1d1f;
--color-text-secondary: #6e6e73;
--color-bg-base: #ffffff;
--color-bg-muted: #f5f5f7;
--color-bg-card: #e5e7eb;
--color-border: #d2d2d7;
--color-error: #ff3b30;

/* 字体栈 */
--font-family-base: "SF Pro SC", "PingFang SC", "Microsoft YaHei", sans-serif;
--font-family-mono: "SF Mono", "Fira Code", monospace;
```

**与 Nuxt UI v3 的集成方式**：

```css
/* assets/global.css */
/* 1. 引入 @reus-able/theme token（先于 Nuxt UI） */
@import '@reus-able/theme/tokens';

/* 2. 将 token 映射到 Nuxt UI 的 CSS 变量 */
:root {
  --ui-color-primary: var(--color-link);         /* 主色 */
  --ui-text-muted: var(--color-text-secondary);  /* 次要文本 */
  --ui-bg: var(--color-bg-base);                 /* 背景 */
  --ui-border: var(--color-border);              /* 边框 */
}
```

**布局层使用**：
- 页面容器使用 `.common-page-container`（响应式宽度，最大 898px）
- 字体使用 `var(--font-family-base)`，保持与 Applog 一致的风格

---

### 2.3 ORM：迁移到 Drizzle ORM

**决策**：Prisma 5 → **Drizzle ORM**

| | Prisma | Drizzle |
|---|--------|---------|
| Bundle 体积 | 重（含独立 query engine） | 轻量（纯 TS） |
| MySQL 支持 | ✅ | ✅ |
| 类型安全 | ✅ 强 | ✅ 更强（SQL-like API） |
| 启动速度 | 慢 | 快 |
| 迁移工具 | Prisma Migrate | Drizzle Kit |
| 学习曲线 | 低 | 中（接近原生 SQL） |
| 2026 趋势 | 稳定 | ✅ 高速增长 |

**选型理由**：
- 数据模型简单（3 张表），无需 Prisma 的高级抽象
- Drizzle 更轻量，启动速度更快
- 类型安全更强，SQL-like API 直观
- 完美支持 MySQL，与现有数据库兼容

---

### 2.4 数据库：保留 MySQL（自托管）

**决策**：**保留 MySQL**，通过 Docker Compose 管理

**理由**：
- 数据完全自主可控，不依赖第三方云服务
- 现有数据无需迁移，风险最低
- Docker 部署后运维成本可接受
- Drizzle ORM 对 MySQL 支持完善

**数据库版本**：MySQL 8.0（Docker 官方镜像）

---

### 2.5 认证系统：@reus-able/sso-utils 对接 SSO

**决策**：强 SSO 耦合 → **@reus-able/sso-utils 标准化对接**

`@reus-able/sso-utils` 是项目组自有的 SSO 工具库，封装了 OAuth 授权码流程，比原来手写的 ticket 验证更规范。

**包 API**：

```typescript
import { UserAPI } from '@reus-able/sso-utils'

const api = UserAPI({
  SSO_URL: 'https://sso.example.com',   // SSO 服务地址
  SSO_ID: 'your-client-id',             // OAuth Client ID
  SSO_SECRET: 'your-client-secret',     // OAuth Client Secret（服务端用）
  SSO_REDIRECT: 'https://your-app/callback', // 回调地址
})

// 前端：跳转 SSO 授权页
api.redirectSSO()           // 当前窗口跳转
api.redirectSSO(true)       // 新标签页打开

// 前端：获取授权跳转链接
api.getRedirectLink()       // 返回完整授权 URL

// 服务端：用 code 换取 token
await api.authorizeToken(code)

// 服务端：用 token 获取用户信息
await api.getUserInfo(token)
```

**认证流程（OAuth 授权码模式）**：

```
前端
  → api.redirectSSO()  跳转 SSO 授权页
  → 用户授权后，SSO 回调 /auth/callback?code=xxx
  → 前端拿到 code，POST /api/auth/login { code }

服务端
  → api.authorizeToken(code) 换取 access_token
  → api.getUserInfo(token) 获取用户信息
  → 查询或创建本地 User 记录
  → 写入 httpOnly Cookie Session
  → 返回用户信息
```

**与旧版的差异**：

| | 旧版 | 新版 |
|---|------|------|
| 授权方式 | ticket 直接验证（非标准）| OAuth 授权码流程（标准）|
| 前端操作 | `window.location.href = sso_url/callback/key` | `api.redirectSSO()` |
| 服务端验证 | `GET ssoApi/user/validate` + `Authorization: Bearer ticket` | `authorizeToken(code)` → `getUserInfo(token)` |
| 封装层 | 裸 `$fetch` 手写 | `@reus-able/sso-utils` 统一封装 |

**环境变量**：

```dotenv
SSO_URL=https://sso.example.com
SSO_ID=your-client-id
SSO_SECRET=your-client-secret
SSO_REDIRECT=https://your-app/auth/callback
```

**Session 管理**：使用 `nuxt-auth-utils` 处理 httpOnly Cookie Session，sso-utils 只负责 OAuth 流程部分。

---

### 2.6 部署方式：Docker Compose

**决策**：传统服务器 → **Docker Compose 容器化部署**

**容器构成**：

```
┌─────────────────────────────────────────┐
│           Docker Compose Stack           │
│                                         │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │  note-app   │  │   note-mysql     │  │
│  │  (Nuxt 3)   │  │   (MySQL 8.0)    │  │
│  │  Port: 3000 │  │   Port: 3306     │  │
│  └──────┬──────┘  └──────────────────┘  │
│         │                 ▲             │
│         └─────────────────┘             │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  note-nginx (可选反向代理)           ││
│  │  Port: 80/443                       ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**优势**：
- 环境一致性：开发/生产环境完全一致
- 快速迁移：一条命令完成整个栈的迁移
- 数据自托管：MySQL 数据持久化到宿主机 volume
- 易于备份：只需备份 MySQL volume 目录

---

### 2.7 技术栈汇总

| 层级 | 旧技术 | 新技术 | 变更说明 |
|------|-------|-------|---------|
| **框架** | Nuxt 3.10 | Nuxt 3（最新） | 升级版本 |
| **UI 组件** | Naive UI | **Nuxt UI v3** | 替换，Tailwind-first |
| **样式/设计Token** | Tailwind CSS v3 | Tailwind CSS v4 + **@reus-able/theme** | 统一设计风格层 |
| **ORM** | Prisma 5 | **Drizzle ORM** | 替换，更轻量 |
| **数据库** | MySQL（裸服务器） | **MySQL 8.0（Docker）** | 容器化，数据自托管 |
| **认证** | 强依赖外部 SSO（手写 ticket）| **@reus-able/sso-utils + nuxt-auth-utils** | 标准 OAuth 流程，统一封装 |
| **状态管理** | Pinia | Pinia | 保留 |
| **本地存储** | localforage | localforage | 保留 |
| **包管理** | pnpm | pnpm | 保留 |
| **部署** | 传统服务器 | **Docker Compose** | 容器化 |

---

## 三、架构设计

### 3.1 目录结构

```
note/
├── app/                        # 前端应用层（Nuxt 约定）
│   ├── assets/
│   │   └── global.css
│   ├── components/
│   │   ├── note/
│   │   │   ├── NoteEditor.vue      # 便签编辑器
│   │   │   ├── NoteToolbar.vue     # 工具栏（保存/删除/加密）
│   │   │   ├── NoteStatusBar.vue   # 状态栏（类型/字数/编辑状态）
│   │   │   └── NoteList.vue        # 便签列表（用于用户面板）
│   │   └── user/
│   │       ├── UserDrawer.vue      # 用户面板抽屉
│   │       ├── UserPanel.vue       # 用户信息+便签/收藏列表
│   │       └── LoginForm.vue       # 登录表单
│   ├── composables/
│   │   ├── useNote.ts          # 便签核心（分发 online/local）
│   │   ├── useOnlineNote.ts    # 在线便签逻辑
│   │   ├── useLocalNote.ts     # 本地便签逻辑
│   │   └── useAuth.ts          # 认证状态管理
│   ├── layouts/
│   │   └── default.vue
│   └── pages/
│       ├── index.vue           # 首页
│       ├── [type]/
│       │   └── [id].vue        # 便签详情页
│       └── auth/
│           └── login.vue       # 登录页
│
├── server/                     # 服务端层
│   ├── api/
│   │   ├── note/
│   │   │   ├── [sid].get.ts        # GET    /api/note/:sid
│   │   │   ├── [sid].post.ts       # POST   /api/note/:sid
│   │   │   └── [sid].delete.ts     # DELETE /api/note/:sid
│   │   ├── user/
│   │   │   ├── notes.get.ts        # GET    /api/user/notes
│   │   │   └── favourites.get.ts   # GET    /api/user/favourites
│   │   ├── favour/
│   │   │   ├── index.post.ts       # POST   /api/favour
│   │   │   └── index.delete.ts     # DELETE /api/favour
│   │   └── auth/
│   │       ├── login.post.ts       # POST   /api/auth/login
│   │       └── logout.post.ts      # POST   /api/auth/logout
│   ├── database/
│   │   ├── schema.ts           # Drizzle Schema
│   │   ├── client.ts           # MySQL 连接
│   │   └── repos/
│   │       ├── noteRepo.ts
│   │       └── userRepo.ts
│   ├── middleware/
│   │   └── auth.ts             # 认证中间件（从 Cookie 读取 Session）
│   └── utils/
│       ├── transform.ts        # 数据转换
│       └── error.ts            # 统一错误处理
│
├── shared/
│   └── types/
│       └── index.ts            # 前后端共享类型
│
├── deploy/                     # 部署相关配置
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── nginx/
│   │   └── default.conf        # Nginx 反向代理配置（可选）
│   └── mysql/
│       └── init.sql            # MySQL 初始化脚本（可选）
│
├── docs/
│   ├── API.md
│   ├── FEATURES.md
│   └── REFACTOR.md
│
├── drizzle.config.ts
└── nuxt.config.ts
```

---

### 3.2 数据库 Schema 设计（Drizzle + MySQL）

```typescript
// server/database/schema.ts
import { mysqlTable, varchar, text, int, boolean, timestamp, primaryKey } from 'drizzle-orm/mysql-core'

// 便签表
export const notes = mysqlTable('notes', {
  id:        int('id').autoincrement().primaryKey(),
  sid:       varchar('sid', { length: 64 }).notNull().unique(),  // 唯一索引
  content:   text('content').notNull().$default(() => ''),
  key:       varchar('key', { length: 255 }),                    // 加密密钥（可空）
  authorId:  int('author_id'),                                   // 关联用户（可空）
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(), // 自动更新
})

// 用户表
export const users = mysqlTable('users', {
  id:        int('id').autoincrement().primaryKey(),
  ssoId:     int('sso_id').unique(),                             // 保留 SSO 兼容
  email:     varchar('email', { length: 255 }).unique(),
  password:  varchar('password', { length: 255 }),               // bcrypt hash
  role:      varchar('role', { length: 20 }).$default(() => 'USER'),
  createdAt: timestamp('created_at').defaultNow(),
})

// 收藏关联表
export const favourites = mysqlTable('favourites', {
  noteId:    int('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  userId:    int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.noteId, table.userId] }),
}))
```

**相比旧 Schema 的改进**：
- `sid` 字段添加 `unique()` 约束，提升查询性能
- 新增 `createdAt` / `updatedAt` 时间戳（原来缺失）
- `users` 表新增 `email` / `password` 支持内置认证
- `favourites` 添加 `onDelete: cascade`，便签删除后自动清理收藏记录

---

### 3.3 API 路由设计（重构后 vs 旧版）

| 新路径 | HTTP 方法 | 旧路径 | 说明 |
|--------|----------|--------|------|
| `/api/note/:sid` | `GET` | `/api/getNote` | 获取便签 |
| `/api/note/:sid` | `POST` | `/api/updateNote` | 创建/更新便签 |
| `/api/note/:sid` | `DELETE` | `/api/delNote` | 删除便签 |
| `/api/user/notes` | `GET` | `/api/getUserNote` | 我的便签列表 |
| `/api/user/favourites` | `GET` | `/api/getFavourNote` | 收藏列表 |
| `/api/favour` | `POST` | `/api/addFavourNote` | 收藏便签 |
| `/api/favour` | `DELETE` | `/api/delFavourNote` | 取消收藏 |
| `/api/auth/login` | `POST` | `/api/login`（GET）| 登录（改为 POST） |
| `/api/auth/logout` | `POST` | 无 | 登出（新增） |

---

### 3.4 认证流程

```
旧流程（非标准 ticket 模式）：
  前端 → window.location.href = ssoHost/callback/ssoKey
       → SSO 返回 ticket
       → GET /api/login?ticket=xxx
       → 服务端 $fetch(ssoApi/user/validate, { Authorization: Bearer ticket })
       → 返回用户信息

新流程（@reus-able/sso-utils，OAuth 授权码模式）：
  前端
    → UserAPI.redirectSSO()  // 跳转 SSO 授权页
    → SSO 授权后回调 /auth/callback?code=xxx
    → 前端 POST /api/auth/login { code }

  服务端
    → UserAPI.authorizeToken(code)   // code 换 token
    → UserAPI.getUserInfo(token)     // token 换用户信息
    → 查询/创建本地 User 记录
    → nuxt-auth-utils 写入 httpOnly Cookie Session
    → 返回用户信息

  登出
    → POST /api/auth/logout
    → 清除 Session Cookie
```

---

### 3.5 Docker 部署设计

#### Dockerfile

```dockerfile
# deploy/Dockerfile
FROM node:22-alpine AS base
RUN npm install -g pnpm

# 依赖安装
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 构建
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# 生产镜像
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

#### docker-compose.yml（开发/生产通用）

```yaml
# deploy/docker-compose.yml
version: '3.9'

services:
  app:
    build:
      context: ..
      dockerfile: deploy/Dockerfile
    container_name: note-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://note:${MYSQL_PASSWORD}@db:3306/note
      - NUXT_SESSION_PASSWORD=${SESSION_PASSWORD}
      - SSO_URL=${SSO_URL}
      - SSO_ID=${SSO_ID}
      - SSO_SECRET=${SSO_SECRET}
      - SSO_REDIRECT=${SSO_REDIRECT}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - note-network

  db:
    image: mysql:8.0
    container_name: note-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: note
      MYSQL_USER: note
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - note-network

  # 可选：Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: note-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro   # SSL 证书
    depends_on:
      - app
    networks:
      - note-network
    profiles:
      - with-nginx  # 用 --profile with-nginx 启用

volumes:
  mysql-data:
    driver: local

networks:
  note-network:
    driver: bridge
```

#### .env.example

```dotenv
# 数据库
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_PASSWORD=your_app_password

# Session 加密（至少32位随机字符串）
SESSION_PASSWORD=your_very_long_random_session_secret_here

# SSO（可选，不填则使用内置邮箱/密码登录）
# SSO（@reus-able/sso-utils 配置）
SSO_URL=https://sso.example.com
SSO_ID=your-client-id
SSO_SECRET=your-client-secret
SSO_REDIRECT=https://your-app/auth/callback
```

#### 启动命令

```bash
# 首次部署
cp .env.example .env   # 填写环境变量
docker compose up -d   # 启动所有服务

# 运行数据库迁移
docker compose exec app pnpm drizzle-kit migrate

# 带 Nginx 启动
docker compose --profile with-nginx up -d

# 查看日志
docker compose logs -f app

# 更新部署
git pull
docker compose build app
docker compose up -d app
```

---

## 四、重构计划

### Phase 1：基础设施搭建（Week 1）
- [ ] 升级 Nuxt 3 到最新版
- [ ] 配置 Drizzle ORM + MySQL 驱动
- [ ] 迁移 Database Schema（Prisma → Drizzle）
- [ ] 编写 Docker Compose 配置
- [ ] 验证本地 Docker 环境启动

### Phase 2：服务端重构（Week 2）
- [ ] 重构 API 路由（按 RESTful 规范重组）
- [ ] 迁移 Repo 层（Prisma API → Drizzle）
- [ ] 实现内置认证（nuxt-auth-utils + bcrypt）
- [ ] 统一错误处理和认证中间件

### Phase 3：前端重构（Week 3）
- [ ] 迁移 UI（Naive UI → Nuxt UI v3）
- [ ] 重构 Composables（对齐新 API 路径）
- [ ] 优化组件结构
- [ ] 响应式适配调试

### Phase 4：测试与部署（Week 4）
- [ ] 功能完整性测试
- [ ] 数据迁移验证（旧数据兼容性）
- [ ] 生产环境 Docker 部署
- [ ] 更新接口文档

---

## 五、向后兼容策略

| 内容 | 策略 |
|------|------|
| **URL 路由** | 保留 `/:type/:id` 格式，已有分享链接不失效 |
| **旧用户数据** | `ssoId` 字段保留，SSO 用户数据无损迁移 |
| **本地便签** | localforage key 格式不变（`memo-${sid}`） |
| **数据库** | 继续使用 MySQL，只切换 ORM，无需数据迁移 |

---

## 六、架构总览

```
┌───────────────────────────────────────────────┐
│               Browser（用户端）                 │
│  Nuxt 3 + Vue 3 + Nuxt UI v3                  │
│  @reus-able/theme（设计 Token + 容器样式）       │
│  @reus-able/sso-utils（SSO 跳转/回调）          │
│  Pinia（状态）+ localforage（本地便签）          │
└────────────────────┬──────────────────────────┘
                     │ HTTP
┌────────────────────▼──────────────────────────┐
│          Docker: note-app（Nuxt Nitro）         │
│  RESTful API                                   │
│  @reus-able/sso-utils（authorizeToken/getUserInfo）│
│  nuxt-auth-utils（httpOnly Cookie Session）    │
│  Drizzle ORM                                   │
└────────────────────┬──────────────────────────┘
                     │ MySQL Protocol
┌────────────────────▼──────────────────────────┐
│          Docker: note-mysql（MySQL 8.0）        │
│  数据持久化到宿主机 Volume（自托管）              │
└───────────────────────────────────────────────┘

可选：note-nginx（反向代理 + SSL）
```

---

## 七、风险与注意事项

| 风险 | 影响 | 应对策略 |
|------|------|---------|
| Drizzle MySQL 语法与 Prisma 差异 | 迁移工作量 | 两者 API 相近，逐个 Repo 迁移 |
| Nuxt UI v3 组件与 Naive UI 差异 | UI 重写工作量 | 组件一一映射，逐步替换 |
| bcrypt 密码哈希性能 | 登录耗时略增 | 正常范围（< 300ms），可接受 |
| SSO 用户首次使用内置登录 | 需重置密码 | 提供管理员重置密码接口 |

---

*文档由 OpenClaw v3 生成 · 2026-03-05 · v3.0（调整：@reus-able/theme 设计Token + @reus-able/sso-utils OAuth认证）*
