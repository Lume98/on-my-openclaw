"use client";

import {
  Card,
  Button,
  Table,
  Empty,
  Spin,
  Space,
  Popconfirm,
  Switch,
  Typography,
  Alert,
} from "antd";
import type { ReactNode } from "react";
import type { TabKey } from "@/components/navigation";

export type DashboardPageProps = {
  tabKey: TabKey;
};

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
};

export function JsonBlock({ value, height = 320 }: { value: unknown; height?: number }) {
  return (
    <pre className="control-json-block" style={{ maxHeight: height }}>
      {stringify(value)}
    </pre>
  );
}

function stringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function SectionCard({
  title,
  extra,
  children,
}: {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card title={title} extra={extra} className="control-card">
      {children}
    </Card>
  );
}

// Re-export commonly used components
export { Button, Table, Empty, Spin, Space, Popconfirm, Switch, Typography, Alert };
