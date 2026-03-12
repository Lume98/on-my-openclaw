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
// - OverviewPanel -> @/components/views/overview-panel.tsx
// - ChatPanel -> @/components/views/chat-panel.tsx
// - ChannelsPanel -> @/components/views/channels-panel.tsx
// - InstancesPanel -> @/components/views/instances-panel.tsx
// - SessionsPanel -> @/components/views/sessions-panel.tsx
// - UsagePanel -> @/components/views/usage-panel.tsx
// - CronPanel -> @/components/views/cron-panel.tsx
// - AgentsPanel -> @/components/views/agents-panel.tsx
// - SkillsPanel -> @/components/views/skills-panel.tsx
// - NodesPanel -> @/components/views/nodes-panel.tsx
// - ConfigPanel -> @/components/views/config-panel.tsx
// - DebugPanel -> @/components/views/debug-panel.tsx
// - LogsPanel -> @/components/views/logs-panel.tsx
//
// Import the specific panel you need directly in your page component.
