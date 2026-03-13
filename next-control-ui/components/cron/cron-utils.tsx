import { Tag } from "antd";
import type {
  CronDelivery,
  CronFormValues,
  CronJob,
  CronJobsLastStatusFilter,
  CronJobsScheduleKindFilter,
  CronPayload,
  CronSchedule,
} from "@/components/cron/cron-types";
import { DEFAULT_CRON_FORM, EVERY_UNIT_TO_MS } from "@/components/cron/cron-types";

export function formatTimestamp(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }
  return new Date(value).toLocaleString("zh-CN");
}

export function formatDuration(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "—";
  }

  if (value < 1000) {
    return `${value} ms`;
  }

  const seconds = Math.floor(value / 1000);
  if (seconds < 60) {
    return `${seconds} 秒`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes} 分 ${remainSeconds} 秒`;
}

export function getJobLastStatus(job: CronJob) {
  return job.state?.lastStatus ?? job.state?.lastRunStatus ?? undefined;
}

export function formatStatusTag(status?: string) {
  if (status === "ok") {
    return <Tag color="success">成功</Tag>;
  }
  if (status === "error") {
    return <Tag color="error">失败</Tag>;
  }
  if (status === "skipped") {
    return <Tag color="warning">跳过</Tag>;
  }
  return <Tag>未知</Tag>;
}

export function formatDeliveryTag(status?: string) {
  if (status === "delivered") {
    return <Tag color="success">已送达</Tag>;
  }
  if (status === "not-delivered") {
    return <Tag color="error">未送达</Tag>;
  }
  if (status === "unknown") {
    return <Tag color="warning">未知</Tag>;
  }
  if (status === "not-requested") {
    return <Tag>未请求</Tag>;
  }
  return <Tag>—</Tag>;
}

export function formatSchedule(schedule: CronSchedule) {
  if (schedule.kind === "at") {
    return `单次：${schedule.at}`;
  }
  if (schedule.kind === "every") {
    const everyMs = schedule.everyMs;
    if (everyMs % EVERY_UNIT_TO_MS.days === 0) {
      return `每 ${everyMs / EVERY_UNIT_TO_MS.days} 天`;
    }
    if (everyMs % EVERY_UNIT_TO_MS.hours === 0) {
      return `每 ${everyMs / EVERY_UNIT_TO_MS.hours} 小时`;
    }
    return `每 ${Math.max(1, Math.round(everyMs / EVERY_UNIT_TO_MS.minutes))} 分钟`;
  }
  const stagger =
    typeof schedule.staggerMs === "number"
      ? schedule.staggerMs === 0
        ? "，精确调度"
        : `，抖动 ${schedule.staggerMs >= 60_000 ? `${schedule.staggerMs / 60_000} 分钟` : `${schedule.staggerMs / 1000} 秒`}`
      : "";
  return `${schedule.expr}${schedule.tz ? ` (${schedule.tz})` : ""}${stagger}`;
}

export function parseEverySchedule(everyMs: number) {
  if (everyMs % EVERY_UNIT_TO_MS.days === 0) {
    return { everyAmount: everyMs / EVERY_UNIT_TO_MS.days, everyUnit: "days" as const };
  }
  if (everyMs % EVERY_UNIT_TO_MS.hours === 0) {
    return { everyAmount: everyMs / EVERY_UNIT_TO_MS.hours, everyUnit: "hours" as const };
  }
  return {
    everyAmount: Math.max(1, Math.round(everyMs / EVERY_UNIT_TO_MS.minutes)),
    everyUnit: "minutes" as const,
  };
}

export function parseStaggerSchedule(staggerMs?: number) {
  if (typeof staggerMs !== "number" || !Number.isFinite(staggerMs)) {
    return {
      scheduleExact: false,
      staggerAmount: null,
      staggerUnit: "seconds" as const,
    };
  }
  if (staggerMs === 0) {
    return {
      scheduleExact: true,
      staggerAmount: null,
      staggerUnit: "seconds" as const,
    };
  }
  if (staggerMs % 60_000 === 0) {
    return {
      scheduleExact: false,
      staggerAmount: staggerMs / 60_000,
      staggerUnit: "minutes" as const,
    };
  }
  return {
    scheduleExact: false,
    staggerAmount: Math.ceil(staggerMs / 1000),
    staggerUnit: "seconds" as const,
  };
}

export function dateTimeLocalValue(iso?: string) {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function jobToFormValues(job: CronJob): CronFormValues {
  const base: CronFormValues = {
    ...DEFAULT_CRON_FORM,
    name: job.name,
    description: job.description ?? "",
    agentId: job.agentId ?? "",
    enabled: job.enabled,
    deleteAfterRun: job.deleteAfterRun ?? false,
    sessionTarget: job.sessionTarget,
    wakeMode: job.wakeMode,
  };

  if (job.schedule.kind === "at") {
    base.scheduleKind = "at";
    base.scheduleAt = dateTimeLocalValue(job.schedule.at);
  } else if (job.schedule.kind === "every") {
    const every = parseEverySchedule(job.schedule.everyMs);
    base.scheduleKind = "every";
    base.everyAmount = every.everyAmount;
    base.everyUnit = every.everyUnit;
  } else {
    const stagger = parseStaggerSchedule(job.schedule.staggerMs);
    base.scheduleKind = "cron";
    base.cronExpr = job.schedule.expr;
    base.cronTz = job.schedule.tz ?? "";
    base.scheduleExact = stagger.scheduleExact;
    base.staggerAmount = stagger.staggerAmount;
    base.staggerUnit = stagger.staggerUnit;
  }

  if (job.payload.kind === "systemEvent") {
    base.payloadKind = "systemEvent";
    base.payloadText = job.payload.text;
  } else {
    base.payloadKind = "agentTurn";
    base.payloadText = job.payload.message;
    base.payloadModel = job.payload.model ?? "";
    base.payloadThinking = job.payload.thinking ?? "";
    base.timeoutSeconds = job.payload.timeoutSeconds ?? null;
    base.payloadLightContext = job.payload.lightContext === true;
  }

  if (job.delivery) {
    base.deliveryMode = job.delivery.mode;
    base.deliveryChannel = job.delivery.channel ?? "last";
    base.deliveryTo = job.delivery.to ?? "";
    base.deliveryAccountId = job.delivery.accountId ?? "";
    base.deliveryBestEffort = job.delivery.bestEffort === true;
  }

  return base;
}

export function buildCronSchedule(values: CronFormValues): CronSchedule {
  if (values.scheduleKind === "at") {
    const atMs = Date.parse(values.scheduleAt);
    if (!Number.isFinite(atMs)) {
      throw new Error("请填写有效的执行时间。");
    }
    return { kind: "at", at: new Date(atMs).toISOString() };
  }

  if (values.scheduleKind === "every") {
    if (!values.everyAmount || values.everyAmount <= 0) {
      throw new Error("循环间隔必须大于 0。");
    }
    return {
      kind: "every",
      everyMs: Math.floor(values.everyAmount * EVERY_UNIT_TO_MS[values.everyUnit]),
    };
  }

  if (!values.cronExpr.trim()) {
    throw new Error("Cron 表达式不能为空。");
  }

  if (values.scheduleExact) {
    return {
      kind: "cron",
      expr: values.cronExpr.trim(),
      tz: values.cronTz.trim() || undefined,
      staggerMs: 0,
    };
  }

  if (!values.staggerAmount || values.staggerAmount <= 0) {
    return {
      kind: "cron",
      expr: values.cronExpr.trim(),
      tz: values.cronTz.trim() || undefined,
    };
  }

  return {
    kind: "cron",
    expr: values.cronExpr.trim(),
    tz: values.cronTz.trim() || undefined,
    staggerMs:
      values.staggerUnit === "minutes"
        ? Math.floor(values.staggerAmount * 60_000)
        : Math.floor(values.staggerAmount * 1000),
  };
}

export function buildCronPayload(values: CronFormValues): CronPayload {
  if (!values.payloadText.trim()) {
    throw new Error("请填写任务内容。");
  }

  if (values.payloadKind === "systemEvent") {
    return {
      kind: "systemEvent",
      text: values.payloadText.trim(),
    };
  }

  return {
    kind: "agentTurn",
    message: values.payloadText.trim(),
    model: values.payloadModel.trim() || undefined,
    thinking: values.payloadThinking.trim() || undefined,
    timeoutSeconds:
      typeof values.timeoutSeconds === "number" && values.timeoutSeconds > 0
        ? Math.floor(values.timeoutSeconds)
        : undefined,
    lightContext: values.payloadLightContext || undefined,
  };
}

export function buildCronDelivery(values: CronFormValues): CronDelivery {
  if (values.deliveryMode === "none") {
    return { mode: "none" };
  }

  if (values.deliveryMode === "webhook") {
    if (!values.deliveryTo.trim()) {
      throw new Error("Webhook 地址不能为空。");
    }
    return {
      mode: "webhook",
      to: values.deliveryTo.trim(),
      bestEffort: values.deliveryBestEffort || undefined,
    };
  }

  return {
    mode: "announce",
    channel: values.deliveryChannel.trim() || "last",
    to: values.deliveryTo.trim() || undefined,
    accountId: values.deliveryAccountId.trim() || undefined,
    bestEffort: values.deliveryBestEffort || undefined,
  };
}

export function filterCronJobs(
  jobs: CronJob[],
  filters: {
    scheduleKind: CronJobsScheduleKindFilter;
    lastStatus: CronJobsLastStatusFilter;
  },
) {
  return jobs.filter((job) => {
    if (filters.scheduleKind !== "all" && job.schedule.kind !== filters.scheduleKind) {
      return false;
    }

    const lastStatus = getJobLastStatus(job);
    if (filters.lastStatus !== "all" && lastStatus !== filters.lastStatus) {
      return false;
    }

    return true;
  });
}
