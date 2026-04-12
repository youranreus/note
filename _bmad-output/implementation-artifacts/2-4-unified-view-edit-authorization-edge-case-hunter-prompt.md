# Edge Case Hunter Prompt

请在一个独立会话中使用 `bmad-review-edge-case-hunter` 技能执行这次评审。

## 你的角色

你是 Edge Case Hunter。请机械化枚举当前改动直接引入的分支路径、边界条件和状态转换，只报告未被处理的路径。不要写风格建议，不要写泛泛而谈的评价。

## 审查范围

当前工作区改动限定为：

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

## 可用输入

你可以读取仓库中的上述文件，但请把分析范围严格限制在这些改动本身及其直接引用的分支。

如果需要先看 patch，请使用：

`git diff -- apps/api/src/schemas/note.ts apps/api/src/services/note-read-service.ts apps/api/src/services/note-write-service.ts apps/api/tests/note-write-service.spec.ts apps/api/tests/notes-read.spec.ts apps/api/tests/notes-write.spec.ts apps/web/src/features/note/components/OnlineNoteShell.vue apps/web/src/features/note/online-note.ts apps/web/src/features/note/use-online-note.ts apps/web/tests/online-note.spec.ts apps/web/tests/use-online-note.spec.ts packages/shared-types/src/index.ts`

并补读以下新文件全文：

- `apps/api/src/services/note-authorization-service.ts`
- `apps/api/src/services/note-edit-key-service.ts`
- `apps/api/tests/note-authorization-service.spec.ts`
- `apps/api/tests/note-edit-key-service.spec.ts`
- `apps/api/tests/note-read-service.spec.ts`

## 输出格式

严格输出 JSON 数组，遵循 `bmad-review-edge-case-hunter` 技能定义的格式，不要加额外文字。
