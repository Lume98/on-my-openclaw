"use client";

import { useCallback, useMemo } from "react";
import type {
  CronJobsEnabledFilter,
  CronJobsListResult,
  CronJobsSortBy,
  CronSortDir,
  CronRunScope,
  CronRunsResult,
  CronRunsStatusFilter,
} from "@/components/cron/cron-types";
import type { CronPanelData } from "@/components/page-views/cron-panel/types";
import { useGatewayQuery } from "@/components/page-views/shared/use-gateway-query";
import type { CronStatus } from "@/lib/types";

/**
 * Cron数据获取Hook
 * 封装三个 useGatewayQuery 调用：status、jobs、runs
 */
export function useCronData(
  request: <T>(method: string, params?: Record<string, unknown>) => Promise<T>,
  connected: boolean,
  filters: {
    jobEnabledFilter: CronJobsEnabledFilter;
    jobQuery: string;
    jobSortBy: CronJobsSortBy;
    jobSortDir: CronSortDir;
    runsScope: CronRunScope;
    runsJobId: string | null;
    runsQuery: string;
    runsStatusFilter: CronRunsStatusFilter;
    runsSortDir: CronSortDir;
  },
): CronPanelData {
  // 获取定时任务状态
  const status = useGatewayQuery<CronStatus>(
    useCallback(async () => await request<CronStatus>("cron.status", {}), [request]),
    connected,
  );

  // 获取任务列表
  const jobs = useGatewayQuery<CronJobsListResult>(
    useCallback(
      async () =>
        await request<CronJobsListResult>("cron.list", {
          includeDisabled: filters.jobEnabledFilter !== "enabled",
          limit: 100,
          offset: 0,
          query: filters.jobQuery.trim() || undefined,
          enabled: filters.jobEnabledFilter,
          sortBy: filters.jobSortBy,
          sortDir: filters.jobSortDir,
        }),
      [filters.jobEnabledFilter, filters.jobQuery, filters.jobSortBy, filters.jobSortDir, request],
    ),
    connected,
  );

  // 获取执行记录
  const runs = useGatewayQuery<CronRunsResult>(
    useCallback(
      async () =>
        await request<CronRunsResult>("cron.runs", {
          scope: filters.runsScope,
          id: filters.runsScope === "job" ? (filters.runsJobId ?? undefined) : undefined,
          limit: 50,
          offset: 0,
          query: filters.runsQuery.trim() || undefined,
          status: filters.runsStatusFilter,
          sortDir: filters.runsSortDir,
        }),
      [
        filters.runsJobId,
        filters.runsQuery,
        filters.runsScope,
        filters.runsSortDir,
        filters.runsStatusFilter,
        request,
      ],
    ),
    connected,
  );

  // 计算整体加载状态
  const loading = useMemo(
    () => status.loading || jobs.loading || runs.loading,
    [status.loading, jobs.loading, runs.loading],
  );

  // 计算错误信息
  const error = useMemo(
    () => status.error || jobs.error || runs.error || null,
    [status.error, jobs.error, runs.error],
  );

  // 刷新所有数据
  const refreshAll = useCallback(async () => {
    await Promise.all([status.refresh(), jobs.refresh(), runs.refresh()]);
  }, [status, jobs, runs]);

  return {
    status,
    jobs,
    runs,
    loading,
    error,
    refreshAll,
  };
}
