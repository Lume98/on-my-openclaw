"use client";

import { Layout, theme } from "antd";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getTabByPath } from "@/components/openclaw/navigation";
import { useGateway } from "@/components/openclaw/providers/gateway-provider";
import { useSettings } from "@/components/openclaw/providers/settings-provider";
import { ConfirmGatewayModal } from "./confirm-gateway-modal";
import { ConnectModal } from "./connect-modal";
import { AppHeader } from "./header";
import { Main } from "./main";
import { MobileDrawer } from "./mobile-drawer";
import { Sidebar } from "./sidebar";

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

  const { connected, connecting, connect, disconnect, hello, presenceEntries, lastError } =
    useGateway();

  const [connectOpen, setConnectOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleConnect = () => {
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleThemeChange = () => {
    setTheme(settings.theme === "dark" ? "light" : settings.theme === "light" ? "system" : "dark");
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
            presenceEntries={presenceEntries}
            theme={settings.theme}
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

          <Main children={children} activeTab={activeTab} lastError={lastError} />

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
