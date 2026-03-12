"use client";

import { Layout, theme } from "antd";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ConfirmGatewayModal } from "@/components/openclaw/app-layout/confirm-gateway-modal";
import { ConnectModal } from "@/components/openclaw/app-layout/connect-modal";
import { AppHeader } from "@/components/openclaw/app-layout/header";
import { Main } from "@/components/openclaw/app-layout/main";
import { MobileDrawer } from "@/components/openclaw/app-layout/mobile-drawer";
import { Sidebar } from "@/components/openclaw/app-layout/sidebar";
import { getTabByPath } from "@/components/openclaw/navigation";
import { useGateway } from "@/components/openclaw/providers/gateway-provider";
import { useSettings } from "@/components/openclaw/providers/settings-provider";

type AppLayoutProps = {
  children: React.ReactNode;
};

const LayoutWrapper = Layout;

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const activeTab = getTabByPath(pathname);

  const {
    token: { colorBgContainer, colorBorderSecondary },
  } = theme.useToken();

  const {
    settings,
    password,
    pendingGatewayUrl,
    resolvedTheme,
    applySettings,
    setPassword,
    setTheme,
    confirmPendingGatewayUrlChange,
    cancelPendingGatewayUrlChange,
  } = useSettings();

  const { connected, connecting, connect, disconnect, hello, lastError } = useGateway();

  const [connectOpen, setConnectOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleConnect = () => {
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleThemeChange = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleNavCollapseToggle = () => {
    applySettings({ navCollapsed: !settings.navCollapsed });
  };

  const handleMobileNavOpen = () => {
    setMobileNavOpen(true);
  };

  return (
    <>
      <LayoutWrapper
        className="control-app-layout"
        hasSider
        style={{ height: "100vh", overflow: "hidden" }}
      >
        <Sidebar
          pathname={pathname}
          collapsed={settings.navCollapsed}
          onCollapse={(collapsed) => applySettings({ navCollapsed: collapsed })}
          showSider
          theme={resolvedTheme}
          style={{
            background: colorBgContainer,
            borderRight: `1px solid ${colorBorderSecondary}`,
          }}
        />

        <Layout className="control-app-layout-inner">
          <AppHeader
            activeTab={activeTab}
            connected={connected}
            connecting={connecting}
            hello={hello}
            theme={resolvedTheme}
            onThemeChange={handleThemeChange}
            navCollapsed={settings.navCollapsed}
            onNavCollapseToggle={handleNavCollapseToggle}
            onConnect={() => setConnectOpen(true)}
            onDisconnect={handleDisconnect}
            onMobileNavOpen={handleMobileNavOpen}
            showTopNav
            style={{
              background: colorBgContainer,
              borderBottom: `1px solid ${colorBorderSecondary}`,
            }}
          />

          <Main
            children={children}
            activeTab={activeTab}
            lastError={lastError}
            skipSurface={pathname === "/overview" || pathname === "/agents"}
          />

          <ConfirmGatewayModal
            pendingGatewayUrl={pendingGatewayUrl}
            onConfirm={confirmPendingGatewayUrlChange}
            onCancel={cancelPendingGatewayUrlChange}
          />
        </Layout>
      </LayoutWrapper>

      <MobileDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)}>
        <Sidebar
          pathname={pathname}
          collapsed={false}
          onCollapse={() => {}}
          showSider={false}
          showContentOnly
          onMenuItemClick={() => setMobileNavOpen(false)}
          theme={resolvedTheme}
        />
      </MobileDrawer>

      <ConnectModal
        open={connectOpen}
        settings={settings}
        password={password}
        onSettingsChange={applySettings}
        onPasswordChange={setPassword}
        onConnect={handleConnect}
        onCancel={() => setConnectOpen(false)}
        connecting={connecting}
      />
    </>
  );
}
