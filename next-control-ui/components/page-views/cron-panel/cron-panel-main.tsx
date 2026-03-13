"use client";

import { Alert, Button, Card, message, Statistic, Typography } from "antd";
import { useCallback, useEffect, useMemo } from "react";
import { CronFormCard, CronJobsCard, CronRunsCard } from "@/components/cron/cron-sections";
import {
  buildCronDelivery,
  buildCronPayload,
  buildCronSchedule,
  filterCronJobs,
  formatTimestamp,
} from "@/components/cron/cron-utils";
import { useCronActions } from "@/components/page-views/cron-panel/hooks/use-cron-actions";
import { useCronData } from "@/components/page-views/cron-panel/hooks/use-cron-data";
import { useCronFilters } from "@/components/page-views/cron-panel/hooks/use-cron-filters";
import { useCronForm } from "@/components/page-views/cron-panel/hooks/use-cron-form";
import { useGateway } from "@/components/providers/gateway-provider";

const { Paragraph, Title } = Typography;

/**
 * Cron定时任务面板
 * 主协调器组件，整合所有 hooks 并渲染 UI
 */
export function CronPanel() {
  const { request, connected } = useGateway();

  // 过滤器状态
  const filters = useCronFilters();

  // 数据获取
  const { status, jobs, runs, error, refreshAll } = useCronData(request, connected, {
    jobEnabledFilter: filters.jobEnabledFilter,
    jobQuery: filters.jobQuery,
    jobSortBy: filters.jobSortBy,
    jobSortDir: filters.jobSortDir,
    runsScope: filters.runsScope,
    runsJobId: filters.runsJobId,
    runsQuery: filters.runsQuery,
    runsStatusFilter: filters.runsStatusFilter,
    runsSortDir: filters.runsSortDir,
  });

  // 表单逻辑
  const {
    form,
    editingJobId,
    submitting,
    scheduleKind,
    payloadKind,
    deliveryMode,
    scheduleExact,
    resetForm,
    startEdit,
    setSubmitting,
  } = useCronForm();

  // 业务操作
  const { busyActionKey, onToggleJob, onRunJob, onDeleteJob, onEditJob } = useCronActions(
    request,
    {
      runsScope: filters.runsScope,
      runsJobId: filters.runsJobId,
      setRunsScope: filters.setRunsScope,
      setRunsJobId: filters.setRunsJobId,
    },
    editingJobId,
    resetForm,
    refreshAll,
    startEdit,
  );

  // 计算属性
  const allJobs = useMemo(() => jobs.data?.jobs ?? [], [jobs.data?.jobs]);
  const visibleJobs = useMemo(
    () =>
      filterCronJobs(allJobs, {
        scheduleKind: filters.jobScheduleFilter,
        lastStatus: filters.jobLastStatusFilter,
      }),
    [allJobs, filters.jobLastStatusFilter, filters.jobScheduleFilter],
  );
  const runEntries = runs.data?.entries ?? [];
  const editingJob = useMemo(
    () => allJobs.find((job) => job.id === editingJobId) ?? null,
    [allJobs, editingJobId],
  );
  const selectedRunsJob = useMemo(
    () => allJobs.find((job) => job.id === filters.runsJobId) ?? null,
    [allJobs, filters.runsJobId],
  );

  // 当选中的任务被删除时，重置运行记录过滤器
  useEffect(() => {
    if (
      filters.runsScope === "job" &&
      filters.runsJobId &&
      !allJobs.some((job) => job.id === filters.runsJobId)
    ) {
      filters.setRunsScope("all");
      filters.setRunsJobId(null);
    }
  }, [allJobs, filters.runsJobId, filters.runsScope, filters]);

  // 提交表单
  const submitForm = useCallback(async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      const patch = {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        agentId: values.agentId.trim() || undefined,
        enabled: values.enabled,
        deleteAfterRun: values.deleteAfterRun,
        schedule: buildCronSchedule(values),
        sessionTarget: values.sessionTarget,
        wakeMode: values.wakeMode,
        payload: buildCronPayload(values),
        delivery: buildCronDelivery(values),
      };

      if (editingJobId) {
        await request("cron.update", { id: editingJobId, patch });
        message.success("定时任务已更新。");
      } else {
        await request("cron.add", patch);
        message.success("定时任务已创建。");
      }

      resetForm();
      await refreshAll();
    } catch (error) {
      const hasValidationError =
        typeof error === "object" &&
        error !== null &&
        "errorFields" in error &&
        Array.isArray((error as { errorFields?: unknown[] }).errorFields);

      if (!hasValidationError) {
        message.error(error instanceof Error ? error.message : String(error));
      }
    } finally {
      setSubmitting(false);
    }
  }, [editingJobId, form, refreshAll, request, resetForm, setSubmitting]);

  return (
    <div className="cron-page">
      <div className="cron-page__header">
        <div>
          <Title level={2} style={{ marginBottom: 8 }}>
            定时任务
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            支持唤醒代理、重复执行和投递结果的调度面板。
          </Paragraph>
        </div>
        <Button
          onClick={() => void refreshAll()}
          disabled={!connected}
          loading={status.loading || jobs.loading || runs.loading}
        >
          刷新
        </Button>
      </div>

      {!connected ? (
        <Alert
          showIcon
          type="info"
          message="请先连接网关"
          description="连接成功后即可查看定时任务状态、管理任务列表并创建新的调度规则。"
        />
      ) : (
        <>
          <div className="cron-page__status-grid">
            <Card className="control-card cron-page__stat-card">
              <Statistic
                title="已启用"
                loading={status.loading}
                value={status.data?.enabled ? "是" : "否"}
                valueStyle={{ color: status.data?.enabled ? "#16a34a" : "#64748b" }}
              />
            </Card>
            <Card className="control-card cron-page__stat-card">
              <Statistic
                title="任务数"
                loading={status.loading}
                value={status.data?.jobs ?? allJobs.length}
              />
            </Card>
            <Card className="control-card cron-page__stat-card">
              <Statistic
                title="下次唤醒"
                loading={status.loading}
                value={formatTimestamp(status.data?.nextWakeAtMs)}
                valueStyle={{ fontSize: 18 }}
              />
            </Card>
          </div>

          {error && <Alert showIcon type="error" message={error} style={{ marginTop: 16 }} />}

          <div className="cron-page__main">
            <div className="cron-page__left">
              <CronJobsCard
                busyActionKey={busyActionKey}
                jobEnabledFilter={filters.jobEnabledFilter}
                jobLastStatusFilter={filters.jobLastStatusFilter}
                jobQuery={filters.jobQuery}
                jobScheduleFilter={filters.jobScheduleFilter}
                jobSortBy={filters.jobSortBy}
                jobSortDir={filters.jobSortDir}
                loading={jobs.loading}
                total={jobs.data?.total ?? allJobs.length}
                visibleJobs={visibleJobs}
                onDeleteJob={onDeleteJob}
                onEditJob={onEditJob}
                onJobEnabledFilterChange={filters.setJobEnabledFilter}
                onJobLastStatusFilterChange={filters.setJobLastStatusFilter}
                onJobQueryChange={filters.setJobQuery}
                onJobsFiltersReset={filters.resetJobFilters}
                onJobScheduleFilterChange={filters.setJobScheduleFilter}
                onJobSortByChange={filters.setJobSortBy}
                onJobSortDirChange={filters.setJobSortDir}
                onRunJob={onRunJob}
                onShowRuns={(job): Promise<void> => {
                  filters.setRunsScope("job");
                  filters.setRunsJobId(job.id);
                  return Promise.resolve();
                }}
                onToggleJob={onToggleJob}
              />

              <CronRunsCard
                allJobs={allJobs}
                loading={runs.loading}
                runEntries={runEntries}
                runsJobId={filters.runsJobId}
                runsQuery={filters.runsQuery}
                runsScope={filters.runsScope}
                runsSortDir={filters.runsSortDir}
                runsStatusFilter={filters.runsStatusFilter}
                selectedRunsJob={selectedRunsJob}
                onRunsJobIdChange={filters.setRunsJobId}
                onRunsQueryChange={filters.setRunsQuery}
                onRunsScopeChange={(value) => {
                  filters.setRunsScope(value);
                  if (value === "all") {
                    filters.setRunsJobId(null);
                  } else if (!filters.runsJobId && allJobs[0]) {
                    filters.setRunsJobId(allJobs[0].id);
                  }
                }}
                onRunsSortDirChange={filters.setRunsSortDir}
                onRunsStatusFilterChange={filters.setRunsStatusFilter}
              />
            </div>

            <div className="cron-page__right">
              <CronFormCard
                deliveryMode={deliveryMode}
                editingJobName={editingJob?.name ?? null}
                form={form}
                payloadKind={payloadKind}
                scheduleExact={scheduleExact}
                scheduleKind={scheduleKind}
                submitting={submitting}
                onReset={resetForm}
                onSubmit={submitForm}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
