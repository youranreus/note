---
project_name: 'note'
user_name: 'Youranreus'
date: '2026-03-31'
sections_completed: ['technology_stack', 'critical_rules']
existing_patterns_found: 9
---

# AI 项目上下文

本文件用于约束 BMAD 工作流中的各类 AI agent，确保其在当前项目内输出一致、可落地，并尽量遵守已有方案文档。

---

## 技术栈与项目现状

- 包管理与脚本工具链默认使用 `pnpm`，不要改用 `npm` 或 `yarn`。
- 根仓当前是一个 `pnpm` 工作区入口，`package.json` 已预留 `@note/web` 与 `@note/api` 过滤脚本。
- 现阶段仓库中的核心上下文主要位于 `docs/tech-solution.md` 与 `docs/database-design.md`，它们是架构与数据设计的一手依据。
- 前端目标技术栈：`Vue 3 + Tailwind CSS + alova.js + axios`。
- 后端目标技术栈：`Fastify`，SSO 对接依赖 `@reus-able/sso-utils`。
- 数据库目标为 `MySQL + Prisma`。
- 目标目录结构优先参考 `docs/tech-solution.md` 中建议的 `apps/web`、`apps/api`、`packages/*` 分层。

## 关键实施规则

- 任何新命令、脚本、依赖说明都优先给出 `pnpm` 写法。
- 规划、架构、story、实现方案优先使用中文输出，除非任务明确要求英文。
- 在仓库真实代码与 `docs/` 方案文档存在冲突时，先显式指出冲突，再做决定；不要擅自假设旧实现一定正确。
- 在尚未补齐 `apps/web`、`apps/api` 实际代码前，优先把 `docs/` 视为重构目标蓝图，而不是把当前根目录文件布局当作最终架构。
- 涉及数据库设计时，默认遵守以下规则：
  - `notes.sid` 必须保持业务唯一。
  - 口令字段只存 `key_hash`，不要设计或恢复明文 `key` 持久化。
  - 用户与业务表关联优先使用内部主键，不直接以外部自然键充当长期内部关联。
- 涉及接口设计时，优先沿用 `docs/tech-solution.md` 中定义的 REST 边界与职责分层。
- 涉及前端状态设计时，优先让请求缓存归 `alova` 管理，仅让全局会话和 UI 状态进入 store。
- 做实现任务时，优先补齐最小可运行链路，不要在没有需求支撑的情况下引入额外基础设施。
- 输出文档时尽量引用已有文件路径，便于后续 agent 在 BMAD 流程中继续接力。

## 推荐输入文档

- 产品/业务背景：`docs/note.pen`
- 技术方案：`docs/tech-solution.md`
- 数据库设计：`docs/database-design.md`

## BMAD 产物路径约定

- 规划类产物：`_bmad-output/planning-artifacts/`
- 实施类产物：`_bmad-output/implementation-artifacts/`
- 项目上下文：`_bmad-output/project-context.md`
