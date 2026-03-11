"use client";

import { useCallback } from "react";
import { Button, Empty, SectionCard, Spin } from "@/components/openclaw/panels/dashboard-utils";
import { useGateway } from "@/components/openclaw/providers/gateway-provider";
import { JsonBlock } from "./dashboard-utils";
import { useGatewayQuery } from "./use-gateway-query";

export function LogsPanel() {
  const { request, connected } = useGateway();
  const logs = useGatewayQuery(
    useCallback(
      async () =>
        await request("logs.tail", {
          limit: 400,
          maxBytes: 200000,
        }),
      [request],
    ),
    connected,
  );

  return (
    <SectionCard title="网关日志" extra={<Button onClick={() => void logs.refresh()}>刷新</Button>}>
      {logs.loading ? (
        <Spin />
      ) : logs.data ? (
        <JsonBlock value={logs.data} height={520} />
      ) : (
        <Empty description="暂无日志" />
      )}
    </SectionCard>
  );
}
