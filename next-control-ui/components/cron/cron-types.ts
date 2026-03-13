"use client";

export type CronJobsEnabledFilter = "all" | "enabled" | "disabled";
export type CronJobsScheduleKindFilter = "all" | "at" | "every" | "cron";
export type CronJobsLastStatusFilter = "all" | "ok" | "error" | "skipped";
export type CronJobsSortBy = "nextRunAtMs" | "updatedAtMs" | "name";
export type CronRunsStatusFilter = "all" | "ok" | "error" | "skipped";
export type CronRunScope = "all" | "job";
export type CronSortDir = "asc" | "desc";
export type ScheduleKind = "at" | "every" | "cron";
export type EveryUnit = "minutes" | "hours" | "days";
export type StaggerUnit = "seconds" | "minutes";
export type SessionTarget = "main" | "isolated";
export type WakeMode = "next-heartbeat" | "now";
export type PayloadKind = "systemEvent" | "agentTurn";
export type DeliveryMode = "none" | "announce" | "webhook";

export type CronSchedule =
  | { kind: "at"; at: string }
  | { kind: "every"; everyMs: number; anchorMs?: number }
  | { kind: "cron"; expr: string; tz?: string; staggerMs?: number };

export type CronPayload =
  | { kind: "systemEvent"; text: string }
  | {
      kind: "agentTurn";
      message: string;
      model?: string;
      thinking?: string;
      timeoutSeconds?: number;
      lightContext?: boolean;
    };

export type CronDelivery =
  | { mode: "none"; channel?: string; to?: string; accountId?: string; bestEffort?: boolean }
  | { mode: "announce"; channel?: string; to?: string; accountId?: string; bestEffort?: boolean }
  | { mode: "webhook"; to: string; channel?: string; accountId?: string; bestEffort?: boolean };

export type CronJob = {
  id: string;
  name: string;
  description?: string;
  agentId?: string | null;
  enabled: boolean;
  deleteAfterRun?: boolean;
  createdAtMs?: number;
  updatedAtMs?: number;
  schedule: CronSchedule;
  sessionTarget: SessionTarget;
  wakeMode: WakeMode;
  payload: CronPayload;
  delivery?: CronDelivery;
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: "ok" | "error" | "skipped";
    lastRunStatus?: "ok" | "error" | "skipped";
    lastError?: string;
    lastDurationMs?: number;
    consecutiveErrors?: number;
    runningAtMs?: number;
    lastDeliveryStatus?: "delivered" | "not-delivered" | "unknown" | "not-requested";
  };
};

export type CronRunEntry = {
  ts: number;
  jobId: string;
  jobName?: string;
  status?: "ok" | "error" | "skipped";
  summary?: string;
  error?: string;
  durationMs?: number;
  nextRunAtMs?: number;
  deliveryStatus?: "delivered" | "not-delivered" | "unknown" | "not-requested";
  model?: string;
  provider?: string;
};

export type CronJobsListResult = {
  jobs?: CronJob[];
  total?: number;
};

export type CronRunsResult = {
  entries?: CronRunEntry[];
  total?: number;
};

export type CronFormValues = {
  name: string;
  description: string;
  agentId: string;
  enabled: boolean;
  deleteAfterRun: boolean;
  scheduleKind: ScheduleKind;
  scheduleAt: string;
  everyAmount: number;
  everyUnit: EveryUnit;
  cronExpr: string;
  cronTz: string;
  scheduleExact: boolean;
  staggerAmount: number | null;
  staggerUnit: StaggerUnit;
  sessionTarget: SessionTarget;
  wakeMode: WakeMode;
  payloadKind: PayloadKind;
  payloadText: string;
  payloadModel: string;
  payloadThinking: string;
  payloadLightContext: boolean;
  timeoutSeconds: number | null;
  deliveryMode: DeliveryMode;
  deliveryChannel: string;
  deliveryTo: string;
  deliveryAccountId: string;
  deliveryBestEffort: boolean;
};

export const DEFAULT_CRON_FORM: CronFormValues = {
  name: "",
  description: "",
  agentId: "main_xx_ops",
  enabled: true,
  deleteAfterRun: true,
  scheduleKind: "every",
  scheduleAt: "",
  everyAmount: 30,
  everyUnit: "minutes",
  cronExpr: "0 7 * * *",
  cronTz: "",
  scheduleExact: false,
  staggerAmount: null,
  staggerUnit: "seconds",
  sessionTarget: "isolated",
  wakeMode: "now",
  payloadKind: "agentTurn",
  payloadText: "每 30 分钟输出一次当前状态汇报。",
  payloadModel: "",
  payloadThinking: "",
  payloadLightContext: false,
  timeoutSeconds: null,
  deliveryMode: "announce",
  deliveryChannel: "last",
  deliveryTo: "",
  deliveryAccountId: "",
  deliveryBestEffort: false,
};

export const EVERY_UNIT_TO_MS: Record<EveryUnit, number> = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
};
