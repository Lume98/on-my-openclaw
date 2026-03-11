"use client";

import { useCallback, useState } from "react";
import {
  Button,
  Empty,
  SectionCard,
  Select,
  Space,
} from "@/components/openclaw/panels/dashboard-utils";
import { useGateway } from "@/components/openclaw/providers/gateway-provider";
import type { AgentsListResult, ToolsCatalogResult } from "@/components/openclaw/types";
import { JsonBlock } from "./dashboard-utils";
import { useGatewayQuery } from "./use-gateway-query";

export function AgentsPanel() {
  const { request, connected } = useGateway();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const agents = useGatewayQuery<AgentsListResult>(
    useCallback(async () => await request<AgentsListResult>("agents.list", {}), [request]),
    connected,
  );
  const activeAgentId =
    selectedAgentId ?? agents.data?.defaultId ?? agents.data?.agents[0]?.id ?? null;

  const tools = useGatewayQuery<ToolsCatalogResult>(
    useCallback(
      async () =>
        await request<ToolsCatalogResult>("tools.catalog", {
          agentId: activeAgentId ?? undefined,
          includePlugins: true,
        }),
      [activeAgentId, request],
    ),
    connected && Boolean(activeAgentId),
  );

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <SectionCard
        title="代理列表"
        extra={<Button onClick={() => void agents.refresh()}>刷新</Button>}
      >
        <Space orientation="vertical" style={{ width: "100%" }}>
          <Select
            value={activeAgentId ?? undefined}
            placeholder="选择代理"
            onChange={setSelectedAgentId}
            options={(agents.data?.agents ?? []).map((agent) => ({
              label: agent.name ?? agent.id,
              value: agent.id,
            }))}
          />
          {agents.data ? (
            <JsonBlock value={agents.data} height={260} />
          ) : (
            <Empty description="暂无代理数据" />
          )}
        </Space>
      </SectionCard>

      <SectionCard
        title="工具目录"
        extra={<Button onClick={() => void tools.refresh()}>刷新</Button>}
      >
        {tools.loading ? (
          <div className="ant-spin" />
        ) : tools.data ? (
          <JsonBlock value={tools.data} />
        ) : (
          <Empty description="暂无工具目录" />
        )}
      </SectionCard>
    </Space>
  );
}
