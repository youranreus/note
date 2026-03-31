# BMAD Method 工作流说明

当前项目已完成 `BMad Method v6.2.2` 的本地安装，并已接入 `Cursor` 技能目录。

## 已配置内容

- 官方 BMAD 内核目录：`_bmad/`
- Cursor 技能目录：`.cursor/skills/`
- 规划产物目录：`_bmad-output/planning-artifacts/`
- 实施产物目录：`_bmad-output/implementation-artifacts/`
- 项目上下文：`_bmad-output/project-context.md`

## 推荐使用顺序

### 完整规划流

1. `bmad-help`
   - 让 BMAD 判断当前阶段和下一步动作。
2. `bmad-create-prd`
   - 基于 `docs/note.pen` 和现有目标，生成需求文档。
3. `bmad-create-architecture`
   - 基于 PRD、`docs/tech-solution.md`、`docs/database-design.md` 细化架构。
4. `bmad-create-epics-and-stories`
   - 将 PRD/架构拆成 Epic 与 Story。
5. `bmad-create-story`
   - 为单个 Story 生成可开发任务。
6. `bmad-dev-story`
   - 进入实现与验收。

### 小需求快速流

1. `bmad-quick-dev`
   - 适合改一个明确的小功能、修 bug、补测试。

## 当前项目的使用约束

- 默认使用中文沟通和中文文档输出。
- 默认使用 `pnpm` 相关命令和脚本表达方式。
- 执行前优先读取：
  - `docs/tech-solution.md`
  - `docs/database-design.md`
  - `_bmad-output/project-context.md`

## 建议开场提示词

### 做完整规划时

```text
请使用 bmad-help，结合当前仓库的 docs 与 _bmad-output/project-context.md，判断 note 项目的下一步 BMAD 动作。
```

### 直接生成 PRD 时

```text
请使用 bmad-create-prd，参考 docs/note.pen、docs/tech-solution.md 与 _bmad-output/project-context.md，为当前项目产出中文 PRD。
```

### 直接开始小需求实现时

```text
请使用 bmad-quick-dev，默认遵守 _bmad-output/project-context.md，使用 pnpm 工具链完成当前需求。
```
