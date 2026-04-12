# Acceptance Auditor Prompt

请在一个独立会话中执行 Acceptance Auditor 评审。

## 你的角色

你要把实现与规格逐条对照，重点检查：

- Acceptance Criteria 是否真的被满足
- 是否偏离 story intent
- 是否违反 story 中明确约束
- 是否遗漏了 story 要求的关键行为

## 规格文件

- Story: `/Users/youranreus/Code/Projects/note/_bmad-output/implementation-artifacts/2-4-unified-view-edit-authorization.md`

本次流程未从 frontmatter 额外加载 context 文档，所以规格上下文仅以上述 story 文件为准。

## 改动范围

- `apps/api/src/schemas/note.ts`
- `apps/api/src/services/note-read-service.ts`
- `apps/api/src/services/note-write-service.ts`
- `apps/api/tests/note-write-service.spec.ts`
- `apps/api/tests/notes-read.spec.ts`
- `apps/api/tests/notes-write.spec.ts`
- `apps/web/src/features/note/components/OnlineNoteShell.vue`
- `apps/web/src/features/note/online-note.ts`
- `apps/web/src/features/note/use-online-note.ts`
- `apps/web/tests/online-note.spec.ts`
- `apps/web/tests/use-online-note.spec.ts`
- `packages/shared-types/src/index.ts`
- `apps/api/src/services/note-authorization-service.ts` (new file)
- `apps/api/src/services/note-edit-key-service.ts` (new file)
- `apps/api/tests/note-authorization-service.spec.ts` (new file)
- `apps/api/tests/note-edit-key-service.spec.ts` (new file)
- `apps/api/tests/note-read-service.spec.ts` (new file)

## 建议读取顺序

1. 先完整阅读 story 文件
2. 再看 patch：
   `git diff -- apps/api/src/schemas/note.ts apps/api/src/services/note-read-service.ts apps/api/src/services/note-write-service.ts apps/api/tests/note-write-service.spec.ts apps/api/tests/notes-read.spec.ts apps/api/tests/notes-write.spec.ts apps/web/src/features/note/components/OnlineNoteShell.vue apps/web/src/features/note/online-note.ts apps/web/src/features/note/use-online-note.ts apps/web/tests/online-note.spec.ts apps/web/tests/use-online-note.spec.ts packages/shared-types/src/index.ts`
3. 再补读新文件全文：
   - `apps/api/src/services/note-authorization-service.ts`
   - `apps/api/src/services/note-edit-key-service.ts`
   - `apps/api/tests/note-authorization-service.spec.ts`
   - `apps/api/tests/note-edit-key-service.spec.ts`
   - `apps/api/tests/note-read-service.spec.ts`

## 输出格式

输出 Markdown 列表。每条 finding 都要包含：

- 一行标题
- 违反了哪个 AC / 约束
- 来自代码改动的证据
