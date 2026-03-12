"use client";

import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Space, Tooltip } from "antd";
import { HEADER_ACTIONS } from "@/components/openclaw/app-layout/header-constants";

type HeaderActionsProps = {
  theme: string;
  onThemeChange: () => void;
  connected: boolean;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  children?: React.ReactNode;
};

export function HeaderActions({
  theme,
  onThemeChange,
  connected,
  connecting,
  onConnect,
  onDisconnect,
  children,
}: HeaderActionsProps) {
  const isDark = theme === "dark";

  return (
    <Space size={[8, 8]} wrap className="control-header-actions" align="center">
      {children}
      <Tooltip title={isDark ? "切换为浅色" : "切换为深色"}>
        <Button
          type="text"
          icon={isDark ? <SunOutlined /> : <MoonOutlined />}
          onClick={onThemeChange}
          aria-label={HEADER_ACTIONS.THEME}
        />
      </Tooltip>
      {connected ? (
        <Button onClick={onDisconnect}>{HEADER_ACTIONS.DISCONNECT}</Button>
      ) : (
        <Button type="primary" loading={connecting} onClick={onConnect}>
          {HEADER_ACTIONS.CONNECT}
        </Button>
      )}
    </Space>
  );
}
