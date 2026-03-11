"use client";

import { Button, Layout, Menu, Typography } from "antd";
import type { MenuProps } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, type CSSProperties } from "react";
import { Icon } from "@/components/icons";
import { getTabByPath, tabGroups, tabs } from "@/components/openclaw/navigation";

const { Sider } = Layout;
const { Text, Title } = Typography;

type SidebarProps = {
  pathname: string;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  showSider: boolean;
  showContentOnly?: boolean;
  onMenuItemClick?: () => void;
  theme: "light" | "dark";
  style?: CSSProperties;
};

export function Sidebar({
  pathname,
  collapsed,
  onCollapse,
  showSider,
  showContentOnly,
  onMenuItemClick,
  theme,
  style,
}: SidebarProps) {
  const router = useRouter();
  const activeTab = useMemo(() => getTabByPath(pathname), [pathname]);

  const sideMenuItems = useMemo<MenuProps["items"]>(
    () =>
      tabGroups.map((group) => ({
        key: group.key,
        label: group.title,
        type: "group" as const,
        children: tabs
          .filter((tab) => tab.group === group.key)
          .map((tab) => ({
            key: tab.path,
            icon: <Icon name={tab.icon} size={16} />,
            label: tab.title,
          })),
      })),
    [],
  );

  const sidebarContent = (
    <div className="control-sider-content">
      <div className="control-brand">
        <Link href="/chat" className="control-brand-link">
          <div className="control-brand-badge">OC</div>
          {!collapsed ? (
            <div className="control-brand-copy">
              <Title level={5} style={{ margin: 0 }}>
                OpenClaw
              </Title>
              <Text type="secondary">Gateway Dashboard</Text>
            </div>
          ) : null}
        </Link>
      </div>

      <div className="control-nav-menu-wrapper">
        <Menu
          mode="inline"
          selectedKeys={[activeTab.path]}
          items={sideMenuItems}
          onClick={({ key }) => {
            router.push(String(key));
            onMenuItemClick?.();
          }}
          className="control-nav-menu"
        />
      </div>

      <div className="control-sider-footer">
        <Button type="link" href="https://docs.openclaw.ai" target="_blank" rel="noreferrer">
          文档
        </Button>
      </div>
    </div>
  );

  if (showContentOnly) {
    return <>{sidebarContent}</>;
  }

  if (!showSider) {
    return null;
  }

  return (
    <Sider
      theme={theme}
      width={232}
      collapsedWidth={88}
      collapsible
      trigger={null}
      collapsed={collapsed}
      onCollapse={onCollapse}
      className="control-sider"
      style={style}
    >
      {sidebarContent}
    </Sider>
  );
}
