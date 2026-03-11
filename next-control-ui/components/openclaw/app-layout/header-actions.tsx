"use client";

import { Button, Grid, Space } from "antd";
import { HEADER_ACTIONS } from "./header-constants";

const { useBreakpoint } = Grid;

type HeaderActionsProps = {
  theme: string;
  onThemeChange: () => void;
  navCollapsed: boolean;
  onNavCollapseToggle: () => void;
  connected: boolean;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  children?: React.ReactNode;
};

export function HeaderActions({
  theme,
  onThemeChange,
  navCollapsed,
  onNavCollapseToggle,
  connected,
  connecting,
  onConnect,
  onDisconnect,
  children,
}: HeaderActionsProps) {
  const screens = useBreakpoint();

  return (
    <Space size={[8, 8]} wrap className="control-header-actions" align="center">
      {children}
      <Button type="text" onClick={onThemeChange}>
        {HEADER_ACTIONS.THEME}：{theme}
      </Button>
      {screens.lg ? (
        <Button type="text" onClick={onNavCollapseToggle}>
          {navCollapsed ? HEADER_ACTIONS.EXPAND_NAV : HEADER_ACTIONS.COLLAPSE_NAV}
        </Button>
      ) : null}
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
