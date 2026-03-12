"use client";

import { useCallback } from "react";
import { Button, Col, Row, SectionCard, Space } from "@/components/panels/dashboard-utils";
import { JsonBlock } from "@/components/panels/dashboard-utils";
import { useGatewayQuery } from "@/components/panels/use-gateway-query";
import { useGateway } from "@/components/providers/gateway-provider";

export function CronPanel() {
  const { request, connected } = useGateway();

  const cron = useGatewayQuery(
    useCallback(
      async () =>
        await Promise.all([
          request("cron.status", {}),
          request("cron.list", {
            includeDisabled: true,
            limit: 20,
            offset: 0,
            enabled: "all",
            sortBy: "nextRunAtMs",
            sortDir: "asc",
          }),
          request("cron.runs", {
            scope: "all",
            limit: 20,
            offset: 0,
            status: "all",
            sortDir: "desc",
          }),
        ]),
      [request],
    ),
    connected,
  );

  const [status, jobs, runs] = cron.data ?? [];

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <SectionCard
        title="Cron 状态"
        extra={<Button onClick={() => void cron.refresh()}>刷新</Button>}
      >
        {cron.loading ? <div className="ant-spin" /> : <JsonBlock value={status} height={220} />}
      </SectionCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <SectionCard title="任务列表">
            {cron.loading ? <div className="ant-spin" /> : <JsonBlock value={jobs} />}
          </SectionCard>
        </Col>
        <Col xs={24} lg={12}>
          <SectionCard title="运行记录">
            {cron.loading ? <div className="ant-spin" /> : <JsonBlock value={runs} />}
          </SectionCard>
        </Col>
      </Row>
    </Space>
  );
}
