# Story 3.4: 个人中心的可访问性与状态一致性

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 已登录用户，
I want 个人中心的 tab、列表和关闭行为在键盘与触控场景都清楚可用，
so that 我可以稳定地管理资产而不会因交互细节丢失上下文。

## Acceptance Criteria

1. 用户通过键盘操作个人中心时，在 tab、列表项和关闭按钮之间移动，焦点顺序必须符合视觉与操作顺序；tab 切换、关闭弹层和选择列表项都必须支持键盘完成。
2. 用户通过触控或鼠标操作个人中心时，点击状态 pill、列表项或关键操作按钮，高频点击区域尺寸必须接近或达到 `44x44px`，且不能出现视觉可见但实际难以点击的热区。
3. 用户关闭个人中心时，无论通过关闭按钮、遮罩还是 `Escape` 关闭 `UserCenterModal`，焦点都必须返回触发该弹层的 `AuthStatusPill`，且不丢失当前页面上下文。
4. 个人中心在移动端与桌面端都必须保持 modal 尺寸与列表布局可用；“我的创建 / 我的收藏”两类资产结构不能因响应式调整而改变语义。

## Tasks / Subtasks

- [x] Task 1: 收口 `AuthStatusPill -> UserCenterModal` 的打开、关闭与回焦语义，保证登录入口与资产入口在键盘和触控场景都稳定可用 (AC: 2, 3)
  - [x] 保持 `AuthStatusPill` 为右上角唯一状态入口：匿名用户点击仍打开 `SsoConfirmModal`，已登录用户点击仍打开 `UserCenterModal`，不要新增独立账户按钮或后台入口。
  - [x] 统一 `UserCenterModal` 的关闭回焦规则，确保点击关闭按钮、点击遮罩、自定义 close 事件、按下 `Escape` 等路径最终都把焦点返回到 `AuthStatusPill`，避免共享 UI 层和业务层各自维护回焦而产生不一致。
  - [x] 为 `AuthStatusPill` 触发按钮补齐明确的可见焦点态与接近或达到 `44x44px` 的热区；不要只让内部 `StatusPill` 看起来可点，而外层真实按钮命中区过小。

- [x] Task 2: 在共享 UI 层强化 modal 与 tabs 的可访问性语义，优先补强现有组件而不是重造交互体系 (AC: 1, 3)
  - [x] 在 `apps/web/src/components/ui/Modal.vue` 中保持 `role="dialog"`、`aria-modal`、标题/描述关联与焦点陷阱，同时优化打开时的初始焦点落点，使其更符合用户对“先理解内容再操作”或“先到第一个逻辑控件”的预期。
  - [x] 确保 modal 内 `Tab` / `Shift+Tab` 不会逃出弹层，并且当弹层关闭时，回焦目标与当前工作流一致；不要引入 `tabindex > 0` 或依赖脆弱的 DOM 顺序 hack。
  - [x] 在 `apps/web/src/components/ui/SegmentedTabs.vue` 中补齐更完整的 tabs 语义，例如 `tablist` / `tab` / `tabpanel` 关联、左右箭头切换、当前激活项可聚焦等；若加入 `Home` / `End` 等增强行为，也必须保持现有 `v-model` 和 `data-testid` 契约不回归。

- [x] Task 3: 调整 `UserCenterModal` 内 tab、列表和关闭动作的焦点顺序与点击热区，保持“我的创建 / 我的收藏”一致可用 (AC: 1, 2, 4)
  - [x] 在 `apps/web/src/features/user-panel/components/UserCenterModal.vue` 中检查 tab、列表项、分页按钮、空状态 CTA、关闭按钮的视觉顺序与实际键盘顺序是否一致；不要让用户在视觉上向下移动时，焦点却跳回上方或进入难以理解的路径。
  - [x] 强化列表区可操作元素的命中区域。可以通过“整行可操作”或“明确且足够大的 CTA 按钮”达成，但必须避免出现卡片看似可点、实际只有很小一块热区生效的情况。
  - [x] 保持“我的创建”和“我的收藏”在响应式布局下仍然是两类语义清晰的资产列表，不把 favorites 重新伪装为 created，也不新增独立资产详情页或后台页。
  - [x] 点击资产条目后仍应关闭 modal 并进入既有 `/note/o/:sid` 对象页，关闭但不导航时仍回到触发 pill；不要破坏 Story 3.2 / 3.3 已建立的对象层返回语义。

