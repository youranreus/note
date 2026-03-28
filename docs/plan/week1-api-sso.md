# Week 1 API + SSO Plan（Fastify）

## 目标

- 建立 Fastify 服务骨架与插件化鉴权结构。
- 接入 `@reus-able/sso-utils`（带本地 mock）并打通 cookie 会话链路。
- 提供最小可用接口供 web 联调。

## 任务拆分

### 1) 服务基础设施

- [ ] `src/app.ts`：创建 Fastify 实例、注册插件与路由
- [ ] `src/server.ts`：服务启动入口
- [ ] `src/config.ts`：统一环境变量解析
- [ ] `GET /health` 健康检查

### 2) Prisma 基础

- [ ] 建立 `prisma/schema.prisma`（users/notes/note_favorites）
- [ ] 建立 baseline migration
- [ ] `infra/prisma/client.ts` 单例
- [ ] `scripts/prisma-smoke.ts` upsert 冒烟

### 3) 会话与鉴权插件

- [ ] `plugins/session.ts`：内存 session store（create/get/delete）
- [ ] `plugins/auth.ts`：`optionalAuth` 与 `requireAuth`
- [ ] `request.user` 注入统一用户摘要

### 4) SSO 链路

- [ ] `services/sso-verifier.ts` 封装 `@reus-able/sso-utils`
- [ ] 支持 `SSO_MOCK_ENABLED=true` 本地验证
- [ ] callback 流程：ticket 校验 -> upsert user -> set cookie sid

### 5) API 路由

- [ ] `GET /api/auth/callback?ticket=...`
- [ ] `GET /api/auth/session`
- [ ] `POST /api/auth/logout`

## 测试计划（本周必须）

### 单测：auth plugin

- [ ] optionalAuth: 无 cookie 返回 user=null
- [ ] requireAuth: 无 cookie 返回 401
- [ ] requireAuth: 非法 cookie 返回 401
- [ ] optionalAuth: 过期 cookie 返回 user=null

### 集成测：auth routes

- [ ] callback 设置 sid cookie 成功
- [ ] session 能读取登录态
- [ ] logout 后 session 失效

## 验收标准

- [ ] API 在本地可启动并响应 `/health`
- [ ] web 可通过 callback 完成登录态恢复
- [ ] callback/session/logout 连续执行 3 次以上无状态错乱
- [ ] Prisma smoke 在现有外部 MySQL 上可执行

