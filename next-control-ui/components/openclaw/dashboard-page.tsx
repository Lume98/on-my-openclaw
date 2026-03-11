"use client";

import type { TabKey } from "@/components/openclaw/navigation";

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
// - OverviewPanel -> @/components/openclaw/panels/overview-panel.tsx
// - ChatPanel -> @/components/openclaw/panels/chat-panel.tsx
// - ChannelsPanel -> @/components/openclaw/panels/channels-panel.tsx
// - InstancesPanel -> @/components/openclaw/panels/instances-panel.tsx
// - SessionsPanel -> @/components/openclaw/panels/sessions-panel.tsx
// - UsagePanel -> @/components/openclaw/panels/usage-panel.tsx
// - CronPanel -> @/components/openclaw/panels/cron-panel.tsx
// - AgentsPanel -> @/components/openclaw/panels/agents-panel.tsx
// - SkillsPanel -> @/components/openclaw/panels/skills-panel.tsx
// - NodesPanel -> @/components/openclaw/panels/nodes-panel.tsx
// - ConfigPanel -> @/components/openclaw/panels/config-panel.tsx
// - DebugPanel -> @/components/openclaw/panels/debug-panel.tsx
// - LogsPanel -> @/components/openclaw/panels/logs-panel.tsx
//
// Import the specific panel you need directly in your page component.
