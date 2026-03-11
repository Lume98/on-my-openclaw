/** Header 组件常量 */

export const CONNECTION_STATUS = {
  CONNECTED: "已连接",
  CONNECTING: "连接中",
  DISCONNECTED: "未连接",
} as const;

export const HEADER_ACTIONS = {
  THEME: "主题",
  EXPAND_NAV: "展开导航",
  COLLAPSE_NAV: "收起导航",
  DISCONNECT: "断开",
  CONNECT: "连接网关",
} as const;

export const HEADER_LABELS = {
  ONLINE_INSTANCES: "在线实例",
  VERSION: "版本",
  UNKNOWN: "未知",
} as const;
