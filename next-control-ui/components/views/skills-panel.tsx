"use client";

import { useCallback, useState } from "react";
import { useGateway } from "@/components/providers/gateway-provider";
import type { SkillStatusReport } from "@/components/types";
import {
  Button,
  Card,
  Empty,
  SectionCard,
  Space,
  Switch,
  Typography,
} from "@/components/views/dashboard-utils";
import { useGatewayQuery } from "@/components/views/use-gateway-query";

const { Title } = Typography;

export function SkillsPanel() {
  const { request, connected } = useGateway();
  const [editingKeys, setEditingKeys] = useState<Record<string, string>>({});

  const skills = useGatewayQuery<SkillStatusReport>(
    useCallback(async () => await request<SkillStatusReport>("skills.status", {}), [request]),
    connected,
  );

  return (
    <SectionCard
      title="技能状态"
      extra={<Button onClick={() => void skills.refresh()}>刷新</Button>}
    >
      {skills.data?.skills?.length ? (
        <Space orientation="vertical" style={{ width: "100%" }}>
          {skills.data.skills.map((skill) => {
            const skillKey = skill.id ?? skill.name;
            return (
              <Card key={skillKey} size="small" className="control-subcard">
                <Space orientation="vertical" style={{ width: "100%" }}>
                  <Space>
                    <Title level={5} style={{ margin: 0 }}>
                      {skill.name}
                    </Title>
                    <span
                      style={{
                        padding: "2px 8px",
                        background: "#f0f0f0",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      {skill.status ?? "未知状态"}
                    </span>
                  </Space>
                  <Space wrap>
                    <Switch
                      checked={skill.enabled !== false}
                      onChange={async (enabled) => {
                        await request("skills.update", { skillKey, enabled });
                        await skills.refresh();
                      }}
                    />
                    <input
                      placeholder="API Key"
                      value={editingKeys[skillKey] ?? ""}
                      onChange={(event) =>
                        setEditingKeys((current) => ({
                          ...current,
                          [skillKey]: event.target.value,
                        }))
                      }
                      className="ant-input"
                      style={{ width: 260 }}
                    />
                    <Button
                      onClick={async () => {
                        await request("skills.update", {
                          skillKey,
                          apiKey: editingKeys[skillKey] ?? "",
                        });
                        await skills.refresh();
                      }}
                    >
                      保存 API Key
                    </Button>
                    {skill.installId ? (
                      <Button
                        onClick={async () => {
                          await request("skills.install", {
                            name: skill.name,
                            installId: skill.installId,
                            timeoutMs: 120000,
                          });
                          await skills.refresh();
                        }}
                      >
                        安装
                      </Button>
                    ) : null}
                  </Space>
                </Space>
              </Card>
            );
          })}
        </Space>
      ) : (
        <Empty description="暂无技能数据" />
      )}
    </SectionCard>
  );
}
