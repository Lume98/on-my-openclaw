"use client";

import { useState } from "react";
import type {
  CronJobsEnabledFilter,
  CronJobsLastStatusFilter,
  CronJobsScheduleKindFilter,
  CronJobsSortBy,
  CronRunScope,
  CronRunsStatusFilter,
  CronSortDir,
} from "@/components/cron/cron-types";
import type { CronPanelFilters } from "@/components/page-views/cron-panel/types";

/**
 * Cron过滤器状态管理Hook
 * 封装所有过滤器相关的状态（11个）
 */
export function useCronFilters(): CronPanelFilters & {
  resetJobFilters: () => void;
} {
  // 任务过滤器状态
  const [jobQuery, setJobQuery] = useState("");
  const [jobEnabledFilter, setJobEnabledFilter] = useState<CronJobsEnabledFilter>("all");
  const [jobScheduleFilter, setJobScheduleFilter] = useState<CronJobsScheduleKindFilter>("all");
  const [jobLastStatusFilter, setJobLastStatusFilter] = useState<CronJobsLastStatusFilter>("all");
  const [jobSortBy, setJobSortBy] = useState<CronJobsSortBy>("nextRunAtMs");
  const [jobSortDir, setJobSortDir] = useState<CronSortDir>("asc");

  // 运行记录过滤器状态
  const [runsScope, setRunsScope] = useState<CronRunScope>("all");
  const [runsJobId, setRunsJobId] = useState<string | null>(null);
  const [runsQuery, setRunsQuery] = useState("");
  const [runsStatusFilter, setRunsStatusFilter] = useState<CronRunsStatusFilter>("all");
  const [runsSortDir, setRunsSortDir] = useState<CronSortDir>("desc");

  // 重置任务过滤器
  const resetJobFilters = () => {
    setJobQuery("");
    setJobEnabledFilter("all");
    setJobScheduleFilter("all");
    setJobLastStatusFilter("all");
    setJobSortBy("nextRunAtMs");
    setJobSortDir("asc");
  };

  return {
    // 任务过滤器
    jobQuery,
    setJobQuery,
    jobEnabledFilter,
    setJobEnabledFilter,
    jobScheduleFilter,
    setJobScheduleFilter,
    jobLastStatusFilter,
    setJobLastStatusFilter,
    jobSortBy,
    setJobSortBy,
    jobSortDir,
    setJobSortDir,

    // 运行记录过滤器
    runsScope,
    setRunsScope,
    runsJobId,
    setRunsJobId,
    runsQuery,
    setRunsQuery,
    runsStatusFilter,
    setRunsStatusFilter,
    runsSortDir,
    setRunsSortDir,

    // 重置方法
    resetJobFilters,
  };
}
