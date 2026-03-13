# Skills 视图参数数据流（参考 ui 目录）

参考：`ui/src/ui/views/skills.ts` 的 `SkillsProps` 与调用处 `app-render.ts`。说明这些参数在参考项目中如何获取。

## 1. 调用入口

`renderSkills(props)` 在 **`ui/src/ui/app-render.ts`** 中调用，仅当 `state.tab === "skills"` 时渲染。`state` 即 **OpenClawApp** 实例（`app.ts`）。

## 2. 状态字段来源（app 上的 @state）

所有数据类 props 来自 **`ui/src/ui/app.ts`** 的响应式状态：

| Props    | 状态属性      | 说明                    |
| -------- | ------------- | ----------------------- |
| loading  | skillsLoading | 拉取中                  |
| report   | skillsReport  | 列表数据，来自 Gateway  |
| error    | skillsError   | 拉取/操作错误           |
| filter   | skillsFilter  | 本地筛选关键词          |
| edits    | skillEdits    | 本地 API key 输入       |
| busyKey  | skillsBusyKey | 当前正在操作的 skillKey |
| messages | skillMessages | 每技能成功/错误提示     |

## 3. 列表数据如何获取

**`ui/src/ui/controllers/skills.ts`** 中的 **`loadSkills(state)`**：

- 调用 **`state.client.request<SkillStatusReport>("skills.status", {})`**（无参数）。
- 成功时写 **`state.skillsReport = res`**，失败时写 **`state.skillsError`**，并维护 **`state.skillsLoading`**。

**何时调用 loadSkills：**

1. **切换到 Skills 页**：`app-settings.ts` 的 `refreshActiveTab(host)` 里若 `host.tab === "skills"` 则 `await loadSkills(host)`。`refreshActiveTab` 在 `setTab` / `setTabFromRoute` 时被调用。
2. **Gateway 连接成功**：`app-gateway.ts` 的 `onHello` 里会 `refreshActiveTab(host)`，若当前 tab 已是 skills 则拉取。
3. **用户点 Refresh**：视图的 `onRefresh` 即 `() => loadSkills(state, { clearMessages: true })`。
4. **写操作成功后**：`updateSkillEnabled`、`saveSkillApiKey`、`installSkill` 内部在请求成功后都会 `loadSkills(state)`。

## 4. 本地状态与写操作

- **filter**：仅由 Filter 输入框更新，`onFilterChange` → `state.skillsFilter = next`，不请求。
- **edits**：`onEdit` → **`updateSkillEdit(state, skillKey, value)`**，只更新 `state.skillEdits`，不请求。
- **busyKey / messages**：由 controller 在写操作开始/结束、成功/失败时设置。
- **onToggle** → **`updateSkillEnabled(state, key, enabled)`** → Gateway `skills.update` `{ skillKey, enabled }`。
- **onSaveKey** → **`saveSkillApiKey(state, key)`** → Gateway `skills.update` `{ skillKey, apiKey }`（apiKey 来自 `state.skillEdits[key]`）。
- **onInstall** → **`installSkill(state, skillKey, name, installId)`** → Gateway `skills.install` `{ name, installId, timeoutMs: 120000 }`。

## 5. 小结

- **列表数据**：仅来自 Gateway **`skills.status`**，经 `loadSkills` 写入 `skillsReport`。
- **拉取时机**：进入 Skills 页、连接成功且当前在 Skills、点 Refresh、以及任意技能写操作成功后。
- **filter / edits / messages / busyKey**：均为 app 本地状态，由 controller 或视图回调更新。
