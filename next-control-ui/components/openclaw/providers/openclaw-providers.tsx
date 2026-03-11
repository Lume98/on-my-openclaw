"use client";

import { App, ConfigProvider, theme } from "antd";
import type { PropsWithChildren } from "react";
import { GatewayProvider } from "@/components/openclaw/providers/gateway-provider";
import { SettingsProvider, useSettings } from "@/components/openclaw/providers/settings-provider";

function ThemedProviders({ children }: PropsWithChildren) {
  const { resolvedTheme } = useSettings();

  return (
    <ConfigProvider
      theme={{
        algorithm: resolvedTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          borderRadius: 18,
          colorPrimary: "#67e8f9",
          colorInfo: "#67e8f9",
          colorSuccess: "#34d399",
          colorWarning: "#f59e0b",
          colorError: "#f87171",
          wireframe: false,
        },
      }}
    >
      <App>
        <GatewayProvider>{children}</GatewayProvider>
      </App>
    </ConfigProvider>
  );
}

export function OpenclawProviders({ children }: PropsWithChildren) {
  return (
    <SettingsProvider>
      <ThemedProviders>{children}</ThemedProviders>
    </SettingsProvider>
  );
}
