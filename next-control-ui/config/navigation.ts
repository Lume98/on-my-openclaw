import type { IconName } from "@/components/icons";

export type TabKey =
  | "chat"
  | "overview"
  | "channels"
  | "instances"
  | "sessions"
  | "usage"
  | "cron"
  | "agents"
  | "skills"
  | "nodes"
  | "config"
  | "debug"
  | "logs"
  | "docs";

export type TabGroupKey = "chat" | "control" | "agent" | "settings" | "docs";

export type TabDefinition = {
  key: TabKey;
  path: `/${string}` | `https://${string}`;
  title: string;
  subtitle: string;
  icon: IconName;
  group: TabGroupKey;
};

export const tabGroups: Array<{ key: TabGroupKey; title: string }> = [
  { key: "chat", title: "对话" },
  { key: "control", title: "控制" },
  { key: "agent", title: "代理" },
  { key: "settings", title: "设置" },
  { key: "docs", title: "文档" },
];

export const tabs: TabDefinition[] = [
  {
    key: "chat",
    path: "/chat",
    title: "聊天",
    subtitle: "连接网关并直接与 OpenClaw 助手交互。",
    icon: "messageSquare",
    group: "chat",
  },
  {
    key: "overview",
    path: "/overview",
    title: "概览",
    subtitle: "查看网关版本、连接状态和关键摘要。",
    icon: "barChart",
    group: "control",
  },
  {
    key: "channels",
    path: "/channels",
    title: "通道",
    subtitle: "检查消息通道状态与账户映射。",
    icon: "link",
    group: "control",
  },
  {
    key: "instances",
    path: "/instances",
    title: "实例",
    subtitle: "查看系统在线实例与 Presence 快照。",
    icon: "radio",
    group: "control",
  },
  {
    key: "sessions",
    path: "/sessions",
    title: "会话",
    subtitle: "筛选、查看和管理会话条目。",
    icon: "fileText",
    group: "control",
  },
  {
    key: "usage",
    path: "/usage",
    title: "用量",
    subtitle: "汇总 token、费用与时间序列信息。",
    icon: "barChart",
    group: "control",
  },
  {
    key: "cron",
    path: "/cron",
    title: "定时任务",
    subtitle: "查看任务状态、任务列表和运行记录。",
    icon: "loader",
    group: "control",
  },
  {
    key: "agents",
    path: "/agents",
    title: "代理",
    subtitle: "管理代理列表、身份信息和工具目录。",
    icon: "folder",
    group: "agent",
  },
  {
    key: "skills",
    path: "/skills",
    title: "技能",
    subtitle: "管理技能可用性和 API 密钥注入。",
    icon: "zap",
    group: "agent",
  },
  {
    key: "nodes",
    path: "/nodes",
    title: "节点",
    subtitle: "查看执行节点与分布式运行信息。",
    icon: "monitor",
    group: "agent",
  },
  {
    key: "config",
    path: "/config",
    title: "配置",
    subtitle: "以原始 JSON 方式查看、保存和应用配置。",
    icon: "settings",
    group: "settings",
  },
  {
    key: "debug",
    path: "/debug",
    title: "调试",
    subtitle: "执行方法调用并检查状态、健康与模型信息。",
    icon: "bug",
    group: "settings",
  },
  {
    key: "logs",
    path: "/logs",
    title: "日志",
    subtitle: "拉取网关日志，按时间和级别快速排查。",
    icon: "scrollText",
    group: "settings",
  },
  {
    key: "docs",
    path: "https://docs.openclaw.ai",
    title: "文档",
    subtitle: "查看 OpenClaw 官方文档和参考资源。",
    icon: "book",
    group: "docs",
  },
];

export const tabMap = new Map<TabKey, TabDefinition>(tabs.map((tab) => [tab.key, tab]));
export const pathMap = new Map<string, TabDefinition>(
  tabs.filter((tab) => !tab.path.startsWith("http")).map((tab) => [tab.path, tab]),
);

export function getTabDefinition(tabKey: TabKey) {
  return tabMap.get(tabKey) ?? tabMap.get("chat")!;
}

export function getTabByPath(pathname: string): TabDefinition {
  const direct = pathMap.get(pathname);
  if (direct) {
    return direct;
  }

  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return pathMap.get(normalized) ?? tabMap.get("chat")!;
}