- [x] Task 4: 收口个人中心在移动端与桌面端的尺寸、布局和状态反馈一致性，避免只在一种屏宽下可用 (AC: 2, 4)
  - [x] 继续采用“最大宽度 + 百分比宽度”的 modal 容器约束，保证移动端不会出现弹层溢出、关闭按钮难以命中或列表文字被压缩到不可读。
  - [x] 保持 loading、error、empty、分页进度等状态在不同屏宽下依旧可见、可读、可操作，且状态提示不只依赖颜色。
  - [x] 不要因为响应式适配把个人中心从 overlay 弹层改成独立后台页、侧边栏或新导航结构；本故事只允许增强当前 modal 体验。

- [x] Task 5: 为键盘路径、回焦、触控热区与响应式不变量补齐 Web 回归测试，防止 3.2 / 3.3 行为回归 (AC: 1, 2, 3, 4)
  - [x] 在 `apps/web/tests/auth-status-pill.spec.ts` 中至少覆盖：已登录用户打开个人中心、关闭个人中心后焦点回到 trigger、`Escape` 关闭后的回焦、匿名用户路径仍打开 `SsoConfirmModal`。
  - [x] 在 `apps/web/tests/user-center-modal.spec.ts` 中至少覆盖：tab 键盘切换至少双向成立、资产动作可通过键盘触发、空状态 CTA 与分页按钮焦点/事件不回归。
  - [x] 若 shared UI 层新增了更明确的 tabs / modal 语义，可在现有测试文件中扩展，或补充针对 `Modal.vue` / `SegmentedTabs.vue` 的 focused unit tests；优先沿用当前 Vitest + `@vue/test-utils` 模式，不额外引入新测试框架。
  - [x] 至少执行 `pnpm --filter @note/web test`、`pnpm --filter @note/web typecheck`；如果本故事调整了共享 UI 影响打包入口，再补跑 `pnpm --filter @note/web build`。

### Review Findings

- [x] [Review][Patch] 从 favorites 打开个人中心时，初始焦点会落到错误的 tab 上 [`apps/web/src/components/ui/Modal.vue:108`]
- [x] [Review][Patch] 缺少“点击遮罩关闭后回焦到触发 pill”的回归测试 [`apps/web/tests/auth-status-pill.spec.ts:577`]

## Dev Notes

### Story Intent

Story 3.4 的重点不是“再做一次视觉 polish”，而是把 Story 3.2 和 Story 3.3 已经跑通的用户中心路径，收口成一条对键盘用户、触控用户和响应式场景都稳定可信的资产入口。用户已经可以打开个人中心、查看“我的创建 / 我的收藏”、返回对象页；现在需要把这些行为的焦点顺序、热区尺寸、关闭回焦和响应式一致性补齐，避免因为交互细节让人掉出上下文。

这个故事最容易做坏的地方有四个：第一，在业务层重新造一套 modal / tabs / focus 逻辑，破坏 Story 3.2 已建立的 shared UI 复用；第二，只补测试用例，不真正修 `AuthStatusPill` 热区、`SegmentedTabs` 语义或 `Modal` 初始焦点等真实缺口；第三，把可访问性范围无限放大成整站 WCAG 审计，导致故事失焦；第四，为了“更好点按”把个人中心升级成独立后台或整页路由，破坏产品的轻路径心智。实现时必须坚持“在现有 modal 体系内增量增强 shared UI 和 user-panel”的路线。

### Requirement Traceability

