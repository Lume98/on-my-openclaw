"use client";

import { useCallback, useState } from "react";
import { useGateway } from "@/components/providers/gateway-provider";
import { useSettings } from "@/components/providers/settings-provider";
import type { SessionsListResult } from "@/components/types";
import {
  Alert,
  Button,
  Popconfirm,
  SectionCard,
  Space,
  Switch,
  Table,
  Typography,
} from "@/components/views/dashboard-utils";
import { formatTimestamp } from "@/components/views/dashboard-utils";
import { useGatewayQuery } from "@/components/views/use-gateway-query";

const { Text } = Typography;

export function SessionsPanel() {
  const { request, connected } = useGateway();
  const { applySettings } = useSettings();
  const [activeMinutes, setActiveMinutes] = useState("0");
  const [limit, setLimit] = useState("100");
  const [includeGlobal, setIncludeGlobal] = useState(true);
  const [includeUnknown, setIncludeUnknown] = useState(true);

  const sessions = useGatewayQuery<SessionsListResult>(
    useCallback(
      async () =>
        await request<SessionsListResult>("sessions.list", {
          includeGlobal,
          includeUnknown,
          ...(Number(activeMinutes) > 0 ? { activeMinutes: Number(activeMinutes) } : {}),
          ...(Number(limit) > 0 ? { limit: Number(limit) } : {}),
        }),
      [activeMinutes, includeGlobal, includeUnknown, limit, request],
    ),
    connected,
  );

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <SectionCard
        title="筛选条件"
        extra={<Button onClick={() => void sessions.refresh()}>刷新</Button>}
      >
        <Space wrap>
          <input
            value={activeMinutes}
            onChange={(event) => setActiveMinutes(event.target.value)}
            placeholder="活跃分钟"
            className="ant-input"
          />
          <input
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            placeholder="数量限制"
            className="ant-input"
          />
          <Space>
            <Text>包含全局</Text>
            <Switch checked={includeGlobal} onChange={setIncludeGlobal} />
          </Space>
          <Space>
            <Text>包含未知</Text>
            <Switch checked={includeUnknown} onChange={setIncludeUnknown} />
          </Space>
        </Space>
      </SectionCard>

      <SectionCard title="会话列表">
        {sessions.error ? (
          <Alert type="error" showIcon message={sessions.error} style={{ marginBottom: 16 }} />
        ) : null}
        <Table
          rowKey="key"
          loading={sessions.loading}
          dataSource={sessions.data?.sessions ?? []}
          columns={[
            { title: "会话 Key", dataIndex: "key", key: "key", width: 280 },
            { title: "标题", dataIndex: "derivedTitle", key: "derivedTitle" },
            { title: "通道", dataIndex: "channel", key: "channel", width: 120 },
            {
              title: "更新时间",
              dataIndex: "updatedAt",
              key: "updatedAt",
              width: 180,
              render: (value: unknown) => formatTimestamp(value),
            },
            {
              title: "操作",
              key: "actions",
              width: 220,
              render: (_, row) => (
                <Space>
                  <Button
                    onClick={() =>
                      applySettings({
                        sessionKey: row.key,
                        lastActiveSessionKey: row.key,
                      })
                    }
                  >
                    设为当前会话
                  </Button>
                  <Popconfirm
                    title="删除会话"
                    description={`确认删除 ${row.key} 吗？`}
                    onConfirm={async () => {
                      await request("sessions.delete", { key: row.key, deleteTranscript: true });
                      await sessions.refresh();
                    }}
                  >
                    <Button danger>删除</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </SectionCard>
    </Space>
  );
}
