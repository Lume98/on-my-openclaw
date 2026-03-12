"use client";

import {
  Button,
  Card,
  Empty,
  Space,
  Spin,
  Table,
  Popconfirm,
  Switch,
  Typography,
  Alert,
  Col,
  Row,
  Input,
  Select,
  Form,
  Tag,
} from "antd";

export { JsonBlock, SectionCard } from "@/components/views/dashboard-components";

export function stringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function formatTimestamp(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }
  return new Date(value).toLocaleString("zh-CN");
}

export function formatDuration(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "—";
  }

  const totalSeconds = Math.floor(value / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `${days} 天 ${hours} 小时`;
  }
  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分钟`;
  }
  if (minutes > 0) {
    return `${minutes} 分钟`;
  }
  return `${totalSeconds} 秒`;
}

export function stringifyList(values: unknown) {
  return Array.isArray(values) && values.length > 0 ? values.map(String).join(", ") : "—";
}

// Re-export commonly used Ant Design components
export {
  Button,
  Card,
  Empty,
  Space,
  Spin,
  Table,
  Popconfirm,
  Switch,
  Typography,
  Alert,
  Col,
  Row,
  Input,
  Select,
  Form,
  Tag,
};
export const { Text, Title } = Typography;
