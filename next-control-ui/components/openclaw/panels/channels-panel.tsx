"use client";

import { Alert, Button, Card, Empty, Space, Spin, Switch, Tag, Typography } from "antd";
import React, { useCallback, useMemo, useState } from "react";
import { useGateway } from "@/components/openclaw/providers/gateway-provider";
import type { ChannelsStatusSnapshot } from "@/components/openclaw/types";
import { formatTimestamp, SectionCard } from "./dashboard-utils";
import { useGatewayQuery } from "./use-gateway-query";

const { Text } = Typography;

/** 按 channelOrder 排序，未在 order 中的追加到末尾 */
function orderChannelIds(channelIds: string[], channelOrder: string[] | undefined): string[] {
  if (!channelOrder?.length) {
    return [...channelIds].toSorted();
  }
  const orderSet = new Set(channelOrder);
  const inOrder = channelOrder.filter((id) => channelIds.includes(id));
  const rest = channelIds.filter((id) => !orderSet.has(id)).toSorted();
  return [...inOrder, ...rest];
}

function collectChannelFacts(account: unknown): Array<{ label: string; value: string }> {
  const pairs: Array<{ label: string; value: string }> = [];

  const append = (label: string, value: unknown) => {
    if (typeof value === "string" && value.trim()) {
      pairs.push({ label, value: value.trim() });
      return;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      pairs.push({ label, value: String(value) });
    }
  };

  append("模式", account.mode);
  append("Base URL", account.baseUrl);
  append("Webhook URL", account.webhookUrl);
  append("Webhook Path", account.webhookPath);
  append("Token 来源", account.tokenSource);
  append("Bot Token 来源", account.botTokenSource);
  append("App Token 来源", account.appTokenSource);
  append("Credential 来源", account.credentialSource);
  append("Audience", account.audience);
  append("Audience 类型", account.audienceType);
  append("端口", account.port);
  append("CLI 路径", account.cliPath);
  append("DB 路径", account.dbPath);

  if (Array.isArray(account.allowFrom) && account.allowFrom.length > 0) {
    pairs.push({ label: "允许来源", value: account.allowFrom.join(", ") });
  }

  if (typeof account.allowUnmentionedGroups === "boolean") {
    pairs.push({ label: "允许未提及群组", value: account.allowUnmentionedGroups ? "是" : "否" });
  }

  return pairs;
}

export function ChannelsPanel() {
  const { request, connected } = useGateway();
  const [probe, setProbe] = useState(false);
  const channels = useGatewayQuery<ChannelsStatusSnapshot>(
    useCallback(
      async () =>
        await request<ChannelsStatusSnapshot>("channels.status", { probe, timeoutMs: 8000 }),
      [probe, request],
    ),
    connected,
  );
  const snapshot = channels.data;
  const channelIds = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    const ids = Array.from(
      new Set([
        ...(snapshot.channelOrder ?? []),
        ...Object.keys(snapshot.channelAccounts ?? {}),
        ...Object.keys(snapshot.channels ?? {}),
      ]),
    );
    return orderChannelIds(ids, snapshot.channelOrder);
  }, [snapshot]);

  return (
    <div className="channels-page">
      <SectionCard
        title="通道状态"
        extra={
          <Space>
            <Space size="small">
              <Text type="secondary">主动探测</Text>
              <Switch checked={probe} onChange={setProbe} />
            </Space>
            <Button onClick={() => void channels.refresh()} disabled={!connected}>
              刷新
            </Button>
          </Space>
        }
      >
        {!connected ? (
          <Alert
            type="info"
            showIcon
            message="请先连接网关"
            description="在概览页或点击头部「连接网关」完成连接后，即可查看通道状态与账号映射。"
            style={{ marginBottom: 0 }}
          />
        ) : channels.loading ? (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <Spin tip="加载通道状态…" />
          </div>
        ) : channels.error ? (
          <Alert type="error" showIcon message={channels.error} style={{ marginBottom: 0 }} />
        ) : !snapshot ? (
          <Empty description="暂无通道数据" />
        ) : (
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Text type="secondary">最近刷新：{formatTimestamp(snapshot.ts)}</Text>
            {channelIds.map((channelId) => {
              const accounts = snapshot.channelAccounts?.[channelId] ?? [];
              const defaultAccountId = snapshot.channelDefaultAccountId?.[channelId] ?? null;
              return (
                <Card
                  key={channelId}
                  className="control-subcard"
                  title={snapshot.channelLabels?.[channelId] ?? channelId}
                  extra={<Tag color="blue">{accounts.length} 个账号</Tag>}
                >
                  {accounts.length === 0 ? (
                    <Empty description="这个通道还没有账号快照" />
                  ) : (
                    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
                      {accounts.map((account) => {
                        const facts = collectChannelFacts(account);
                        const accountLabel =
                          (typeof account.name === "string" && account.name.trim()) ||
                          account.accountId;
                        return (
                          <Card
                            key={`${channelId}-${account.accountId}`}
                            size="small"
                            className="control-subcard"
                            title={accountLabel}
                            extra={
                              <Space wrap size={[6, 6]}>
                                {defaultAccountId === account.accountId ? (
                                  <Tag color="purple">默认账号</Tag>
                                ) : null}
                                <Tag color={account.configured ? "success" : "default"}>
                                  {account.configured ? "已配置" : "未配置"}
                                </Tag>
                                <Tag color={account.running ? "processing" : "default"}>
                                  {account.running ? "运行中" : "未运行"}
                                </Tag>
                                <Tag color={account.connected ? "success" : "warning"}>
                                  {account.connected ? "已连接" : "未连接"}
                                </Tag>
                                {account.linked != null ? (
                                  <Tag color={account.linked ? "cyan" : "default"}>
                                    {account.linked ? "已绑定" : "未绑定"}
                                  </Tag>
                                ) : null}
                              </Space>
                            }
                          >
                            {account.lastError ? (
                              <Alert
                                type="warning"
                                showIcon
                                message={account.lastError}
                                style={{ marginBottom: 12 }}
                              />
                            ) : null}
                            <dl
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                gap: "8px",
                                fontSize: "13px",
                              }}
                            >
                              <dt>账号 ID</dt>
                              <dd>{account.accountId}</dd>
                              <dt>最近探测</dt>
                              <dd>{formatTimestamp(account.lastProbeAt)}</dd>
                              <dt>最近连接</dt>
                              <dd>{formatTimestamp(account.lastConnectedAt)}</dd>
                              <dt>重连次数</dt>
                              <dd>{account.reconnectAttempts ?? "—"}</dd>
                              <dt>最近入站</dt>
                              <dd>{formatTimestamp(account.lastInboundAt)}</dd>
                              <dt>最近出站</dt>
                              <dd>{formatTimestamp(account.lastOutboundAt)}</dd>
                              {facts.map((fact) => (
                                <React.Fragment key={fact.label}>
                                  <dt>{fact.label}</dt>
                                  <dd>{fact.value}</dd>
                                </React.Fragment>
                              ))}
                            </dl>
                          </Card>
                        );
                      })}
                    </Space>
                  )}
                </Card>
              );
            })}
          </Space>
        )}
      </SectionCard>
    </div>
  );
}
