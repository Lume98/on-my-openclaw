/**
 * Dashboard Panel Components
 *
 * This module exports all dashboard panel components.
 * Each panel can be imported directly in app page components.
 *
 * Example:
 * ```tsx
 * import { OverviewPanel } from "@/components/page-views";
 *
 * export default function OverviewPage() {
 *   return <OverviewPanel />;
 * }
 * ```
 */

export { OverviewPanel } from "@/components/page-views/overview-panel";
export { ChatPanel } from "@/components/page-views/chat-panel";
export { ChannelsPanel } from "@/components/page-views/channels-panel";
export { InstancesPanel } from "@/components/page-views/instances-panel";
export { SessionsPanel } from "@/components/page-views/sessions-panel";
export { UsagePanel } from "@/components/page-views/usage-panel";
export { CronPanel } from "@/components/page-views/cron-panel";
export { AgentsPanel } from "@/components/page-views/agents-panel";
export { NodesPanel } from "@/components/page-views/nodes-panel";
export { ConfigPanel } from "@/components/page-views/config-panel";
export { DebugPanel } from "@/components/page-views/debug-panel";
export { LogsPanel } from "@/components/page-views/logs-panel";
