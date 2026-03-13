"use client";

import { message } from "antd";
import { useCallback, useState } from "react";
import type { CronJob } from "@/components/cron/cron-types";
import type { CronPanelActions } from "@/components/page-views/cron-panel/types";

/**
 * Cron业务操作逻辑Hook
 * 抽离所有任务操作的回调
 */
export function useCronActions(
  request: <T>(method: string, params?: Record<string, unknown>) => Promise<T>,
  filters: {
    runsScope: string;
    runsJobId: string | null;
    setRunsScope: (value: "all" | "job") => void;
    setRunsJobId: (value: string | null) => void;
  },
  editingJobId: string | null,
  resetForm: () => void,
  refreshAll: () => Promise<void>,
  onStartEdit: (job: CronJob) => void,
): CronPanelActions & { busyActionKey: string | null } {
  const [busyActionKey, setBusyActionKey] = useState<string | null>(null);

  // 通用的异步操作包装器（处理 busyActionKey 和错误）
  const runAction = useCallback(
    async (key: string, action: () => Promise<void>) => {
      try {
        setBusyActionKey(key);
        await action();
        await refreshAll();
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error));
      } finally {
        setBusyActionKey(null);
      }
    },
    [refreshAll],
  );

  // 启用/禁用任务
  const handleToggleJob = useCallback(
    (job: CronJob): Promise<void> =>
      runAction(`toggle-${job.id}`, async () => {
        await request("cron.update", {
          id: job.id,
          patch: { enabled: !job.enabled },
        });
        message.success(job.enabled ? "任务已禁用。" : "任务已启用。");
      }),
    [request, runAction],
  );

  // 手动执行任务
  const handleRunJob = useCallback(
    (job: CronJob): Promise<void> =>
      runAction(`run-${job.id}`, async () => {
        await request("cron.run", { id: job.id, mode: "force" });
        filters.setRunsScope("job");
        filters.setRunsJobId(job.id);
        message.success(`已触发任务「${job.name}」执行。`);
      }),
    [request, runAction, filters],
  );

  // 删除任务
  const handleDeleteJob = useCallback(
    (job: CronJob): Promise<void> =>
      runAction(`remove-${job.id}`, async () => {
        await request("cron.remove", { id: job.id });
        if (editingJobId === job.id) {
          resetForm();
        }
        if (filters.runsJobId === job.id) {
          filters.setRunsScope("all");
          filters.setRunsJobId(null);
        }
        message.success("定时任务已删除。");
      }),
    [editingJobId, request, resetForm, runAction, filters.runsJobId, filters],
  );

  // 编辑任务（联动到 form hook）
  const handleEditJob = useCallback(
    (job: CronJob): Promise<void> => {
      onStartEdit(job);
      return Promise.resolve();
    },
    [onStartEdit],
  );

  const result: CronPanelActions & { busyActionKey: string | null } = {
    busyActionKey,
    onToggleJob: (job: CronJob) => handleToggleJob(job),
    onRunJob: (job: CronJob) => handleRunJob(job),
    onDeleteJob: (job: CronJob) => handleDeleteJob(job),
    onEditJob: (job: CronJob) => handleEditJob(job),
  };

  return result;
}
