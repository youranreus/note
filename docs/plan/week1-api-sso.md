# Week 1 API + SSO Plan（Fastify）

> **状态：已完成**（对照 `apps/api` 核验于 2026-03-29）

## 目标

- 建立 Fastify 服务骨架与插件化鉴权结构。
- 接入 `@reus-able/sso-utils`（带本地 mock）并打通 cookie 会话链路。
- 提供最小可用接口供 web 联调。

**参数约定：** 回调路由使用查询参数 `code`（与 OAuth 授权码及 `@reus-able/sso-utils` 的 token 交换流程一致）；mock 模式下 `code` 需以 `SSO_MOCK_TICKET_PREFIX`（默认 `mock:`）开头。

## 任务拆分

### 1) 服务基础设施

- [x] `src/app.ts`：创建 Fastify 实例、注册插件与路由
- [x] `src/server.ts`：服务启动入口
- [x] `src/config.ts`：统一环境变量解析
- [x] `GET /health` 健康检查

### 2) Prisma 基础

- [x] 建立 `prisma/schema.prisma`（users / notes / note_favorites）
- [x] 建立 baseline migration
- [x] `src/infra/prisma/client.ts` 单例
- [x] `scripts/prisma-smoke.ts` upsert 冒烟（`pnpm --filter @note/api prisma:smoke`）

### 3) 会话与鉴权插件

- [x] `plugins/session.ts`：内存 session store（create / get / delete）
- [x] `plugins/auth.ts`：`optionalAuth` 与 `requireAuth`
- [x] `request.user` 注入统一用户摘要

### 4) SSO 链路

- [x] `services/sso-verifier.ts` 封装 `@reus-able/sso-utils`（`verifySsoCode`）
- [x] 支持 `SSO_MOCK_ENABLED=true` 本地验证
- [x] callback 流程：校验 `code` → upsert user → set cookie `sid`

### 5) API 路由

- [x] `GET /api/auth/callback?code=...`
- [x] `GET /api/auth/session`
- [x] `POST /api/auth/logout`

## 测试计划（本周必须）

### 单测：auth plugin

- [x] optionalAuth: 无 cookie 返回 user=null
- [x] requireAuth: 无 cookie 返回 401
- [x] requireAuth: 非法 cookie 返回 401
- [x] optionalAuth: 过期 cookie 返回 user=null

### 集成测：auth routes

- [x] callback 设置 sid cookie 成功
- [x] session 能读取登录态
- [x] logout 后 session 失效

## 验收标准

- [x] API 在本地可启动并响应 `/health`
- [x] web 可通过 callback 完成登录态恢复
- [x] callback / session / logout 主链路有集成测试覆盖；联调可按计划重复执行验证无状态错乱
- [x] Prisma smoke 在现有外部 MySQL 上可执行（需正确配置 `DATABASE_URL` 并已 `migrate deploy`）
