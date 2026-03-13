"use client";

import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, Grid, Layout, Tooltip } from "antd";
import type { CSSProperties } from "react";
import { HeaderActions } from "@/components/app-layout/header-actions";
import { HEADER_ACTIONS } from "@/components/app-layout/header-constants";
import { StatusBadges } from "@/components/app-layout/status-badges";
import type { TabDefinition } from "@/config/navigation";

const { Header } = Layout;
const { useBreakpoint } = Grid;

// ============================================================================
// 类型定义
// ============================================================================

type HelloResponse = {
  server?: {
    version?: string | null;
  };
} | null;

export interface AppHeaderProps {
  /** 当前激活的标签页 */
  activeTab: TabDefinition;
  /** 是否已连接 */
  connected: boolean;
  /** 是否正在连接 */
  connecting: boolean;
  /** Hello 响应数据 */
  hello?: HelloResponse;
  /** 当前主题 */
  theme: string;
  /** 切换主题 */
  onThemeChange: () => void;
  /** 导航栏是否折叠 */
  navCollapsed: boolean;
  /** 切换导航栏折叠状态 */
  onNavCollapseToggle: () => void;
  /** 连接操作 */
  onConnect: () => void;
  /** 断开连接操作 */
  onDisconnect: () => void;
  /** 打开移动端导航 */
  onMobileNavOpen: () => void;
  /** 是否显示顶部导航 */
  showTopNav: boolean;
  /** 自定义样式 */
  style?: CSSProperties;
}

// ============================================================================
// 组件
// ============================================================================

export function AppHeader({
  connected,
  connecting,
  hello,
  theme,
  onThemeChange,
  navCollapsed,
  onNavCollapseToggle,
  onConnect,
  onDisconnect,
  style,
}: AppHeaderProps) {
  const screens = useBreakpoint();

  return (
    <Header className="control-header" style={style}>
      <div className="control-header-bar">
        {screens.lg ? (
          <div className="control-header-left">
            <Tooltip title={navCollapsed ? HEADER_ACTIONS.EXPAND_NAV : HEADER_ACTIONS.COLLAPSE_NAV}>
              <Button
                type="text"
                icon={navCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={onNavCollapseToggle}
                aria-label={navCollapsed ? HEADER_ACTIONS.EXPAND_NAV : HEADER_ACTIONS.COLLAPSE_NAV}
              />
            </Tooltip>
          </div>
        ) : null}
        <HeaderActions
          theme={theme}
          onThemeChange={onThemeChange}
          connected={connected}
          connecting={connecting}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        >
          <StatusBadges
            connected={connected}
            connecting={connecting}
            version={hello?.server?.version}
          />
        </HeaderActions>
      </div>
    </Header>
  );
}
