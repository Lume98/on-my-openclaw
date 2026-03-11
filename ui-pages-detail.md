# OpenClaw UI 页面详细说明

本文档详细介绍了 OpenClaw 主 UI 项目中的 13 个页面功能。

---

## 页面概览

| 页面名称  | 路径         | 图标          | 分组     |
| --------- | ------------ | ------------- | -------- |
| Chat      | `/chat`      | MessageSquare | Chat     |
| Overview  | `/overview`  | BarChart      | Control  |
| Channels  | `/channels`  | Link          | Control  |
| Instances | `/instances` | Radio         | Control  |
| Sessions  | `/sessions`  | FileText      | Control  |
| Usage     | `/usage`     | BarChart      | Control  |
| Cron      | `/cron`      | Loader        | Control  |
| Agents    | `/agents`    | Folder        | Agent    |
| Skills    | `/skills`    | Zap           | Agent    |
| Nodes     | `/nodes`     | Monitor       | Agent    |
| Config    | `/config`    | Settings      | Settings |
| Debug     | `/debug`     | Bug           | Settings |
| Logs      | `/logs`      | ScrollText    | Settings |

---

## 页面分组

### Chat 组

#### 1. Chat (`/chat`)

- **图标**: MessageSquare
- **功能**: 与 AI 助手进行对话交互
- **特点**:
  - 支持发送消息和接收回复
  - 支持流式响应显示
  - 支持消息历史查看
  - 支持附件上传
  - 支持工具输出侧边栏查看

---

### Control 组

#### 2. Overview (`/overview`)

- **图标**: BarChart
- **功能**: 系统整体概览和状态监控
- **显示内容**:
  - 系统健康状态
  - 连接状态摘要
  - 关键指标概览

#### 3. Channels (`/channels`)

- **图标**: Link
- **功能**: 管理和配置各种消息通道
- **支持的通道**:
  - Telegram
  - Discord
  - Slack
  - Signal
  - iMessage
  - WhatsApp (支持二维码登录)
  - Nostr (支持个人资料编辑)
  - Google Chat
- **功能**: 通道连接、配置、状态监控

#### 4. Instances (`/instances`)

- **图标**: Radio
- **功能**: 管理系统实例
- **功能**: 实例列表、状态监控

#### 5. Sessions (`/sessions`)

- **图标**: FileText
- **功能**: 查看和管理会话记录
- **功能**:
  - 会话列表
  - 会话筛选（按活跃状态、未知等）
  - 会话过滤（按限制、是否包含 Cron）

#### 6. Usage (`/usage`)

- **图标**: BarChart
- **功能**: 查看使用统计和费用分析
- **功能**:
  - Token 使用统计
  - 费用统计
  - 时间序列分析
  - 图表模式切换（按类型、累计、单轮）
  - 会话日志查看
  - 按日期范围筛选
  - 列和筛选器自定义

#### 7. Cron (`/cron`)

- **图标**: Loader
- **功能**: 管理定时任务
- **功能**:
  - 定时任务列表
  - 创建/编辑/删除定时任务
  - 任务运行日志
  - 任务状态监控
  - 模型建议
  - 筛选和排序（按启用状态、计划类型、最后状态）

---

### Agent 组

#### 8. Agents (`/agents`)

- **图标**: Folder
- **功能**: 管理 AI 代理
- **子面板**:
  - **Overview** - 代理概览
  - **Files** - 代理文件管理
  - **Tools** - 工具目录
  - **Skills** - 技能状态
  - **Channels** - 代理通道
  - **Cron** - 代理定时任务
- **功能**:
  - 代理列表
  - 代理身份管理
  - 文件编辑
  - 工具和技能管理

#### 9. Skills (`/skills`)

- **图标**: Zap
- **功能**: 管理技能
- **功能**:
  - 技能列表
  - 技能状态报告
  - 技能编辑
  - 技能筛选

#### 10. Nodes (`/nodes`)

- **图标**: Monitor
- **功能**: 管理节点
- **功能**:
  - 节点列表
  - 节点状态监控

---

### Settings 组

#### 11. Config (`/config`)

- **图标**: Settings
- **功能**: 系统配置管理
- **功能**:
  - 配置文件编辑（表单模式和原始模式）
  - 配置验证
  - 配置搜索
  - 配置保存和应用

#### 12. Debug (`/debug`)

- **图标**: Bug
- **功能**: 调试工具
- **功能**:
  - 状态摘要
  - 健康快照
  - 模型列表
  - 心跳信息
  - API 方法调用测试

#### 13. Logs (`/logs`)

- **图标**: ScrollText
- **功能**: 查看系统日志
- **功能**:
  - 日志文件选择
  - 日志级别筛选
  - 日志搜索
  - 自动滚动
  - 日志导出

---

## 技术栈

主 UI 项目使用 **Lit Element** 框架构建，主要技术包括：

- TypeScript
- Lit (Web Components)
- 自定义路由系统
- WebSocket 客户端（与 Gateway 通信）

---

## 相关文件

- 导航定义: `ui/src/ui/navigation.ts`
- 主应用: `ui/src/ui/app.ts`
- 视图文件: `ui/src/ui/views/`
- 渲染逻辑: `ui/src/ui/app-render.ts`
