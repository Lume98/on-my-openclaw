"use client";

import { useCallback, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Form,
  Input,
  Row,
  SectionCard,
  Select,
  Space,
} from "@/components/openclaw/panels/dashboard-utils";
import { useGateway } from "@/components/openclaw/providers/gateway-provider";
import { JsonBlock, stringify } from "./dashboard-utils";
import { useGatewayQuery } from "./use-gateway-query";

export function DebugPanel() {
  const { request, connected, hello } = useGateway();
  const [method, setMethod] = useState("status");
  const [params, setParams] = useState("{}");
  const [result, setResult] = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const debug = useGatewayQuery(
    useCallback(
      async () =>
        await Promise.all([
          request("status", {}),
          request("health", {}),
          request("models.list", {}),
          request("last-heartbeat", {}),
        ]),
      [request],
    ),
    connected,
  );

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <SectionCard
            title="基础调试数据"
            extra={<Button onClick={() => void debug.refresh()}>刷新</Button>}
          >
            {debug.loading ? <div className="ant-spin" /> : <JsonBlock value={debug.data} />}
          </SectionCard>
        </Col>
        <Col xs={24} xl={12}>
          <SectionCard title="调用任意方法">
            <Form layout="vertical">
              <Form.Item label="方法名">
                <Select
                  value={method}
                  onChange={setMethod}
                  options={(hello?.features?.methods ?? ["status"]).map((item) => ({
                    label: item,
                    value: item,
                  }))}
                />
              </Form.Item>
              <Form.Item label="参数 JSON">
                <Input.TextArea
                  rows={8}
                  value={params}
                  onChange={(event) => setParams(event.target.value)}
                />
              </Form.Item>
              <Button
                type="primary"
                onClick={async () => {
                  setCallError(null);
                  setResult(null);
                  try {
                    const parsed = params.trim() ? JSON.parse(params) : {};
                    const response = await request(method, parsed);
                    setResult(stringify(response));
                  } catch (error) {
                    setCallError(error instanceof Error ? error.message : String(error));
                  }
                }}
              >
                执行
              </Button>
            </Form>
            {callError ? (
              <Alert type="error" showIcon message={callError} style={{ marginTop: 16 }} />
            ) : null}
            {result ? <JsonBlock value={result} height={280} /> : null}
          </SectionCard>
        </Col>
      </Row>
    </Space>
  );
}
