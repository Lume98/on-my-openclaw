"use client";

import { DashboardPage } from "@/components/openclaw/dashboard-page";

export type OpenClawAppProps = {
  defaultTab?: "chat";
};

export function OpenClawApp({ defaultTab = "chat" }: OpenClawAppProps) {
  return <DashboardPage tabKey={defaultTab} />;
}

export default OpenClawApp;
