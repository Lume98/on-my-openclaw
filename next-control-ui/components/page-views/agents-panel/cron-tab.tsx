"use client";

import { Button, Empty, Table, Tag, Typography } from "antd";
import type { CronJob } from "@/lib/types";
import type { CronTabProps } from "./types";
import { formatNextRun } from "./utils";

export function CronTab({
  cronStatus,
  cronJobsForAgent,
  cronError: _cronError,
  cronLoading,
}: CronTabProps) {
  return (
    <div className="agent-panel-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h3 className="agent-panel-title">定时任务</h3>
          <p className="agent-panel-sub">针对当前代理的定时任务。</p>
        </div>
        <Button size="small" loading={cronLoading} onClick={() => {}}>
          刷新
        </Button>
      </div>
      {cronStatus && (
        <div className="agents-overview-grid" style={{ marginTop: 12, marginBottom: 16 }}>
          <div className="agent-kv">
            <span className="agent-kv-label">已启用</span>
            <span className="agent-kv-value">{cronStatus.enabled ? "是" : "否"}</span>
          </div>
          <div className="agent-kv">
            <span className="agent-kv-label">任务数</span>
            <span className="agent-kv-value">{cronStatus.jobs ?? "—"}</span>
          </div>
          <div className="agent-kv">
            <span className="agent-kv-label">下次唤醒</span>
            <span className="agent-kv-value">{formatNextRun(cronStatus.nextWakeAtMs)}</span>
          </div>
        </div>
      )}
      <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
        本代理定时任务
      </Typography.Text>
      {cronJobsForAgent.length > 0 ? (
        <Table<CronJob>
          size="small"
          rowKey="id"
          dataSource={cronJobsForAgent}
          columns={[
            { title: "名称", dataIndex: "name", key: "name" },
            {
              title: "状态",
              key: "enabled",
              render: (_: unknown, j: CronJob) =>
                j.enabled !== false ? (
                  <Tag color="green">已启用</Tag>
                ) : (
                  <Tag color="default">已禁用</Tag>
                ),
            },
            {
              title: "下次运行",
              key: "nextRun",
              render: (_: unknown, j: CronJob) => formatNextRun(j.state?.nextRunAtMs ?? null),
            },
          ]}
          pagination={false}
        />
      ) : (
        !cronLoading && <Empty description="暂无针对此代理的定时任务" />
      )}
    </div>
  );
}
