"use client";

import { Button, Empty, SectionCard, Table } from "@/components/panels/dashboard-utils";
import { formatTimestamp } from "@/components/panels/dashboard-utils";
import { useGateway } from "@/components/providers/gateway-provider";

export function InstancesPanel() {
  const { presenceEntries, refreshPresence } = useGateway();
  return (
    <SectionCard
      title="Presence 实例"
      extra={<Button onClick={() => void refreshPresence()}>刷新</Button>}
    >
      {presenceEntries.length === 0 ? (
        <Empty description="当前没有在线实例" />
      ) : (
        <Table
          rowKey={(record) => String(record.id ?? Math.random())}
          pagination={false}
          dataSource={presenceEntries}
          columns={[
            { title: "ID", dataIndex: "id", key: "id" },
            { title: "名称", dataIndex: "name", key: "name" },
            { title: "状态", dataIndex: "status", key: "status" },
            {
              title: "时间",
              dataIndex: "timestamp",
              key: "timestamp",
              render: (value: unknown) => formatTimestamp(value),
            },
          ]}
        />
      )}
    </SectionCard>
  );
}
