"use client";

import { useCallback, useState } from "react";
import { clearDeviceAuthToken, storeDeviceAuthToken } from "@/components/device-auth";
import { loadOrCreateDeviceIdentity } from "@/components/device-identity";
import { useGateway } from "@/components/providers/gateway-provider";
import {
  Alert,
  Button,
  Card,
  Empty,
  Popconfirm,
  SectionCard,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "@/components/views/dashboard-utils";
import { formatTimestamp, stringifyList } from "@/components/views/dashboard-utils";
import { useGatewayQuery } from "@/components/views/use-gateway-query";
import { normalizeDevicePairingList, normalizeNodesPayload } from "./utils";

const { Text } = Typography;

export function NodesPanel() {
  const { request, connected } = useGateway();
  const [actionError, setActionError] = useState<string | null>(null);
  const nodes = useGatewayQuery(
    useCallback(async () => normalizeNodesPayload(await request("node.list", {})), [request]),
    connected,
  );
  const devices = useGatewayQuery(
    useCallback(
      async () => normalizeDevicePairingList(await request("device.pair.list", {})),
      [request],
    ),
    connected,
  );

  const approveDevice = useCallback(
    async (requestId: string) => {
      setActionError(null);
      try {
        await request("device.pair.approve", { requestId });
        await devices.refresh();
      } catch (error) {
        setActionError(error instanceof Error ? error.message : String(error));
      }
    },
    [devices, request],
  );

  const rejectDevice = useCallback(
    async (requestId: string) => {
      setActionError(null);
      try {
        await request("device.pair.reject", { requestId });
        await devices.refresh();
      } catch (error) {
        setActionError(error instanceof Error ? error.message : String(error));
      }
    },
    [devices, request],
  );

  const rotateDeviceToken = useCallback(
    async (deviceId: string, role: string, scopes?: string[]) => {
      setActionError(null);
      try {
        const result = await request<{
          token: string;
          role?: string;
          deviceId?: string;
          scopes?: string[];
        }>("device.token.rotate", { deviceId, role, scopes });
        if (result?.token) {
          try {
            const identity = await loadOrCreateDeviceIdentity();
            const nextRole = result.role ?? role;
            if (result.deviceId === identity.deviceId || deviceId === identity.deviceId) {
              storeDeviceAuthToken({
                deviceId: identity.deviceId,
                role: nextRole,
                token: result.token,
                scopes: result.scopes ?? scopes ?? [],
              });
            }
          } catch {
            // 当前环境可能不支持设备身份，本地缓存失败不影响服务端旋转结果
          }
          window.prompt("新的设备令牌，请立即复制保存：", result.token);
        }
        await devices.refresh();
      } catch (error) {
        setActionError(error instanceof Error ? error.message : String(error));
      }
    },
    [devices, request],
  );

  const revokeDeviceToken = useCallback(
    async (deviceId: string, role: string) => {
      setActionError(null);
      try {
        await request("device.token.revoke", { deviceId, role });
        try {
          const identity = await loadOrCreateDeviceIdentity();
          if (deviceId === identity.deviceId) {
            clearDeviceAuthToken({ deviceId: identity.deviceId, role });
          }
        } catch {
          // ignore local identity sync failure
        }
        await devices.refresh();
      } catch (error) {
        setActionError(error instanceof Error ? error.message : String(error));
      }
    },
    [devices, request],
  );

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <SectionCard
        title="设备配对"
        extra={
          <Space>
            <Button onClick={() => void devices.refresh()}>刷新设备</Button>
            <Button onClick={() => void nodes.refresh()}>刷新节点</Button>
          </Space>
        }
      >
        {actionError ? (
          <Alert type="error" showIcon message={actionError} style={{ marginBottom: 16 }} />
        ) : null}
        {devices.loading ? <Spin /> : null}
        {devices.error ? (
          <Alert type="error" showIcon message={devices.error} style={{ marginBottom: 16 }} />
        ) : null}

        {(devices.data?.pending ?? []).length > 0 ? (
          <Table
            rowKey="requestId"
            pagination={false}
            dataSource={devices.data?.pending ?? []}
            style={{ marginBottom: 16 }}
            columns={[
              {
                title: "设备",
                key: "device",
                render: (_, row) => (
                  <Space orientation="vertical" size={0}>
                    <Text strong>{row.displayName?.trim() || row.deviceId}</Text>
                    <Text type="secondary">{row.deviceId}</Text>
                  </Space>
                ),
              },
              {
                title: "角色",
                dataIndex: "role",
                key: "role",
                render: (value: unknown) => (typeof value === "string" ? value : "—"),
              },
              {
                title: "来源 IP",
                dataIndex: "remoteIp",
                key: "remoteIp",
                render: (value: unknown) => (typeof value === "string" ? value : "—"),
              },
              {
                title: "请求时间",
                dataIndex: "ts",
                key: "ts",
                render: (value: unknown) => formatTimestamp(value),
              },
              {
                title: "操作",
                key: "actions",
                render: (_, row) => (
                  <Space>
                    <Popconfirm
                      title="批准设备配对"
                      description={`确认批准 ${row.displayName?.trim() || row.deviceId} 吗？`}
                      onConfirm={async () => await approveDevice(row.requestId)}
                    >
                      <Button type="primary">批准</Button>
                    </Popconfirm>
                    <Popconfirm
                      title="拒绝设备配对"
                      description={`确认拒绝 ${row.displayName?.trim() || row.deviceId} 吗？`}
                      onConfirm={async () => await rejectDevice(row.requestId)}
                    >
                      <Button>拒绝</Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        ) : (
          <Empty description="当前没有待审批的设备配对请求" />
        )}

        <Space orientation="vertical" size="middle" style={{ width: "100%", marginTop: 16 }}>
          {(devices.data?.paired ?? []).map((device) => (
            <Card
              key={device.deviceId}
              size="small"
              className="control-subcard"
              title={device.displayName?.trim() || device.deviceId}
              extra={<Tag color="cyan">{(device.tokens ?? []).length} 个令牌</Tag>}
            >
              <dl
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px",
                  fontSize: "13px",
                }}
              >
                <dt>设备 ID</dt>
                <dd>{device.deviceId}</dd>
                <dt>来源 IP</dt>
                <dd>{device.remoteIp ?? "—"}</dd>
                <dt>角色</dt>
                <dd>{stringifyList(device.roles)}</dd>
                <dt>权限范围</dt>
                <dd>{stringifyList(device.scopes)}</dd>
                <dt>批准时间</dt>
                <dd>{formatTimestamp(device.approvedAtMs)}</dd>
                <dt>创建时间</dt>
                <dd>{formatTimestamp(device.createdAtMs)}</dd>
              </dl>
              {(device.tokens ?? []).length > 0 ? (
                <Table
                  rowKey={(row) => `${device.deviceId}-${row.role}`}
                  pagination={false}
                  size="small"
                  dataSource={device.tokens ?? []}
                  style={{ marginTop: 12 }}
                  columns={[
                    { title: "角色", dataIndex: "role", key: "role" },
                    {
                      title: "状态",
                      key: "status",
                      render: (_, row) => (
                        <Tag color={row.revokedAtMs ? "default" : "success"}>
                          {row.revokedAtMs ? "已吊销" : "有效"}
                        </Tag>
                      ),
                    },
                    {
                      title: "权限范围",
                      key: "scopes",
                      render: (_, row) => stringifyList(row.scopes),
                    },
                    {
                      title: "更新时间",
                      key: "updatedAt",
                      render: (_, row) =>
                        formatTimestamp(row.rotatedAtMs ?? row.createdAtMs ?? row.lastUsedAtMs),
                    },
                    {
                      title: "操作",
                      key: "actions",
                      render: (_, row) => (
                        <Space>
                          <Button
                            onClick={async () =>
                              await rotateDeviceToken(device.deviceId, row.role, row.scopes)
                            }
                          >
                            旋转
                          </Button>
                          {row.revokedAtMs ? null : (
                            <Popconfirm
                              title="吊销设备令牌"
                              description={`确认吊销 ${device.displayName?.trim() || device.deviceId} / ${row.role} 吗？`}
                              onConfirm={async () =>
                                await revokeDeviceToken(device.deviceId, row.role)
                              }
                            >
                              <Button danger>吊销</Button>
                            </Popconfirm>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                />
              ) : (
                <Empty description="这个设备还没有可见令牌" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          ))}
        </Space>
      </SectionCard>

      <SectionCard
        title="节点列表"
        extra={<Button onClick={() => void nodes.refresh()}>刷新</Button>}
      >
        {nodes.loading ? <Spin /> : null}
        {nodes.error ? (
          <Alert type="error" showIcon message={nodes.error} style={{ marginBottom: 16 }} />
        ) : null}
        {nodes.data && nodes.data.length > 0 ? (
          <Table
            rowKey={(record) =>
              typeof record.nodeId === "string"
                ? record.nodeId
                : typeof record.id === "string"
                  ? record.id
                  : String(Math.random())
            }
            pagination={false}
            dataSource={nodes.data}
            columns={[
              {
                title: "节点",
                key: "node",
                render: (_, row) => (
                  <Space orientation="vertical" size={0}>
                    <Text strong>
                      {typeof row.displayName === "string" && row.displayName.trim()
                        ? row.displayName
                        : typeof row.nodeId === "string"
                          ? row.nodeId
                          : "unknown"}
                    </Text>
                    <Text type="secondary">
                      {typeof row.nodeId === "string" ? row.nodeId : "—"}
                    </Text>
                  </Space>
                ),
              },
              {
                title: "状态",
                key: "status",
                render: (_, row) => (
                  <Space wrap size={[6, 6]}>
                    <Tag color={row.connected ? "success" : "default"}>
                      {row.connected ? "在线" : "离线"}
                    </Tag>
                    <Tag color={row.paired ? "cyan" : "default"}>
                      {row.paired ? "已配对" : "未配对"}
                    </Tag>
                  </Space>
                ),
              },
              {
                title: "来源 IP",
                dataIndex: "remoteIp",
                key: "remoteIp",
                render: (value: unknown) => (typeof value === "string" ? value : "—"),
              },
              {
                title: "版本",
                dataIndex: "version",
                key: "version",
                render: (value: unknown) => (typeof value === "string" ? value : "—"),
              },
              {
                title: "能力",
                key: "caps",
                render: (_, row) =>
                  Array.isArray(row.caps) && row.caps.length > 0 ? (
                    <Space wrap size={[6, 6]}>
                      {row.caps.slice(0, 8).map((cap) => (
                        <Tag
                          key={`${typeof row.nodeId === "string" ? row.nodeId : "unknown"}-${typeof cap === "string" ? cap : "unknown"}`}
                        >
                          {typeof cap === "string" ? cap : "—"}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    "—"
                  ),
              },
            ]}
          />
        ) : (
          <Empty description="暂无节点数据" />
        )}
      </SectionCard>
    </Space>
  );
}
