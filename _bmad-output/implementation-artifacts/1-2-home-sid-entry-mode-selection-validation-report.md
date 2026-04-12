# Story Validation Report: 1-2-home-sid-entry-mode-selection

## Validation Result

- Story file: `_bmad-output/implementation-artifacts/1-2-home-sid-entry-mode-selection.md`
- Validation status: pass with fixes applied
- Story status after validation: `ready-for-dev`

## Summary

本次 `VS` 复核后，Story 1.2 已具备进入 `DS` 的条件。原 story 的主方向是正确的，但存在 3 个会直接影响后续实现质量的缺口，已直接修复到 story 文件中：

1. 自动生成的 `sid` 只被描述为“内部兜底”，没有明确要求它必须对用户可见，容易导致开发者把核心对象标识隐藏起来。
2. `Enter` 触发默认主路径虽然被提到，但没有明确要求采用表单提交语义，容易落成分散、脆弱的键盘监听实现。
3. 首页需要 primary / secondary 视觉层级，但当前基础 `Button` 组件只有交互状态，没有在 story 中明确“应扩展现有按钮体系而不是新造首页专用控件”。

## Fixes Applied

### 1. Visible generated sid requirement

- 新增要求：自动生成后的 `sid` 必须在首页输入区或相邻说明区中明确可见
- 明确这是产品“先拿到固定入口对象，再继续进入”的关键心智，而不是内部实现细节
- 测试要求已同步补充，防止开发者只在内部状态保留生成值

### 2. Form-first enter behavior

- 将 `Enter` 的实现 guidance 收紧为优先使用语义化 `<form>` 提交
- 避免后续在多个元素上散落 `keydown` 监听，破坏键盘路径与可访问性稳定性

### 3. Reuse existing button system

- 明确如果需要 primary / secondary 层级，应优先对现有 `Button` / `TextInput` 做非破坏性增强
- 避免开发者在首页重新拼装一套专用按钮体系，导致 Story 1.1 建立的 foundation 层失效

## Remaining Risks

- 当前 story 仍未规定最终 `sid` 的字符集，只要求 10 位和宽松输入；`DS` 阶段应在不引入过严前端校验的前提下，保持生成与归一化逻辑一致。
- 当前 story 明确不实现真实在线读取与本地持久化，`DS` 阶段若越界补做 1.3 / 1.6，会破坏 sprint 粒度。
- 若开发时选择直接替换 `FoundationShowcase.vue` 而不是拆出 `EntryShell`，需要注意不要把展示型 foundation 演示逻辑与首页业务逻辑重新耦合在一起。

## Recommendation

- 下一步可直接进入 `DS`
- 开发时优先关注首页主路径是否真正满足“输入/留空 -> 立即进入 -> 用户知道当前对象是谁”这条闭环