- FR32, FR33, FR34, FR35, FR36
- NFR15, NFR16, NFR17
- UX-DR9, UX-DR10, UX-DR11, UX-DR13, UX-DR14, UX-DR15, UX-DR17, UX-DR19

### Cross-Story Context

- Story 2.1 已经把登录确认、回跳恢复和 `SsoConfirmModal` 链路稳定下来，因此 3.4 不能回归匿名点击 `AuthStatusPill` 时的登录 modal、焦点陷阱或返回当前上下文语义。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/implementation-artifacts/2-1-sso-login-callback-recovery.md]
- Story 3.2 已经建立 `AuthStatusPill -> UserCenterModal -> 我的创建` 的统一入口，并明确要求复用 `Modal`、`SegmentedTabs`、`ListItem` 等 foundation 组件；3.4 应继续增强这套 shared UI 契约，而不是新造用户中心专用 overlay。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/implementation-artifacts/3-2-user-center-my-created-notes.md]
- Story 3.3 已经补齐“我的收藏”列表、对象层返回语义与 favorites 缓存闭环，并明确指出 3.4 会继续收口个人中心完整可访问性与状态一致性。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/implementation-artifacts/3-3-my-favorites-context-return.md]
- Story 1.3 已经稳定了 `/note/o/:sid` 的在线便签对象页路径，因此 3.4 中无论从 created 还是 favorites 进入条目，都应继续回到这条既有对象路由，而不是派生新的资产详情页。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/implementation-artifacts/1-3-read-online-note-by-sid.md]

### Previous Story Intelligence

- 3.2 建立的 `AuthStatusPill` 回焦策略与 3.3 延续的“若未导航则回焦 trigger”模式，说明 3.4 最稳妥的做法是收口回焦职责，而不是引入第二套分散在多个组件中的焦点恢复逻辑。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/layout/AuthStatusPill.vue]
- 3.3 已经把 favorites 与 created 的请求状态、分页、懒加载和缓存 scope 对齐到同一 `useUserPanel` 模式，因此 3.4 不应该把关注点重新拉回数据层，而应专注交互层的 a11y 与状态一致性。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/features/user-panel/use-user-panel.ts]
- 现有测试已经覆盖用户中心关闭回焦、favorites 导航与空状态 CTA 保持当前对象页上下文，说明 3.4 应优先做“增强并补回归”，不是推翻现有测试基线。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/tests/auth-status-pill.spec.ts]

### Current Codebase Findings

- `apps/web/src/components/ui/Modal.vue` 已具备 `role="dialog"`、`aria-modal="true"`、Esc 关闭、焦点陷阱与关闭后恢复焦点，但当前打开时默认聚焦整个 dialog 容器，具体初始焦点策略仍可优化。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/Modal.vue]
- `apps/web/src/components/ui/SegmentedTabs.vue` 已支持左右箭头切换和当前激活 tab 的 roving tabindex，但目前只落到了 `tablist` / `tab` 级别，还没有与面板建立更完整的 `tabpanel` 关联。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/SegmentedTabs.vue]
- `apps/web/src/components/layout/AuthStatusPill.vue` 已区分匿名打开 `SsoConfirmModal` 与已登录打开 `UserCenterModal`，并在用户中心关闭后双 `nextTick()` 回焦 trigger；但触发按钮本身尚未像 shared `Button` 一样显式保证 `min-h-11` 一类热区约束。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/layout/AuthStatusPill.vue] [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/Button.vue]
- `apps/web/src/features/user-panel/components/UserCenterModal.vue` 当前已经渲染 created/favorites 列表、分页与空状态，但资产操作主要由卡片内 secondary button 承担，是否形成“完整可点击列表项”与是否完全满足 `44x44px` 热区要求仍需要 3.4 收口。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/features/user-panel/components/UserCenterModal.vue] [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/ListItem.vue]
- `apps/web/tests/user-center-modal.spec.ts` 目前覆盖了 created/favorites 渲染、空状态和单向 ArrowRight tab 切换；`apps/web/tests/auth-status-pill.spec.ts` 已覆盖关闭回焦、favorites 导航和保留当前对象页上下文，适合作为 3.4 回归测试的扩展基础。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/tests/user-center-modal.spec.ts] [Source: /Users/reuszeng/Code/Projects/note/apps/web/tests/auth-status-pill.spec.ts]

