# Week 1 Overview（骨架落地）

本周目标：完成 `apps/web` + `apps/api` 双应用骨架，打通 `SSO callback -> cookie session -> session restore` 主链路。

## 交付物清单

- [ ] Monorepo workspace（`pnpm-workspace.yaml`、根脚本）
- [ ] Web 基座（Vite + Vue3 + Tailwind + alova + axios）
- [ ] API 基座（Fastify + Prisma + auth/session plugin）
- [ ] 鉴权接口（`/api/auth/callback`、`/api/auth/session`、`/api/auth/logout`）
- [ ] 基础健康检查（`GET /health`）
- [ ] Prisma schema + migration baseline
- [ ] API 单测与集成测
- [ ] 文档与本地启动说明

## 每日推进计划

### Day 1

- 初始化 workspace 与 `apps/web`、`apps/api` 目录
- 完成根脚本：`dev`、`dev:web`、`dev:api`
- 输出 `.env.example`（含外部 MySQL 连接说明）

验收：

- [ ] `pnpm -r --filter @note/web --filter @note/api run dev` 可启动命令结构
- [ ] 环境变量文档可支撑首次本地配置

### Day 2

- 落地 web 基座：路由、页面壳、Pinia store
- 落地 http 层：axios + alova requester
- 首页完成未登录/已登录壳状态切换

验收：

- [ ] `/`、`/auth/callback`、`/note/o/:sid`、`/note/l/:sid` 路由可访问
- [ ] web 端请求默认 `withCredentials=true`

### Day 3

- 落地 api 基座：Fastify app、plugins、routes、services
- 完成 `/health`、`/api/auth/session`（匿名可读）
- 落地 session store 与 cookie 读写

验收：

- [ ] `GET /health` 返回 `ok=true`
- [ ] 未登录请求 `/api/auth/session` 返回 `{ logged: false }`

### Day 4

- 接入 `@reus-able/sso-utils` 封装 verifier（mock 优先）
- 完成 callback -> upsert user -> set sid cookie
- 完成 logout 清会话 + 清 cookie

验收：

- [ ] `GET /api/auth/callback?ticket=...` 返回 `ok=true` 并下发 `sid` cookie
- [ ] 带 cookie 调 `/api/auth/session` 返回 `{ logged: true, user }`
- [ ] `/api/auth/logout` 后会话失效

### Day 5

- 增补测试：auth plugin 分支 + auth route 集成
- 增补 prisma smoke 脚本
- 自测联调 3 次循环（callback/session/logout）

验收：

- [ ] 单测覆盖无 cookie / 无效 cookie / 过期 cookie
- [ ] 集成测试覆盖 callback/session/logout 主链路
- [ ] Prisma smoke 可完成 `users` upsert

