# Week 1 Web Plan（Vite + Vue3）

## 目标

- 搭建可运行的前端基础工程。
- 完成 SSO 回调页与登录态恢复壳逻辑。
- 保持页面结构对齐 `docs/note.pen` 的一级信息架构。

## 任务拆分

### 1) 项目初始化

- [ ] 建立 `apps/web` package（Vite + Vue3 + TS）
- [ ] 接入 Tailwind 与基础主题色
- [ ] 建立路由和 Pinia

### 2) 页面与路由壳

- [ ] `/` 首页：未登录态 + 已登录态切换
- [ ] `/auth/callback`：展示回调处理中状态
- [ ] `/note/o/:sid`：在线便签详情壳
- [ ] `/note/l/:sid`：本地便签详情壳
- [ ] 用户面板占位组件（全局弹层）

### 3) HTTP 层与会话恢复

- [ ] `services/http/client.ts`：axios 实例（`withCredentials=true`）
- [ ] alova requester 初始化
- [ ] `authApi`：`callback/session/logout`
- [ ] `authStore`：`refreshSession/completeCallback/logout`

### 4) 联调行为

- [ ] 首屏自动调用 `refreshSession`
- [ ] callback 成功后跳回首页
- [ ] logout 后恢复未登录态

## 页面验收标准

- [ ] 未登录：首页显示 SSO 登录入口
- [ ] 登录成功：首页显示用户摘要
- [ ] 可跳转在线/本地便签路由壳
- [ ] 用户面板可打开/关闭（占位）

## 风险点与处理

- alova 适配器版本差异：若 API 不兼容，保留 axios 主路径，alova 先用于方法声明和后续缓存扩展。
- SSO 跳转依赖环境变量：默认提供本地 mock 回调 URL，避免阻塞联调。

