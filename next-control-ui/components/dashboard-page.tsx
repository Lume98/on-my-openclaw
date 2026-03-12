"use client";

import type { TabKey } from "@/components/navigation";

// Type definitions for backward compatibility
export type DashboardPageProps = {
  tabKey: TabKey;
};

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
};

// NOTE: The DashboardPage component has been refactored.
// Each panel is now exported as a separate component:
// - OverviewPanel -> @/components/panels/overview-panel.tsx
// - ChatPanel -> @/components/panels/chat-panel.tsx
// - ChannelsPanel -> @/components/panels/channels-panel.tsx
// - InstancesPanel -> @/components/panels/instances-panel.tsx
// - SessionsPanel -> @/components/panels/sessions-panel.tsx
// - UsagePanel -> @/components/panels/usage-panel.tsx
// - CronPanel -> @/components/panels/cron-panel.tsx
// - AgentsPanel -> @/components/panels/agents-panel.tsx
// - SkillsPanel -> @/components/panels/skills-panel.tsx
// - NodesPanel -> @/components/panels/nodes-panel.tsx
// - ConfigPanel -> @/components/panels/config-panel.tsx
// - DebugPanel -> @/components/panels/debug-panel.tsx
// - LogsPanel -> @/components/panels/logs-panel.tsx
//
// Import the specific panel you need directly in your page component.
