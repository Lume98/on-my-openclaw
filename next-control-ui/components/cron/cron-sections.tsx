"use client";

import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Table,
  Typography,
  type FormInstance,
} from "antd";
import type {
  CronFormValues,
  CronJob,
  CronJobsEnabledFilter,
  CronJobsLastStatusFilter,
  CronJobsScheduleKindFilter,
  CronJobsSortBy,
  CronRunEntry,
  CronRunScope,
  CronRunsStatusFilter,
  CronSortDir,
} from "@/components/cron/cron-types";
import {
  formatDeliveryTag,
  formatDuration,
  formatSchedule,
  formatStatusTag,
  formatTimestamp,
  getJobLastStatus,
} from "@/components/cron/cron-utils";

const { Text } = Typography;

type CronJobsCardProps = {
  busyActionKey: string | null;
  jobEnabledFilter: CronJobsEnabledFilter;
  jobLastStatusFilter: CronJobsLastStatusFilter;
  jobQuery: string;
  jobScheduleFilter: CronJobsScheduleKindFilter;
  jobSortBy: CronJobsSortBy;
  jobSortDir: CronSortDir;
  loading: boolean;
  total: number;
  visibleJobs: CronJob[];
  onDeleteJob: (job: CronJob) => Promise<void>;
  onEditJob: (job: CronJob) => void;
  onJobEnabledFilterChange: (value: CronJobsEnabledFilter) => void;
  onJobLastStatusFilterChange: (value: CronJobsLastStatusFilter) => void;
  onJobQueryChange: (value: string) => void;
  onJobsFiltersReset: () => void;
  onJobScheduleFilterChange: (value: CronJobsScheduleKindFilter) => void;
  onJobSortByChange: (value: CronJobsSortBy) => void;
  onJobSortDirChange: (value: CronSortDir) => void;
  onRunJob: (job: CronJob) => Promise<void>;
  onShowRuns: (job: CronJob) => void;
  onToggleJob: (job: CronJob) => Promise<void>;
};

