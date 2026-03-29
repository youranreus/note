# Week 1 Web Plan（Vite + Vue3）

> **状态：已完成**（对照 `apps/web` 核验于 2026-03-29）

## 目标

- 搭建可运行的前端基础工程。
- 完成 SSO 回调页与登录态恢复壳逻辑。
- 保持页面结构对齐 `docs/note.pen` 的一级信息架构。

## 任务拆分

### 1) 项目初始化

- [x] 建立 `apps/web` package（Vite + Vue3 + TS）
- [x] 接入 Tailwind 与基础主题色
- [x] 建立路由和 Pinia

### 2) 页面与路由壳

- [x] `/` 首页：未登录态 + 已登录态切换
- [x] `/auth/callback`：展示回调处理中状态（从 URL 读取 `code` 并完成 `completeCallback`）
- [x] `/note/o/:sid`：在线便签详情壳
- [x] `/note/l/:sid`：本地便签详情壳
- [x] 用户面板占位组件（全局弹层，`UserPanelPlaceholder.vue`）

### 3) HTTP 层与会话恢复

- [x] `services/http/client.ts`：axios 实例（`withCredentials=true`）与 alova 实例
- [x] alova requester 初始化（`@alova/adapter-axios`）
- [x] `services/http/auth.ts`：`authApi` / `authMethods`（callback / session / logout）
- [x] `stores/auth.ts`：`refreshSession` / `completeCallback` / `logout`

### 4) 联调行为

- [x] 首屏自动调用 `refreshSession`（`main.ts`）
- [x] callback 成功后跳回首页
- [x] logout 后恢复未登录态

## 页面验收标准

- [x] 未登录：首页显示 SSO 登录入口
- [x] 登录成功：首页显示用户摘要
- [x] 可跳转在线/本地便签路由壳
- [x] 用户面板可打开/关闭（占位）

## 风险点与处理

- alova 适配器版本差异：若 API 不兼容，保留 axios 主路径，alova 先用于方法声明和后续缓存扩展。（当前：`authApi` 以 axios 为主路径。）
- SSO 跳转依赖环境变量：默认提供本地 mock 回调 URL，避免阻塞联调。
