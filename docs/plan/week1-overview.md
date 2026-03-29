# Week 1 Overview（骨架落地）

> **状态：已完成**（对照仓库实现核验于 2026-03-29）

本周目标：完成 `apps/web` + `apps/api` 双应用骨架，打通 `SSO callback -> cookie session -> session restore` 主链路。

**实现说明：** 鉴权回调与 IdP 对齐，使用查询参数 `code`（OAuth 授权码）；本地联调可通过 `SSO_MOCK_ENABLED=true` 与 `mock:<ssoId>:<name>` 形式模拟。

## 交付物清单

- [x] Monorepo workspace（`pnpm-workspace.yaml`、根脚本）
- [x] Web 基座（Vite + Vue3 + Tailwind + alova + axios）
- [x] API 基座（Fastify + Prisma + auth/session plugin）
- [x] 鉴权接口（`GET /api/auth/callback?code=...`、`GET /api/auth/session`、`POST /api/auth/logout`）
- [x] 基础健康检查（`GET /health`，响应含 `ok: true`）
- [x] Prisma schema + migration baseline
- [x] API 单测与集成测
- [x] 文档与本地启动说明（仓库根目录 `.env.example`；根 `package.json` 的 `dev` / `dev:web` / `dev:api`、`db:init`、`sync:env`）

## 每日推进计划

### Day 1

- 初始化 workspace 与 `apps/web`、`apps/api` 目录
- 完成根脚本：`dev`、`dev:web`、`dev:api`
- 输出 `.env.example`（含外部 MySQL 连接说明）

验收：

- [x] `pnpm -r --filter @note/web --filter @note/api run dev` 或根目录 `pnpm dev` 可启动双端
- [x] 环境变量文档可支撑首次本地配置

### Day 2

- 落地 web 基座：路由、页面壳、Pinia store
- 落地 http 层：axios + alova requester
- 首页完成未登录/已登录壳状态切换

验收：

- [x] `/`、`/auth/callback`、`/note/o/:sid`、`/note/l/:sid` 路由可访问
- [x] web 端请求默认 `withCredentials=true`

### Day 3

- 落地 api 基座：Fastify app、plugins、routes、services
- 完成 `/health`、`/api/auth/session`（匿名可读）
- 落地 session store 与 cookie 读写

验收：

- [x] `GET /health` 返回 `ok=true`
- [x] 未登录请求 `/api/auth/session` 返回 `{ logged: false }`

### Day 4

- 接入 `@reus-able/sso-utils` 封装 verifier（mock 优先）
- 完成 callback -> upsert user -> set sid cookie
- 完成 logout 清会话 + 清 cookie

验收：

- [x] `GET /api/auth/callback?code=...`（mock：`code=mock:1001:Demo%20User`）返回 `ok=true` 并下发 `sid` cookie
- [x] 带 cookie 调 `/api/auth/session` 返回 `{ logged: true, user }`
- [x] `/api/auth/logout` 后会话失效

### Day 5

- 增补测试：auth plugin 分支 + auth route 集成
- 增补 prisma smoke 脚本
- 自测联调 3 次循环（callback/session/logout）

验收：

- [x] 单测覆盖无 cookie / 无效 cookie / 过期 cookie
- [x] 集成测试覆盖 callback → session → logout 主链路（`apps/api/src/__tests__/auth-routes.integration.test.ts`）
- [x] Prisma smoke 可完成 `users` upsert（`pnpm --filter @note/api prisma:smoke`）
