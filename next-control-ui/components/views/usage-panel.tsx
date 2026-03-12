"use client";

import { useCallback, useState } from "react";
import { useGateway } from "@/components/providers/gateway-provider";
import { Button, Col, Row, SectionCard, Space } from "@/components/views/dashboard-utils";
import { JsonBlock } from "@/components/views/dashboard-utils";
import { useGatewayQuery } from "@/components/views/use-gateway-query";

export function UsagePanel() {
  const { request, connected } = useGateway();
  const [range, setRange] = useState(() => {
    const now = Date.now();
    return {
      startDate: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      endDate: new Date(now).toISOString().slice(0, 10),
    };
  });

  const usage = useGatewayQuery(
    useCallback(
      async () =>
        await Promise.all([
          request("sessions.usage", {
            startDate: range.startDate,
            endDate: range.endDate,
            limit: 1000,
            includeContextWeight: true,
          }),
          request("usage.cost", {
            startDate: range.startDate,
            endDate: range.endDate,
          }),
        ]),
      [range.endDate, range.startDate, request],
    ),
    connected,
  );

  const [usageResult, costResult] = usage.data ?? [];

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <SectionCard
        title="日期范围"
        extra={<Button onClick={() => void usage.refresh()}>刷新</Button>}
      >
        <Space wrap>
          <input
            value={range.startDate}
            onChange={(event) =>
              setRange((current) => ({ ...current, startDate: event.target.value }))
            }
            placeholder="开始日期"
            className="ant-input"
          />
          <input
            value={range.endDate}
            onChange={(event) =>
              setRange((current) => ({ ...current, endDate: event.target.value }))
            }
            placeholder="结束日期"
            className="ant-input"
          />
        </Space>
      </SectionCard>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <SectionCard title="Sessions Usage">
            {usage.loading ? <div className="ant-spin" /> : <JsonBlock value={usageResult} />}
          </SectionCard>
        </Col>
        <Col xs={24} md={12}>
          <SectionCard title="Usage Cost">
            {usage.loading ? <div className="ant-spin" /> : <JsonBlock value={costResult} />}
          </SectionCard>
        </Col>
      </Row>
    </Space>
  );
}
