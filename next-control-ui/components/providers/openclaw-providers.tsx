"use client";

import { App, ConfigProvider, theme } from "antd";
import type { PropsWithChildren } from "react";
import { GatewayProvider } from "@/components/providers/gateway-provider";
import { SettingsProvider, useSettings } from "@/components/providers/settings-provider";

function ThemedProviders({ children }: PropsWithChildren) {
  const { resolvedTheme } = useSettings();

  return (
    <ConfigProvider
      theme={{
        algorithm: resolvedTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
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