### Technical Requirements

- 用户中心相关关键操作必须支持键盘完成，至少包括：
  - `AuthStatusPill` 打开个人中心
  - `SegmentedTabs` 切换 created / favorites
  - modal 关闭
  - created / favorites 资产进入动作
  - 空状态 CTA 与分页按钮
- 焦点顺序必须和视觉顺序一致；如果共享 UI 层调整了 DOM 结构，也不能让键盘用户经历“先到关闭按钮、再回到 tabs、再跳入内容区”之类违背界面心智的路径。
- `UserCenterModal` 关闭后必须把焦点返回到触发它的 `AuthStatusPill`；这个规则应对关闭按钮、遮罩点击、`Escape` 关闭和程序化 close 一致成立。
- 高频点击区域至少覆盖 `AuthStatusPill`、tabs、资产进入动作、分页按钮、空状态 CTA、关闭按钮；这些热区在移动端应接近或达到 `44x44px`。
- 响应式增强只允许改变尺寸、间距和排布，不允许改变 created / favorites 的语义边界，也不允许把 modal 改造成独立后台页或侧边栏工作台。
- 所有状态提示继续遵守“不能只依赖颜色”的规则；loading、error、empty、分页进度都必须保留明确文案。
- 本故事应尽量限制在 Web 端 shared UI 与 `features/user-panel` 范围内；若无明确必要，不要扩散到 API、数据库或 auth/favorite 业务语义。

### Architecture Compliance

- 保持 SPA + overlay 语义：用户中心继续是全局弹层，不是新路由、不是后台页、不是 dashboard。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md] [Source: /Users/reuszeng/Code/Projects/note/docs/tech-solution.md]
- 保持模块边界：`features/user-panel` 负责业务聚合面板；`components/ui` 负责通用 modal、tabs、button、list item 等共享实现，但不引入业务判断。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md]
- 保持状态分层：Pinia 只管理会话/UI，远端 created/favorites 列表仍由 Alova 和 `useUserPanel` 管理；3.4 不允许把“为了可访问性方便”演变成将资产列表塞进 store。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md] [Source: /Users/reuszeng/Code/Projects/note/docs/tech-solution.md]
- 保持对象层返回语义：从资产列表进入内容时仍导航到 `/note/o/:sid`，关闭但不导航时则留在原页面并回焦到 trigger。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]

### Library / Framework Requirements

- 继续沿用当前 Web 端栈：`vue@^3.5.13`、`vue-router@^4.4.5`、`pinia@^2.3.0`、`alova@^3.0.6`、`@vue/test-utils@^2.4.6`、`vitest@^2.1.8`。本故事不需要顺手升级依赖。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/package.json]
- 优先依赖原生 button 语义和 Vue 响应式更新，而不是引入新的可访问性 UI 库或焦点管理库；当前仓库已经具备 `Modal`、`SegmentedTabs`、`Button` 等足够的 shared UI 基础。 [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/Modal.vue] [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/SegmentedTabs.vue] [Source: /Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/Button.vue]
- WAI-ARIA APG 对 modal dialog 的当前建议仍要求：焦点限制在 dialog 内、打开后焦点进入 dialog、关闭后通常返回触发元素；3.4 应对齐这条行为基线。 [Source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/]
- WAI-ARIA APG 对 tabs 的当前建议仍要求：`tablist` / `tab` / `tabpanel` 语义关联、左右箭头移动当前 tab 焦点，并让活跃 tab 成为进入 tablist 后的焦点落点。 [Source: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/]

### File Structure Requirements

