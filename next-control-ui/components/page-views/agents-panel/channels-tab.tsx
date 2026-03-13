"use client";

import { Alert, Button, Empty, Table } from "antd";
import type { ChannelsTabProps } from "./types";

export function ChannelsTab({
  channels,
  channelsError,
  channelsLoading,
  channelIds,
}: ChannelsTabProps) {
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
          <h3 className="agent-panel-title">通道</h3>
          <p className="agent-panel-sub">网关通道状态快照。</p>
        </div>
        <Button size="small" loading={channelsLoading} onClick={() => {}}>
          刷新
        </Button>
      </div>
      {channelsError && <Alert type="error" title={channelsError} style={{ marginBottom: 12 }} />}
      {channels && channelIds.length > 0 ? (
        <Table
          size="small"
          rowKey="id"
          dataSource={channelIds.map((id) => {
            const meta = channels?.channelMeta?.find((m) => m.id === id);
            const label = meta?.label ?? channels?.channelLabels?.[id] ?? id;
            const accounts = channels?.channelAccounts?.[id] ?? [];
            const connected = accounts.filter(
              (a) => a.connected === true || a.running === true,
            ).length;
            return {
              id,
              label,
              total: accounts.length,
              connected,
            };
          })}
          columns={[
            { title: "通道", dataIndex: "label", key: "label" },
            {
              title: "账户",
              key: "accounts",
              render: (_: unknown, r: { total: number; connected: number }) =>
                `${r.connected}/${r.total} 已连接`,
            },
          ]}
          pagination={false}
        />
      ) : (
        !channelsLoading && <Empty description="暂无通道或未加载" />
      )}
    </div>
  );
}
