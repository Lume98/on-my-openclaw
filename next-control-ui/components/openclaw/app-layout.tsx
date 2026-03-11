"use client";

import {
  Badge,
  Breadcrumb,
  Button,
  Drawer,
  Grid,
  Input,
  Layout,
  Menu,
  Modal,
  Space,
  Tag,
  theme,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { getTabByPath, type TabGroupKey, tabGroups, tabs } from "@/components/openclaw/navigation";
import { useGateway } from "@/components/openclaw/providers/gateway-provider";
import { useSettings } from "@/components/openclaw/providers/settings-provider";

type AppLayoutProps = {
  children: React.ReactNode;
};

const { Header, Sider, Content, Footer } = Layout;
const { useBreakpoint } = Grid;
const { Text, Title } = Typography;

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const screens = useBreakpoint();
  const {
    token: {
      borderRadiusLG,
      boxShadowSecondary,
      colorBgContainer,
      colorBorderSecondary,
      colorTextDescription,
    },
  } = theme.useToken();
  const activeTab = useMemo(() => getTabByPath(pathname), [pathname]);
  const activeGroup = useMemo(
    () => tabGroups.find((group) => group.key === activeTab.group) ?? tabGroups[0],
    [activeTab.group],
  );
  const {
    settings,
    password,
    pendingGatewayUrl,
    applySettings,
    setPassword,
    setTheme,
    confirmPendingGatewayUrlChange,
    cancelPendingGatewayUrlChange,
  } = useSettings();
  const { connected, connecting, connect, disconnect, hello, presenceEntries, lastError } =
    useGateway();
  const [connectOpen, setConnectOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
  const topMenuItems = useMemo<MenuProps["items"]>(
    () =>
      tabGroups.map((group) => ({
        key: group.key,
        label: group.title,
      })),
    [],
  );
  const groupDefaultPaths = useMemo(
    () =>
      new Map<TabGroupKey, `/${string}`>(
        tabGroups.map((group) => [
          group.key,
          tabs.find((tab) => tab.group === group.key)?.path ?? "/chat",
        ]),
      ),
    [],
  );
  const breadcrumbItems = useMemo(
    () => [{ title: "OpenClaw" }, { title: activeGroup.title }, { title: activeTab.title }],
    [activeGroup.title, activeTab.title],
  );

  const sidebar = (
    <div className="control-sider-content">
      <div className="control-brand">
        <Link href="/chat" className="control-brand-link">
          <div className="control-brand-badge">OC</div>
          {!settings.navCollapsed ? (
            <div className="control-brand-copy">
              <Title level={5} style={{ margin: 0 }}>
                OpenClaw
              </Title>
              <Text type="secondary">Gateway Dashboard</Text>
            </div>
          ) : null}
        </Link>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[activeTab.path]}
        items={sideMenuItems}
        onClick={({ key }) => {
          router.push(String(key));
          setMobileNavOpen(false);
        }}
        className="control-nav-menu"
      />

      <div className="control-sider-footer">
        <Button type="link" href="https://docs.openclaw.ai" target="_blank" rel="noreferrer">
          文档
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* 布局结构：左右分栏 → 左侧菜单栏，右侧分为「头部 + 主内容」；主内容区可滚动 */}
      <Layout
        className="control-app-layout"
        hasSider
        style={{ height: "100vh", overflow: "hidden" }}
      >
        {/* 左侧：菜单栏 */}
        {screens.lg ? (
          <Sider
            theme="light"
            width={232}
            collapsedWidth={88}
            collapsible
            trigger={null}
            collapsed={settings.navCollapsed}
            onCollapse={(collapsed) => applySettings({ navCollapsed: collapsed })}
            className="control-sider"
            style={{
              background: colorBgContainer,
              borderRight: `1px solid ${colorBorderSecondary}`,
            }}
          >
            {sidebar}
          </Sider>
        ) : null}

        {/* 右侧：上头部 + 下主内容（主内容可滚动） */}
        <Layout className="control-app-layout-inner">
          <Header
            className="control-header"
            style={{
              background: colorBgContainer,
              borderBottom: `1px solid ${colorBorderSecondary}`,
            }}
          >
            <div className="control-header-bar">
              <div className="control-header-main">
                {!screens.lg ? (
                  <Button
                    type="text"
                    onClick={() => setMobileNavOpen(true)}
                    icon={<Icon name="menu" size={18} />}
                  />
                ) : null}
                <div className="control-page-copy">
                  <Text type="secondary">{activeGroup.title}</Text>
                  <Title level={2} style={{ margin: 0 }}>
                    {activeTab.title}
                  </Title>
                  <Text type="secondary">{activeTab.subtitle}</Text>
                </div>
              </div>

              {screens.lg ? (
                <Menu
                  mode="horizontal"
                  selectedKeys={[activeGroup.key]}
                  items={topMenuItems}
                  onClick={({ key }) =>
                    router.push(groupDefaultPaths.get(String(key) as TabGroupKey) ?? "/chat")
                  }
                  className="control-top-nav"
                  style={{
                    minWidth: 0,
                    flex: "1 1 auto",
                    background: "transparent",
                    borderBottom: "none",
                  }}
                />
              ) : null}

              <Space size={[8, 8]} wrap className="control-header-actions">
                <Tag color={connected ? "success" : connecting ? "processing" : "default"}>
                  {connected ? "已连接" : connecting ? "连接中" : "未连接"}
                </Tag>
                <Badge count={presenceEntries.length} size="small">
                  <Tag color="cyan">在线实例</Tag>
                </Badge>
                <Tag color="geekblue">版本 {hello?.server?.version ?? "未知"}</Tag>
                <Button
                  type="text"
                  onClick={() =>
                    setTheme(
                      settings.theme === "dark"
                        ? "light"
                        : settings.theme === "light"
                          ? "system"
                          : "dark",
                    )
                  }
                >
                  主题：{settings.theme}
                </Button>
                {screens.lg ? (
                  <Button
                    type="text"
                    onClick={() => applySettings({ navCollapsed: !settings.navCollapsed })}
                  >
                    {settings.navCollapsed ? "展开导航" : "收起导航"}
                  </Button>
                ) : null}
                {connected ? (
                  <Button onClick={disconnect}>断开</Button>
                ) : (
                  <Button type="primary" loading={connecting} onClick={() => setConnectOpen(true)}>
                    连接网关
                  </Button>
                )}
              </Space>
            </div>
          </Header>

          {/* 主内容区域：独立滚动 */}
          <Content className="control-content">
            <Breadcrumb className="control-breadcrumb" items={breadcrumbItems} />
            <div
              className="control-content-surface"
              style={{
                background: colorBgContainer,
                border: `1px solid ${colorBorderSecondary}`,
                borderRadius: borderRadiusLG,
                boxShadow: boxShadowSecondary,
              }}
            >
              {lastError ? (
                <div className="control-inline-alert">
                  <Tag color="error">连接错误</Tag>
                  <span>{lastError}</span>
                </div>
              ) : null}
              <div className="control-content-wrap">{children}</div>
            </div>
          </Content>

          <Footer
            className="control-footer"
            style={{ background: "transparent", color: colorTextDescription }}
          >
            OpenClaw Control UI
          </Footer>
        </Layout>
      </Layout>

      <Drawer
        placement="left"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        size={280}
        title={
          <Link href="/chat" onClick={() => setMobileNavOpen(false)}>
            OpenClaw
          </Link>
        }
      >
        {sidebar}
      </Drawer>

      <Modal
        title="连接 OpenClaw 网关"
        open={connectOpen}
        onCancel={() => setConnectOpen(false)}
        onOk={() => {
          connect();
          setConnectOpen(false);
        }}
        okText="连接"
        cancelText="取消"
        okButtonProps={{ loading: connecting }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <div className="control-field-label">网关地址</div>
            <Input
              value={settings.gatewayUrl}
              onChange={(event) => applySettings({ gatewayUrl: event.target.value })}
              placeholder="ws://localhost:8789"
            />
          </div>
          <div>
            <div className="control-field-label">令牌</div>
            <Input
              value={settings.token}
              onChange={(event) => applySettings({ token: event.target.value })}
              placeholder="可选，用于共享令牌连接"
            />
          </div>
          <div>
            <div className="control-field-label">密码</div>
            <Input.Password
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="可选，用于密码认证"
            />
          </div>
        </Space>
      </Modal>

      <Modal
        title="确认切换网关地址"
        open={Boolean(pendingGatewayUrl)}
        onOk={confirmPendingGatewayUrlChange}
        onCancel={cancelPendingGatewayUrlChange}
        okText="确认切换"
        cancelText="取消"
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Typography.Text>检测到地址参数请求切换到新的网关：</Typography.Text>
          <Typography.Paragraph copyable style={{ marginBottom: 0 }}>
            {pendingGatewayUrl ?? ""}
          </Typography.Paragraph>
          <Typography.Text type="secondary">
            仅在你信任这个地址时确认。切换后会使用该地址对应的会话令牌并重新连接。
          </Typography.Text>
        </Space>
      </Modal>
    </>
  );
}
