import type { DevicePairingList } from "@/components/types";

export interface DevicePairingCardProps {
  devices: DevicePairingList | null;
  devicesLoading: boolean;
  devicesError: string | null;
  actionError: string | null;
  onApproveDevice: (requestId: string) => Promise<void>;
  onRejectDevice: (requestId: string) => Promise<void>;
  onRotateDeviceToken: (deviceId: string, role: string, scopes?: string[]) => Promise<void>;
  onRevokeDeviceToken: (deviceId: string, role: string) => Promise<void>;
  onRefreshDevices: () => void;
  onRefreshNodes: () => void;
}

export interface NodesListCardProps {
  nodes: Array<Record<string, unknown>> | null;
  nodesLoading: boolean;
  nodesError: string | null;
  onRefresh: () => void;
}
