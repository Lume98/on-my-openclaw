"use client";

import { useCallback, useState } from "react";
import {
  Button,
  Col,
  Empty,
  Input,
  Row,
  SectionCard,
  Space,
} from "@/components/openclaw/panels/dashboard-utils";
import { JsonBlock, stringify } from "@/components/openclaw/panels/dashboard-utils";
import { useGatewayQuery } from "@/components/openclaw/panels/use-gateway-query";
import { useGateway } from "@/components/openclaw/providers/gateway-provider";
import { useSettings } from "@/components/openclaw/providers/settings-provider";
import type { ConfigSchemaResponse, ConfigSnapshot } from "@/components/openclaw/types";

export function ConfigPanel() {
  const { request, connected } = useGateway();
  const { settings } = useSettings();
  const [rawDraft, setRawDraft] = useState<string | null>(null);

  const config = useGatewayQuery(
    useCallback(
      async () =>
        await Promise.all([
          request<ConfigSnapshot>("config.get", {}),
          request<ConfigSchemaResponse>("config.schema", {}),
        ]),
      [request],
    ),
    connected,
  );

  const snapshot = config.data?.[0];
  const schema = config.data?.[1];
  const raw =
    rawDraft ?? snapshot?.raw ?? (snapshot?.config ? stringify(snapshot.config) : "{\n}\n");

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <SectionCard
        title="原始配置"
        extra={
          <Space>
            <Button
              onClick={async () => {
                setRawDraft(null);
                await config.refresh();
              }}
            >
              重载
            </Button>
            <Button
              onClick={async () => {
                await request("config.set", { raw, baseHash: snapshot?.hash });
                setRawDraft(null);
                await config.refresh();
              }}
              disabled={!snapshot?.hash}
            >
              保存
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                await request("config.apply", {
                  raw,
                  baseHash: snapshot?.hash,
                  sessionKey: settings.sessionKey,
                });
                setRawDraft(null);
                await config.refresh();
              }}
              disabled={!snapshot?.hash}
            >
              保存并应用
            </Button>
          </Space>
        }
      >
        <Input.TextArea
          rows={18}
          value={raw}
          onChange={(event) => setRawDraft(event.target.value)}
        />
      </SectionCard>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <SectionCard title="配置快照">
            {snapshot ? <JsonBlock value={snapshot} /> : <Empty description="暂无配置" />}
          </SectionCard>
        </Col>
        <Col xs={24} lg={12}>
          <SectionCard title="配置 Schema">
            {schema ? <JsonBlock value={schema} /> : <Empty description="暂无 Schema" />}
          </SectionCard>
        </Col>
      </Row>
    </Space>
  );
}