export function CronJobsCard({
  busyActionKey,
  jobEnabledFilter,
  jobLastStatusFilter,
  jobQuery,
  jobScheduleFilter,
  jobSortBy,
  jobSortDir,
  loading,
  total,
  visibleJobs,
  onDeleteJob,
  onEditJob,
  onJobEnabledFilterChange,
  onJobLastStatusFilterChange,
  onJobQueryChange,
  onJobsFiltersReset,
  onJobScheduleFilterChange,
  onJobSortByChange,
  onJobSortDirChange,
  onRunJob,
  onShowRuns,
  onToggleJob,
}: CronJobsCardProps) {
  return (
    <Card
      className="control-card"
      title="任务列表"
      extra={
        <Text type="secondary">
          显示 {visibleJobs.length} / 共 {total}
        </Text>
      }
    >
      <div className="cron-page__filters">
        <Input
          value={jobQuery}
          onChange={(event) => onJobQueryChange(event.target.value)}
          placeholder="按名称或描述搜索任务"
        />
        <Select<CronJobsEnabledFilter>
          value={jobEnabledFilter}
          onChange={onJobEnabledFilterChange}
          options={[
            { value: "all", label: "启用状态：全部" },
            { value: "enabled", label: "启用状态：已启用" },
            { value: "disabled", label: "启用状态：已禁用" },
          ]}
        />
        <Select<CronJobsScheduleKindFilter>
          value={jobScheduleFilter}
          onChange={onJobScheduleFilterChange}
          options={[
            { value: "all", label: "Schedule：全部" },
            { value: "at", label: "单次" },
            { value: "every", label: "循环" },
            { value: "cron", label: "Cron" },
          ]}
        />
        <Select<CronJobsLastStatusFilter>
          value={jobLastStatusFilter}
          onChange={onJobLastStatusFilterChange}
          options={[
            { value: "all", label: "Last run：全部" },
            { value: "ok", label: "成功" },
            { value: "error", label: "失败" },
            { value: "skipped", label: "跳过" },
          ]}
        />
        <Select<CronJobsSortBy>
          value={jobSortBy}
          onChange={onJobSortByChange}
          options={[
            { value: "nextRunAtMs", label: "排序：下次运行" },
            { value: "updatedAtMs", label: "排序：最近更新" },
            { value: "name", label: "排序：名称" },
          ]}
        />
        <Select<CronSortDir>
          value={jobSortDir}
          onChange={onJobSortDirChange}
          options={[
            { value: "asc", label: "升序" },
            { value: "desc", label: "降序" },
          ]}
        />
        <Button onClick={onJobsFiltersReset}>Reset</Button>
      </div>

      <Table<CronJob>
        rowKey="id"
        loading={loading}
        dataSource={visibleJobs}
        pagination={false}
        locale={{ emptyText: <Empty description="没有匹配的定时任务" /> }}
        scroll={{ x: 1100 }}
        columns={[
          {
            title: "名称",
            dataIndex: "name",
            key: "name",
            width: 220,
            render: (_value, job) => (
              <div>
                <div style={{ fontWeight: 600 }}>{job.name}</div>
                <Text type="secondary">{job.description?.trim() || "无说明"}</Text>
              </div>
            ),
          },
          {
            title: "状态",
            key: "enabled",
            width: 112,
            render: (_value, job) =>
              job.enabled ? <Tag color="success">已启用</Tag> : <Tag>已禁用</Tag>,
          },
          {
            title: "Schedule",
            key: "schedule",
            width: 240,
            render: (_value, job) => formatSchedule(job.schedule),
          },
          {
            title: "代理",
            key: "agentId",
            width: 160,
            render: (_value, job) => job.agentId ?? "—",
          },
          {
            title: "下次运行",
            key: "nextRunAtMs",
            width: 180,
            render: (_value, job) => formatTimestamp(job.state?.nextRunAtMs),
          },
          {
            title: "最近结果",
            key: "lastStatus",
            width: 130,
            render: (_value, job) => formatStatusTag(getJobLastStatus(job)),
          },
          {
            title: "操作",
            key: "actions",
            width: 320,
            render: (_value, job) => (
              <Space wrap size={[8, 8]}>
                <Button size="small" onClick={() => onEditJob(job)}>
                  编辑
                </Button>
                <Button
                  size="small"
                  loading={busyActionKey === `run-${job.id}`}
                  onClick={() => void onRunJob(job)}
                >
                  执行
                </Button>
                <Button
                  size="small"
                  loading={busyActionKey === `toggle-${job.id}`}
                  onClick={() => void onToggleJob(job)}
                >
                  {job.enabled ? "暂停" : "启用"}
                </Button>
                <Button size="small" onClick={() => onShowRuns(job)}>
                  运行记录
                </Button>
                <Popconfirm
                  title="删除定时任务"
                  description={`确认删除「${job.name}」吗？`}
                  okText="删除"
                  cancelText="取消"
                  onConfirm={() => onDeleteJob(job)}
                >
                  <Button size="small" danger loading={busyActionKey === `remove-${job.id}`}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}

type CronRunsCardProps = {
  allJobs: CronJob[];
  loading: boolean;
  runEntries: CronRunEntry[];
  runsJobId: string | null;
  runsQuery: string;
  runsScope: CronRunScope;
  runsSortDir: CronSortDir;
  runsStatusFilter: CronRunsStatusFilter;
  selectedRunsJob: CronJob | null;
  onRunsJobIdChange: (value: string) => void;
  onRunsQueryChange: (value: string) => void;
  onRunsScopeChange: (value: CronRunScope) => void;
  onRunsSortDirChange: (value: CronSortDir) => void;
  onRunsStatusFilterChange: (value: CronRunsStatusFilter) => void;
};

export function CronRunsCard({
  allJobs,
  loading,
  runEntries,
  runsJobId,
  runsQuery,
  runsScope,
  runsSortDir,
  runsStatusFilter,
  selectedRunsJob,
  onRunsJobIdChange,
  onRunsQueryChange,
  onRunsScopeChange,
  onRunsSortDirChange,
  onRunsStatusFilterChange,
}: CronRunsCardProps) {
  return (
    <Card
      className="control-card"
      title="运行历史"
      extra={
        <Text type="secondary">
          {runsScope === "job" && selectedRunsJob
            ? `当前任务：${selectedRunsJob.name}`
            : "显示全部任务"}
        </Text>
      }
    >
      <div className="cron-page__filters">
        <Select<CronRunScope>
          value={runsScope}
          onChange={onRunsScopeChange}
          options={[
            { value: "all", label: "范围：所有任务" },
            { value: "job", label: "范围：单个任务" },
          ]}
        />
        <Select<string>
          value={runsJobId ?? undefined}
          disabled={runsScope !== "job"}
          onChange={onRunsJobIdChange}
          options={allJobs.map((job) => ({ value: job.id, label: job.name }))}
          placeholder="选择任务"
        />
        <Input
          value={runsQuery}
          onChange={(event) => onRunsQueryChange(event.target.value)}
          placeholder="搜索摘要、错误或模型"
        />
        <Select<CronRunsStatusFilter>
          value={runsStatusFilter}
          onChange={onRunsStatusFilterChange}
          options={[
            { value: "all", label: "状态：全部" },
            { value: "ok", label: "成功" },
            { value: "error", label: "失败" },
            { value: "skipped", label: "跳过" },
          ]}
        />
        <Select<CronSortDir>
          value={runsSortDir}
          onChange={onRunsSortDirChange}
          options={[
            { value: "desc", label: "最新优先" },
            { value: "asc", label: "最早优先" },
          ]}
        />
      </div>

      <Table<CronRunEntry>
        rowKey={(entry) => `${entry.jobId}-${entry.ts}`}
        loading={loading}
        dataSource={runEntries}
        pagination={false}
        locale={{ emptyText: <Empty description="没有可展示的运行记录" /> }}
        scroll={{ x: 880 }}
        columns={[
          {
            title: "时间",
            dataIndex: "ts",
            key: "ts",
            width: 180,
            render: (value: number) => formatTimestamp(value),
          },
          {
            title: "任务",
            key: "job",
            width: 180,
            render: (_value, entry) => entry.jobName ?? entry.jobId,
          },
          {
            title: "状态",
            dataIndex: "status",
            key: "status",
            width: 110,
            render: (value: string | undefined) => formatStatusTag(value),
          },
          {
            title: "投递",
            dataIndex: "deliveryStatus",
            key: "deliveryStatus",
            width: 120,
            render: (value: string | undefined) => formatDeliveryTag(value),
          },
          {
            title: "耗时",
            dataIndex: "durationMs",
            key: "durationMs",
            width: 110,
            render: (value: number | undefined) => formatDuration(value),
          },
          {
            title: "摘要",
            key: "summary",
            render: (_value, entry) => entry.error ?? entry.summary ?? "—",
          },
        ]}
      />
    </Card>
  );
}

type CronFormCardProps = {
  deliveryMode: CronFormValues["deliveryMode"];
  editingJobName: string | null;
  form: FormInstance<CronFormValues>;
  payloadKind: CronFormValues["payloadKind"];
  scheduleExact: boolean;
  scheduleKind: CronFormValues["scheduleKind"];
  submitting: boolean;
  onReset: () => void;
  onSubmit: () => Promise<void>;
};

export function CronFormCard({
  deliveryMode,
  editingJobName,
  form,
  payloadKind,
  scheduleExact,
  scheduleKind,
  submitting,
  onReset,
  onSubmit,
}: CronFormCardProps) {
  return (
    <Card
      className="control-card cron-page__form-card"
      title={editingJobName ? "编辑任务" : "新建任务"}
      extra={
        editingJobName ? (
          <Button onClick={onReset} disabled={submitting}>
            取消编辑
          </Button>
        ) : null
      }
    >
      <Spin spinning={submitting}>
        <Form<CronFormValues>
          form={form}
          layout="vertical"
          initialValues={undefined}
          onFinish={() => void onSubmit()}
        >
          <div className="cron-page__form-section">
            <Text strong>基本信息</Text>
            <Form.Item
              label="名称"
              name="name"
              rules={[{ required: true, message: "请输入任务名称" }]}
            >
              <Input placeholder="晨间播报" />
            </Form.Item>
            <Form.Item label="描述" name="description">
              <Input placeholder="任务的可选说明" />
            </Form.Item>
            <div className="cron-page__inline-grid">
              <Form.Item label="代理 ID" name="agentId">
                <Input placeholder="main_xx_ops" />
              </Form.Item>
              <Form.Item label="启用" name="enabled" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>
            <Form.Item label="执行后删除" name="deleteAfterRun" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

          <div className="cron-page__form-section">
            <Text strong>调度</Text>
            <Form.Item label="调度类型" name="scheduleKind">
              <Select
                options={[
                  { value: "every", label: "循环执行" },
                  { value: "cron", label: "Cron 表达式" },
                  { value: "at", label: "单次执行" },
                ]}
              />
            </Form.Item>

            {scheduleKind === "at" ? (
              <Form.Item
                label="执行时间"
                name="scheduleAt"
                rules={[{ required: true, message: "请选择执行时间" }]}
              >
                <Input type="datetime-local" />
              </Form.Item>
            ) : null}

            {scheduleKind === "every" ? (
              <div className="cron-page__inline-grid cron-page__inline-grid--wide">
                <Form.Item
                  label="每隔"
                  name="everyAmount"
                  rules={[{ required: true, message: "请输入间隔值" }]}
                >
                  <InputNumber min={1} precision={0} style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="单位" name="everyUnit">
                  <Select
                    options={[
                      { value: "minutes", label: "分钟" },
                      { value: "hours", label: "小时" },
                      { value: "days", label: "天" },
                    ]}
                  />
                </Form.Item>
              </div>
            ) : null}

            {scheduleKind === "cron" ? (
              <>
                <Form.Item
                  label="Cron 表达式"
                  name="cronExpr"
                  rules={[{ required: true, message: "请输入 Cron 表达式" }]}
                >
                  <Input placeholder="0 7 * * *" />
                </Form.Item>
                <div className="cron-page__inline-grid">
                  <Form.Item label="时区" name="cronTz">
                    <Input placeholder="Asia/Shanghai" />
                  </Form.Item>
                  <Form.Item label="精确调度" name="scheduleExact" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </div>
                {!scheduleExact ? (
                  <div className="cron-page__inline-grid cron-page__inline-grid--wide">
                    <Form.Item label="抖动" name="staggerAmount">
                      <InputNumber min={1} precision={0} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item label="单位" name="staggerUnit">
                      <Select
                        options={[
                          { value: "seconds", label: "秒" },
                          { value: "minutes", label: "分钟" },
                        ]}
                      />
                    </Form.Item>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="cron-page__form-section">
            <Text strong>任务内容</Text>
            <div className="cron-page__inline-grid">
              <Form.Item label="会话目标" name="sessionTarget">
                <Select
                  options={[
                    { value: "isolated", label: "独立会话" },
                    { value: "main", label: "主会话" },
                  ]}
                />
              </Form.Item>
              <Form.Item label="唤醒方式" name="wakeMode">
                <Select
                  options={[
                    { value: "now", label: "立即唤醒" },
                    { value: "next-heartbeat", label: "下次心跳" },
                  ]}
                />
              </Form.Item>
            </div>
            <Form.Item label="Payload 类型" name="payloadKind">
              <Select
                options={[
                  { value: "agentTurn", label: "代理对话" },
                  { value: "systemEvent", label: "系统事件" },
                ]}
              />
            </Form.Item>
            <Form.Item
              label={payloadKind === "systemEvent" ? "事件文本" : "消息内容"}
              name="payloadText"
              rules={[{ required: true, message: "请输入任务内容" }]}
            >
              <Input.TextArea rows={4} placeholder="输入要发送给代理或系统的内容" />
            </Form.Item>
            {payloadKind === "agentTurn" ? (
              <>
                <div className="cron-page__inline-grid">
                  <Form.Item label="模型" name="payloadModel">
                    <Input placeholder="可选，留空使用默认模型" />
                  </Form.Item>
                  <Form.Item label="Thinking" name="payloadThinking">
                    <Input placeholder="low / medium / high" />
                  </Form.Item>
                </div>
                <div className="cron-page__inline-grid">
                  <Form.Item label="超时（秒）" name="timeoutSeconds">
                    <InputNumber min={1} precision={0} style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item label="轻量上下文" name="payloadLightContext" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </div>
              </>
            ) : null}
          </div>

          <div className="cron-page__form-section">
            <Text strong>投递</Text>
            <Form.Item label="投递方式" name="deliveryMode">
              <Select
                options={[
                  { value: "announce", label: "发送到通道" },
                  { value: "webhook", label: "Webhook" },
                  { value: "none", label: "不投递" },
                ]}
              />
            </Form.Item>
            {deliveryMode === "announce" ? (
              <div className="cron-page__inline-grid">
                <Form.Item label="通道" name="deliveryChannel">
                  <Input placeholder="last / telegram / slack" />
                </Form.Item>
                <Form.Item label="账号 ID" name="deliveryAccountId">
                  <Input placeholder="可选" />
                </Form.Item>
              </div>
            ) : null}
            {deliveryMode !== "none" ? (
              <Form.Item
                label={deliveryMode === "webhook" ? "Webhook 地址" : "目标"}
                name="deliveryTo"
                rules={
                  deliveryMode === "webhook"
                    ? [{ required: true, message: "请输入 Webhook 地址" }]
                    : undefined
                }
              >
                <Input
                  placeholder={
                    deliveryMode === "webhook"
                      ? "https://example.com/hook"
                      : "聊天 ID、频道 ID 或留空"
                  }
                />
              </Form.Item>
            ) : null}
            <Form.Item label="最佳努力投递" name="deliveryBestEffort" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

          <div className="cron-page__form-actions">
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingJobName ? "保存修改" : "创建任务"}
            </Button>
            <Button onClick={onReset} disabled={submitting}>
              重置
            </Button>
          </div>
        </Form>
      </Spin>
    </Card>
  );
}