- 很可能需要修改：
  - `apps/web/src/components/layout/AuthStatusPill.vue`
  - `apps/web/src/components/ui/Modal.vue`
  - `apps/web/src/components/ui/SegmentedTabs.vue`
  - `apps/web/src/features/user-panel/components/UserCenterModal.vue`
  - `apps/web/tests/auth-status-pill.spec.ts`
  - `apps/web/tests/user-center-modal.spec.ts`
- 可能需要小幅修改：
  - `apps/web/src/components/ui/ListItem.vue`（仅当决定把整行资产项做成更完整的可操作热区时）
  - `apps/web/src/components/ui/Button.vue`（仅当现有 shared button 无法覆盖某些触控尺寸或焦点态需求时）
- 如 shared UI 被明显增强，允许新增 focused unit tests，例如：
  - `apps/web/tests/modal.spec.ts`
  - `apps/web/tests/segmented-tabs.spec.ts`
- 一般不应修改：
  - `apps/api/**`
  - `apps/web/src/features/auth/**`
  - `apps/web/src/features/note/**`
  - `apps/web/src/services/me-methods.ts`
  - Story 4.x 删除与终态反馈逻辑

### Testing Requirements

- Web / UI 层至少覆盖：
  - 已登录用户通过键盘或鼠标打开 `UserCenterModal`
  - 关闭按钮、`Escape`、必要时遮罩关闭后都回焦到 `AuthStatusPill`
  - `SegmentedTabs` 至少支持左右双向切换，并保持 active tab 的 roving focus 行为
  - created / favorites 资产动作可通过键盘触发，且继续导航到 `/note/o/:sid`
  - 空状态 CTA 与分页按钮在键盘路径中可到达、可触发、不破坏当前上下文语义
  - 高频交互元素具备接近或达到 `44x44px` 的尺寸约束，可通过 class 断言或实际尺寸断言验证
- 回归要求：
  - 匿名用户点击 `AuthStatusPill` 仍打开 `SsoConfirmModal`
  - Story 3.2 的“我的创建”列表渲染、关闭回焦与首页 CTA 行为不回归
  - Story 3.3 的 favorites tab、对象层返回语义、空收藏 CTA 保持当前对象页上下文不回归
  - 不引入 created/favorites 数据层、缓存层或路由层行为变化
- 建议执行：
  - `pnpm --filter @note/web test`
  - `pnpm --filter @note/web typecheck`
  - 如 shared UI 影响编译入口，再执行 `pnpm --filter @note/web build`

### Git Intelligence Summary

- 最近提交依次为 `fix(user-panel): address story 3.3 review findings`、`feat: add my favorites return flow`、`fix: address story 3.2 review findings`、`chore: sync epic 2 sprint status`、`feat: add user center created notes flow`。这说明当前主线是在既有 `user-panel` 能力上做渐进加固，而不是推倒重建；3.4 应继续遵循“沿现有 shared UI 与测试基线增量增强”的节奏。 [Source: `git log --oneline -5` on 2026-04-10]

### Latest Technical Notes

- WAI 的 modal dialog 模式仍强调：打开后焦点应进入 dialog 内部，`Tab` / `Shift+Tab` 不应逃出弹层，关闭后通常返回触发元素；如果 dialog 内容较长或需要先感知结构，也可以把初始焦点放到顶部静态元素，而不是盲目聚焦第一个按钮。 [Source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/]
- WAI 的 tabs 模式仍强调：活跃 tab 应是 tablist 的默认焦点，左右箭头负责在 tabs 之间移动，`tabpanel` 应与对应 tab 建立语义关联；若 panel 内首个有意义内容本身不可聚焦，可考虑让 `tabpanel` 可进入 tab 顺序。 [Source: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/]
- 规划文档间存在一个需要显式识别的张力：PRD 把首版目标写为“基础可访问性”，而 UX 规格建议以 `WCAG AA` 为目标。3.4 应以 Epic 3.4 的 AC 和 UX 规格中的键盘 / 回焦 / 44x44 / 响应式要求为直接落地依据，但不把本故事扩张成全站无障碍重构。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/prd.md] [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md]

