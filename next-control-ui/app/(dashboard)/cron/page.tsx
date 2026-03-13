"use client";

import { Alert, Button, Card, Form, Statistic, Typography, message } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CronFormCard, CronJobsCard, CronRunsCard } from "@/components/cron/cron-sections";
import type {
  CronFormValues,
  CronJob,
  CronJobsEnabledFilter,
  CronJobsLastStatusFilter,
  CronJobsListResult,
  CronJobsScheduleKindFilter,
  CronJobsSortBy,
  CronRunScope,
  CronRunsResult,
  CronRunsStatusFilter,
  CronSortDir,
} from "@/components/cron/cron-types";
import { DEFAULT_CRON_FORM } from "@/components/cron/cron-types";
import {
  buildCronDelivery,
  buildCronPayload,
  buildCronSchedule,
  filterCronJobs,
  formatTimestamp,
  jobToFormValues,
} from "@/components/cron/cron-utils";
import { useGatewayQuery } from "@/components/page-views/shared/use-gateway-query";
import { useGateway } from "@/components/providers/gateway-provider";
import type { CronStatus } from "@/lib/types";

const { Paragraph, Title } = Typography;

export default function CronPage() {
  const { request, connected } = useGateway();
  const [form] = Form.useForm<CronFormValues>();
  const formCardRef = useRef<HTMLDivElement | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyActionKey, setBusyActionKey] = useState<string | null>(null);
  const [jobQuery, setJobQuery] = useState("");
  const [jobEnabledFilter, setJobEnabledFilter] = useState<CronJobsEnabledFilter>("all");
  const [jobScheduleFilter, setJobScheduleFilter] = useState<CronJobsScheduleKindFilter>("all");
  const [jobLastStatusFilter, setJobLastStatusFilter] = useState<CronJobsLastStatusFilter>("all");
  const [jobSortBy, setJobSortBy] = useState<CronJobsSortBy>("nextRunAtMs");
  const [jobSortDir, setJobSortDir] = useState<CronSortDir>("asc");
  const [runsScope, setRunsScope] = useState<CronRunScope>("all");
  const [runsJobId, setRunsJobId] = useState<string | null>(null);
  const [runsQuery, setRunsQuery] = useState("");
  const [runsStatusFilter, setRunsStatusFilter] = useState<CronRunsStatusFilter>("all");
  const [runsSortDir, setRunsSortDir] = useState<CronSortDir>("desc");

  const scheduleKind = Form.useWatch("scheduleKind", form) ?? DEFAULT_CRON_FORM.scheduleKind;
  const payloadKind = Form.useWatch("payloadKind", form) ?? DEFAULT_CRON_FORM.payloadKind;
  const deliveryMode = Form.useWatch("deliveryMode", form) ?? DEFAULT_CRON_FORM.deliveryMode;
  const scheduleExact = Form.useWatch("scheduleExact", form) ?? DEFAULT_CRON_FORM.scheduleExact;

  const status = useGatewayQuery<CronStatus>(
    useCallback(async () => await request<CronStatus>("cron.status", {}), [request]),
    connected,
  );

  const jobs = useGatewayQuery<CronJobsListResult>(
    useCallback(
      async () =>
        await request<CronJobsListResult>("cron.list", {
          includeDisabled: jobEnabledFilter !== "enabled",
          limit: 100,
          offset: 0,
          query: jobQuery.trim() || undefined,
          enabled: jobEnabledFilter,
          sortBy: jobSortBy,
          sortDir: jobSortDir,
        }),
      [jobEnabledFilter, jobQuery, jobSortBy, jobSortDir, request],
    ),
    connected,
  );

  const runs = useGatewayQuery<CronRunsResult>(
    useCallback(
      async () =>
        await request<CronRunsResult>("cron.runs", {
          scope: runsScope,
          id: runsScope === "job" ? (runsJobId ?? undefined) : undefined,
          limit: 50,
          offset: 0,
          query: runsQuery.trim() || undefined,
          status: runsStatusFilter,
          sortDir: runsSortDir,
        }),
      [request, runsJobId, runsQuery, runsScope, runsSortDir, runsStatusFilter],
    ),
    connected,
  );

  const allJobs = useMemo(() => jobs.data?.jobs ?? [], [jobs.data?.jobs]);
  const visibleJobs = useMemo(
    () =>
      filterCronJobs(allJobs, {
        scheduleKind: jobScheduleFilter,
        lastStatus: jobLastStatusFilter,
      }),
    [allJobs, jobLastStatusFilter, jobScheduleFilter],
  );
  const runEntries = runs.data?.entries ?? [];
  const editingJob = useMemo(
    () => allJobs.find((job) => job.id === editingJobId) ?? null,
    [allJobs, editingJobId],
  );
  const selectedRunsJob = useMemo(
    () => allJobs.find((job) => job.id === runsJobId) ?? null,
    [allJobs, runsJobId],
  );

  useEffect(() => {
    if (runsScope === "job" && runsJobId && !allJobs.some((job) => job.id === runsJobId)) {
      setRunsScope("all");
      setRunsJobId(null);
    }
  }, [allJobs, runsJobId, runsScope]);

  const refreshAll = useCallback(async () => {
    await Promise.all([status.refresh(), jobs.refresh(), runs.refresh()]);
  }, [jobs, runs, status]);

  const resetForm = useCallback(() => {
    setEditingJobId(null);
    form.resetFields();
    form.setFieldsValue(DEFAULT_CRON_FORM);
  }, [form]);

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
  }, [editingJobId, form, refreshAll, request, resetForm]);

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

  const handleEditJob = useCallback(
    (job: CronJob) => {
      setEditingJobId(job.id);
      form.setFieldsValue(jobToFormValues(job));
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [form],
  );

  const handleRunJob = useCallback(
    async (job: CronJob) =>
      await runAction(`run-${job.id}`, async () => {
        await request("cron.run", { id: job.id, mode: "force" });
        setRunsScope("job");
        setRunsJobId(job.id);
        message.success(`已触发任务「${job.name}」执行。`);
      }),
    [request, runAction],
  );

  const handleToggleJob = useCallback(
    async (job: CronJob) =>
      await runAction(`toggle-${job.id}`, async () => {
        await request("cron.update", {
          id: job.id,
          patch: { enabled: !job.enabled },
        });
        message.success(job.enabled ? "任务已禁用。" : "任务已启用。");
      }),
    [request, runAction],
  );

  const handleDeleteJob = useCallback(
    async (job: CronJob) =>
      await runAction(`remove-${job.id}`, async () => {
        await request("cron.remove", { id: job.id });
        if (editingJobId === job.id) {
          resetForm();
        }
        if (runsJobId === job.id) {
          setRunsScope("all");
          setRunsJobId(null);
        }
        message.success("定时任务已删除。");
      }),
    [editingJobId, request, resetForm, runAction, runsJobId],
  );

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

          {(status.error || jobs.error || runs.error) && (
            <Alert
              showIcon
              type="error"
              message={status.error ?? jobs.error ?? runs.error ?? "加载定时任务失败"}
              style={{ marginTop: 16 }}
            />
          )}

          <div className="cron-page__main">
            <div className="cron-page__left">
              <CronJobsCard
                busyActionKey={busyActionKey}
                jobEnabledFilter={jobEnabledFilter}
                jobLastStatusFilter={jobLastStatusFilter}
                jobQuery={jobQuery}
                jobScheduleFilter={jobScheduleFilter}
                jobSortBy={jobSortBy}
                jobSortDir={jobSortDir}
                loading={jobs.loading}
                total={jobs.data?.total ?? allJobs.length}
                visibleJobs={visibleJobs}
                onDeleteJob={handleDeleteJob}
                onEditJob={handleEditJob}
                onJobEnabledFilterChange={setJobEnabledFilter}
                onJobLastStatusFilterChange={setJobLastStatusFilter}
                onJobQueryChange={setJobQuery}
                onJobsFiltersReset={() => {
                  setJobQuery("");
                  setJobEnabledFilter("all");
                  setJobScheduleFilter("all");
                  setJobLastStatusFilter("all");
                  setJobSortBy("nextRunAtMs");
                  setJobSortDir("asc");
                }}
                onJobScheduleFilterChange={setJobScheduleFilter}
                onJobSortByChange={setJobSortBy}
                onJobSortDirChange={setJobSortDir}
                onRunJob={handleRunJob}
                onShowRuns={(job) => {
                  setRunsScope("job");
                  setRunsJobId(job.id);
                }}
                onToggleJob={handleToggleJob}
              />

              <CronRunsCard
                allJobs={allJobs}
                loading={runs.loading}
                runEntries={runEntries}
                runsJobId={runsJobId}
                runsQuery={runsQuery}
                runsScope={runsScope}
                runsSortDir={runsSortDir}
                runsStatusFilter={runsStatusFilter}
                selectedRunsJob={selectedRunsJob}
                onRunsJobIdChange={setRunsJobId}
                onRunsQueryChange={setRunsQuery}
                onRunsScopeChange={(value) => {
                  setRunsScope(value);
                  if (value === "all") {
                    setRunsJobId(null);
                  } else if (!runsJobId && allJobs[0]) {
                    setRunsJobId(allJobs[0].id);
                  }
                }}
                onRunsSortDirChange={setRunsSortDir}
                onRunsStatusFilterChange={setRunsStatusFilter}
              />
            </div>

            <div className="cron-page__right" ref={formCardRef}>
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
