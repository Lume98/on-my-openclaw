export type ThemeMode = "light" | "dark" | "system";

export type GatewayErrorInfo = {
  code: string;
  message: string;
  details?: unknown;
};

export type GatewayHelloOk = {
  type: "hello-ok";
  protocol: number;
  server?: {
    version?: string;
    connId?: string;
  };
  features?: {
    methods?: string[];
    events?: string[];
  };
  snapshot?: unknown;
  auth?: {
    deviceToken?: string;
    role?: string;
    scopes?: string[];
    issuedAtMs?: number;
  };
  policy?: {
    tickIntervalMs?: number;
  };
};

export type GatewayEventFrame = {
  type: "event";
  event: string;
  payload?: unknown;
  seq?: number;
  stateVersion?: {
    presence: number;
    health: number;
  };
};

export type UiSettings = {
  gatewayUrl: string;
  token: string;
  sessionKey: string;
  lastActiveSessionKey: string;
  theme: ThemeMode;
  chatFocusMode: boolean;
  chatShowThinking: boolean;
  splitRatio: number;
  navCollapsed: boolean;
  navGroupsCollapsed: Record<string, boolean>;
  locale?: string;
};

export type ChannelAccountSnapshot = {
  accountId: string;
  name?: string | null;
  enabled?: boolean | null;
  configured?: boolean | null;
  linked?: boolean | null;
  running?: boolean | null;
  connected?: boolean | null;
  reconnectAttempts?: number | null;
  lastConnectedAt?: number | null;
  lastError?: string | null;
  lastStartAt?: number | null;
  lastStopAt?: number | null;
  lastInboundAt?: number | null;
  lastOutboundAt?: number | null;
  lastProbeAt?: number | null;
  mode?: string | null;
  dmPolicy?: string | null;
  allowFrom?: string[] | null;
  tokenSource?: string | null;
  botTokenSource?: string | null;
  appTokenSource?: string | null;
  credentialSource?: string | null;
  audienceType?: string | null;
  audience?: string | null;
  webhookPath?: string | null;
  webhookUrl?: string | null;
  baseUrl?: string | null;
  allowUnmentionedGroups?: boolean | null;
  cliPath?: string | null;
  dbPath?: string | null;
  port?: number | null;
  probe?: unknown;
  audit?: unknown;
  application?: unknown;
  [key: string]: unknown;
};

export type ChannelsStatusSnapshot = {
  ts: number;
  channelOrder: string[];
  channelLabels: Record<string, string>;
  channelDetailLabels?: Record<string, string>;
  channelSystemImages?: Record<string, string>;
  channelMeta?: Array<{
    id: string;
    label: string;
    detailLabel: string;
    systemImage?: string;
  }>;
  channels: Record<string, unknown>;
  channelAccounts: Record<string, ChannelAccountSnapshot[]>;
  channelDefaultAccountId: Record<string, string>;
};

export type DeviceTokenSummary = {
  role: string;
  scopes?: string[];
  createdAtMs?: number;
  rotatedAtMs?: number;
  revokedAtMs?: number;
  lastUsedAtMs?: number;
};

export type PendingDevice = {
  requestId: string;
  deviceId: string;
  displayName?: string;
  role?: string;
  remoteIp?: string;
  isRepair?: boolean;
  ts?: number;
};

export type PairedDevice = {
  deviceId: string;
  displayName?: string;
  roles?: string[];
  scopes?: string[];
  remoteIp?: string;
  tokens?: DeviceTokenSummary[];
  createdAtMs?: number;
  approvedAtMs?: number;
};

export type DevicePairingList = {
  pending: PendingDevice[];
  paired: PairedDevice[];
};

export type PresenceEntry = {
  id: string;
  name?: string;
  status?: string;
  timestamp?: number;
  [key: string]: unknown;
};

export type ChatAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  text: string;
  timestamp: number;
  raw?: unknown;
};

export type SessionsListResult = {
  ts: number;
  path: string;
  count: number;
  defaults: {
    modelProvider: string | null;
    model: string | null;
    contextTokens: number | null;
  };
  sessions: Array<{
    key: string;
    kind: "direct" | "group" | "global" | "unknown";
    label?: string;
    displayName?: string;
    derivedTitle?: string;
    channel?: string;
    updatedAt: number | null;
    lastMessagePreview?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    [key: string]: unknown;
  }>;
};

export type SkillStatusReport = {
  skills: Array<{
    id?: string;
    name: string;
    enabled?: boolean;
    status?: string;
    installId?: string;
    apiKeyConfigured?: boolean;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

export type AgentsListResult = {
  agents: Array<{
    id: string;
    name?: string;
    description?: string;
    identity?: {
      name?: string;
      avatar?: string;
      avatarUrl?: string;
    };
    [key: string]: unknown;
  }>;
  defaultId: string | null;
};

export type ToolsCatalogResult = {
  tools: Array<{
    name: string;
    description?: string;
    schema?: unknown;
    [key: string]: unknown;
  }>;
};

export type ConfigSnapshot = {
  hash?: string;
  raw?: string;
  valid?: boolean;
  issues?: unknown[];
  config?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ConfigSchemaResponse = {
  version?: string | null;
  schema?: unknown;
  uiHints?: Record<string, unknown>;
};

export type LogEntry = {
  raw: string;
  message: string;
  time?: string | null;
  level?: string | null;
  subsystem?: string | null;
  meta?: Record<string, unknown>;
};