### Project Structure Notes

- 项目上下文明确要求：默认使用 `pnpm`，中文输出，文档与真实代码冲突时需显式指出后再决策；3.4 的实现建议应继续以真实仓库当前的 `AuthStatusPill`、`Modal`、`SegmentedTabs`、`UserCenterModal` 为改造对象，而不是按理想蓝图新开一套目录。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/project-context.md]
- 架构与技术方案共同要求 `features/user-panel` 作为“我的创建 / 我的收藏”的聚合面板，`AuthStatusPill` 作为全局状态入口，Pinia 只保留会话/UI，列表数据继续由 Alova 驱动；3.4 不应借 a11y 改造之名破坏这些边界。 [Source: /Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md] [Source: /Users/reuszeng/Code/Projects/note/docs/tech-solution.md]

### References

- [epics.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/epics.md)
- [prd.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/prd.md)
- [architecture.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/architecture.md)
- [ux-design-specification.md](/Users/reuszeng/Code/Projects/note/_bmad-output/planning-artifacts/ux-design-specification.md)
- [project-context.md](/Users/reuszeng/Code/Projects/note/_bmad-output/project-context.md)
- [tech-solution.md](/Users/reuszeng/Code/Projects/note/docs/tech-solution.md)
- [2-1-sso-login-callback-recovery.md](/Users/reuszeng/Code/Projects/note/_bmad-output/implementation-artifacts/2-1-sso-login-callback-recovery.md)
- [3-2-user-center-my-created-notes.md](/Users/reuszeng/Code/Projects/note/_bmad-output/implementation-artifacts/3-2-user-center-my-created-notes.md)
- [3-3-my-favorites-context-return.md](/Users/reuszeng/Code/Projects/note/_bmad-output/implementation-artifacts/3-3-my-favorites-context-return.md)
- [AuthStatusPill.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/components/layout/AuthStatusPill.vue)
- [Modal.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/Modal.vue)
- [SegmentedTabs.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/SegmentedTabs.vue)
- [Button.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/Button.vue)
- [ListItem.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/components/ui/ListItem.vue)
- [UserCenterModal.vue](/Users/reuszeng/Code/Projects/note/apps/web/src/features/user-panel/components/UserCenterModal.vue)
- [auth-status-pill.spec.ts](/Users/reuszeng/Code/Projects/note/apps/web/tests/auth-status-pill.spec.ts)
- [user-center-modal.spec.ts](/Users/reuszeng/Code/Projects/note/apps/web/tests/user-center-modal.spec.ts)
- [WAI Modal Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [WAI Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

## Change Log

- 2026-04-10: 创建 Story 3.4 上下文，明确个人中心在键盘、回焦、触控热区与响应式场景下的实现边界、shared UI 强化点与 Web 回归测试要求，供后续 `dev-story` 直接实现。
- 2026-04-10: 完成 Story 3.4 实现，增强 `AuthStatusPill`、`Modal`、`SegmentedTabs` 与 `UserCenterModal` 的焦点管理、tabs 语义和高频热区，并通过 `@note/web` 全量测试、`typecheck` 与 `build` 验证。

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Implementation Plan

- 先补回归测试，锁住 `AuthStatusPill` 触发器热区、`Escape` 关闭回焦、`UserCenterModal` 初始焦点、双向 tab 键盘切换与 `tabpanel` 语义关联。
- 再增量增强 shared UI：为 `Modal` 增加可配置初始焦点与统一默认关闭按钮，为 `SegmentedTabs` 增加 `id` / `aria-controls` / `aria-orientation` 以及更完整的键盘行为。
- 最后把这些语义接回 `UserCenterModal` 与 `AuthStatusPill`，并通过 Web 全量测试、`typecheck` 和 `build` 完成验收。

### Debug Log References

- 已完整读取 `sprint-status.yaml`，确认当前第一条 backlog story 为 `3-4-user-center-accessibility-consistency`。
- 已抽取 Epic 3 中 Story 3.4 的用户故事与 AC，并核对 PRD、架构、UX、项目上下文与 `docs/tech-solution.md` 中关于个人中心、响应式和基础可访问性的约束。
- 已检查真实代码，确认当前最相关的实现落点为 `AuthStatusPill.vue`、`Modal.vue`、`SegmentedTabs.vue`、`UserCenterModal.vue` 与现有 Vitest 测试基线，而不是 API 或数据库层。
- 已补充 WAI APG 的 modal dialog 与 tabs 当前建议，用于约束焦点管理、tab 语义关联与回焦行为。
- 已识别文档张力：PRD 以“基础可访问性”为 MVP 基线，UX 规格建议以 `WCAG AA` 为目标；本 story 选择以 Epic 3.4 AC 和 UX 关键规则作为直接落地范围，不扩张为全站 a11y 重构。
- 已先补充失败测试，确认当前缺口集中在 `AuthStatusPill` 热区、`SegmentedTabs` 的 `tabpanel` 关联、用户中心默认初始焦点和默认关闭按钮热区。
- 已在 `apps/web/src/components/ui/Modal.vue` 中加入可配置初始焦点策略、`immediate` 焦点同步，并将默认关闭按钮切换到 shared `Button`，统一热区与焦点样式。
- 已在 `apps/web/src/components/ui/SegmentedTabs.vue` 中补齐 `idPrefix` / `ariaLabel` / `aria-controls` / `aria-orientation`，同时把 tab 按钮热区提升到 `min-h-11` / `min-w-11`，并支持 `Home` / `End`。
- 已在 `apps/web/src/features/user-panel/components/UserCenterModal.vue` 中接入 `initial-focus="first-focusable"`、为 created/favorites 面板补 `tabpanel` 语义，并保持对象层返回语义不变。
- 已在 `apps/web/src/components/layout/AuthStatusPill.vue` 中把 trigger 升级为更明确的 `44x44` 级命中区，并使用 Vue 3.5 的 `useTemplateRef()` 保持模板 ref 写法一致。
- 已执行 `pnpm --filter @note/web test -- tests/user-center-modal.spec.ts tests/auth-status-pill.spec.ts`，Vitest 实际跑完整个 `@note/web` 测试集，13 个测试文件共 96 项全部通过。
- 已执行 `pnpm --filter @note/web typecheck` 与 `pnpm --filter @note/web build`，均通过。

### Completion Notes List

- 已为 Story 3.4 生成可直接交给 `dev-story` 使用的上下文文件，重点收口 `AuthStatusPill`、`Modal`、`SegmentedTabs` 与 `UserCenterModal` 的键盘、回焦、热区和响应式一致性。
- 已实现用户中心打开后的首个逻辑焦点落到激活 tab，并保持 `Modal` 焦点陷阱、`Escape` 关闭与关闭后回焦到 `AuthStatusPill` 的行为一致。
- 已实现 `SegmentedTabs` 与 `UserCenterModal` 的 `tab` / `tabpanel` 语义关联、双向箭头切换和更完整的横向 tabs 可访问性契约。
- 已将 `AuthStatusPill`、tabs 和默认关闭动作统一到接近或达到 `44x44px` 的高频命中区，不改变“我的创建 / 我的收藏”的资产语义和对象层返回路径。
- 已通过 `@note/web` 全量测试、`typecheck` 与 `build` 验证本次 shared UI 改动无回归。

### File List

- _bmad-output/implementation-artifacts/3-4-user-center-accessibility-consistency.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- apps/web/src/components/layout/AuthStatusPill.vue
- apps/web/src/components/ui/Modal.vue
- apps/web/src/components/ui/SegmentedTabs.vue
- apps/web/src/features/user-panel/components/UserCenterModal.vue
- apps/web/tests/auth-status-pill.spec.ts
- apps/web/tests/user-center-modal.spec.ts
