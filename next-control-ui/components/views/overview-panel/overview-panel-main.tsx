"use client";

import {
  ApiOutlined,
  ClockCircleOutlined,
  DisconnectOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { useGateway } from "@/components/providers/gateway-provider";
import { useSettings } from "@/components/providers/settings-provider";
import { formatDuration } from "@/components/views/dashboard-utils";
import { shouldShowPairingHint, authFailureCodes } from "./utils";

const { Text, Title } = Typography;

function getStatusBadge(status: boolean) {
  if (status) {
    return <Badge status="success" text="正常" />;
  }
  return <Badge status="error" text="离线" />;
}

export function OverviewPanel() {
  const {
    connected,
    connecting,
    hello,
    lastError,
    lastErrorCode,
    presenceEntries,
    refreshPresence,
    connect,
    disconnect,
  } = useGateway();
  const { settings, password, applySettings, setPassword } = useSettings();
  const snapshot = hello?.snapshot as
    | {
        uptimeMs?: number;
        policy?: { tickIntervalMs?: number };
        authMode?: "none" | "token" | "password" | "trusted-proxy";
      }
    | undefined;

  const showPairingHint = shouldShowPairingHint(connected, lastError, lastErrorCode);
  const showAuthHint =
    !connected &&
    Boolean(lastError) &&
    (lastErrorCode
      ? authFailureCodes.has(lastErrorCode)
      : (lastError ?? "").toLowerCase().includes("unauthorized"));
  const showInsecureContextHint =
    !connected &&
    Boolean(lastError) &&
    (lastErrorCode === ConnectErrorDetailCodes.CONTROL_UI_DEVICE_IDENTITY_REQUIRED ||
      lastErrorCode === ConnectErrorDetailCodes.DEVICE_IDENTITY_REQUIRED ||
      (lastError ?? "").toLowerCase().includes("secure context") ||
      (lastError ?? "").toLowerCase().includes("device identity required"));

  const uptime = formatDuration(snapshot?.uptimeMs);
  const tickInterval =
    typeof snapshot?.policy?.tickIntervalMs === "number"
      ? `${Math.round(snapshot.policy.tickIntervalMs / 1000)}s`
      : "不适用";

  const channelLinks = ["WhatsApp", "Telegram", "Discord", "Signal", "iMessage"];

  const gutter: [number, number] = [16, 16];

  return (
    <div className="overview-page">
      {/* 主内容区：两列布局，等高 */}
      <Row gutter={gutter} className="overview-cards-row">
        {/* 左列：网关访问 */}
        <Col xs={24} lg={12}>
          <Card
            className="overview-card"
            title={
              <Space>
                <ApiOutlined style={{ color: "#1890ff" }} />
                <span>网关访问</span>
              </Space>
            }
          >
            <div className="overview-gateway-rows">
              {/* 第一行：说明 + 四个连接字段 */}
              <div className="overview-gateway-row1">
                <Text type="secondary" style={{ fontSize: 14 }}>
                  仪表板连接的位置及其身份验证方式。
                </Text>
                <Form layout="vertical" className="overview-gateway-form">
                  <Row gutter={[12, 0]}>
                    <Col xs={24} sm={12} md={6}>
                      <Form.Item label={<Text type="secondary">WebSocket URL</Text>}>
                        <Input
                          value={settings.gatewayUrl}
                          onChange={(event) => applySettings({ gatewayUrl: event.target.value })}
                          placeholder="ws://localhost:8789"
                          prefix={<ApiOutlined />}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Form.Item label={<Text type="secondary">网关令牌</Text>}>
                        <Input
                          value={settings.token}
                          onChange={(event) => applySettings({ token: event.target.value })}
                          placeholder="OPENCLAW_GATEWAY_TOKEN"
                          prefix={<UserOutlined />}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Form.Item label={<Text type="secondary">密码 (不存储)</Text>}>
                        <Input.Password
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="可选，用于密码认证"
                          autoComplete="off"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Form.Item label={<Text type="secondary">默认会话密钥</Text>}>
                        <Input
                          value={settings.sessionKey}
                          onChange={(event) =>
                            applySettings({
                              sessionKey: event.target.value || "main",
                              lastActiveSessionKey: event.target.value || "main",
                            })
                          }
                          placeholder="agent:main:main"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </div>
              {/* 第二行：语言 + 按钮 + 提示 + 告警 */}
              <div className="overview-gateway-row2">
                <Space wrap size="middle" align="center">
                  <Form layout="inline" style={{ marginBottom: 0 }}>
                    <Form.Item
                      label={<Text type="secondary">语言</Text>}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        value={settings.locale ?? "zh-CN"}
                        onChange={(value) => applySettings({ locale: value })}
                        style={{ width: 120 }}
                        options={[
                          { label: "简体中文", value: "zh-CN" },
                          { label: "English", value: "en-US" },
                        ]}
                      />
                    </Form.Item>
                  </Form>
                  <Space>
                    {connected ? (
                      <Button danger onClick={disconnect} icon={<DisconnectOutlined />}>
                        断开
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        loading={connecting}
                        onClick={connect}
                        icon={<ApiOutlined />}
                      >
                        连接
                      </Button>
                    )}
                    <Button onClick={() => void refreshPresence()} disabled={!connected}>
                      刷新
                    </Button>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    点击连接以应用连接更改。
                  </Text>
                </Space>
                <Space orientation="vertical" size="small" style={{ width: "100%", marginTop: 8 }}>
                  {lastError ? <Alert type="error" showIcon title={lastError} /> : null}
                  {showPairingHint ? (
                    <Alert
                      type="warning"
                      showIcon
                      title="当前连接需要设备配对"
                      description="先在已登录的设备或 CLI 中批准当前浏览器的配对请求，然后回到节点页查看待审批设备。"
                    />
                  ) : null}
                  {showAuthHint ? (
                    <Alert
                      type="warning"
                      showIcon
                      title={
                        lastErrorCode && authRequiredCodes.has(lastErrorCode)
                          ? "需要提供鉴权信息"
                          : "鉴权失败"
                      }
                      description={
                        lastErrorCode && authRequiredCodes.has(lastErrorCode)
                          ? "请填写共享令牌或密码，或者使用带 token 的控制台地址重新进入。"
                          : "当前令牌、密码或设备令牌可能无效，确认后重新连接。"
                      }
                    />
                  ) : null}
                  {showInsecureContextHint ? (
                    <Alert
                      type="info"
                      showIcon
                      title="当前浏览器上下文不安全"
                      description="设备身份签名只在 HTTPS、localhost 或受信安全上下文下可用。若必须使用 HTTP，需要网关允许不安全鉴权。"
                    />
                  ) : null}
                </Space>
              </div>
            </div>
          </Card>
        </Col>

        {/* 右列：快照 */}
        <Col xs={24} lg={12}>
          <Card
            className="overview-card"
            title={
              <Space>
                <ClockCircleOutlined style={{ color: "#1890ff" }} />
                <span>快照</span>
              </Space>
            }
          >
            <div className="overview-snapshot">
              <Text type="secondary" className="overview-snapshot-desc">
                最新的网关握手信息。
              </Text>
              <dl className="overview-snapshot-list">
                <div className="overview-snapshot-row">
                  <dt>状态</dt>
                  <dd>{getStatusBadge(connected)}</dd>
                </div>
                <div className="overview-snapshot-row">
                  <dt>运行时间</dt>
                  <dd>{uptime}</dd>
                </div>
                <div className="overview-snapshot-row">
                  <dt>刻度间隔</dt>
                  <dd>{tickInterval}</dd>
                </div>
                <div className="overview-snapshot-row">
                  <dt>最后频道刷新</dt>
                  <dd>{hello ? "刚刚" : "—"}</dd>
                </div>
                <div className="overview-snapshot-row">
                  <dt>服务端版本</dt>
                  <dd>{hello?.server?.version ?? "—"}</dd>
                </div>
                <div className="overview-snapshot-row">
                  <dt>鉴权模式</dt>
                  <dd>
                    <Tag
                      className="overview-snapshot-tag"
                      color={snapshot?.authMode === "none" ? "default" : "blue"}
                    >
                      {snapshot?.authMode ?? "—"}
                    </Tag>
                  </dd>
                </div>
                <div className="overview-snapshot-row">
                  <dt>权限范围</dt>
                  <dd>
                    {(hello?.auth?.scopes ?? []).length > 0 ? (
                      <Space wrap size={[4, 4]}>
                        {(hello?.auth?.scopes ?? []).map((scope) => (
                          <Tag key={scope} color="green" className="overview-snapshot-tag">
                            {scope}
                          </Tag>
                        ))}
                      </Space>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>
              <Text type="secondary" className="overview-snapshot-footer">
                使用频道链接 {channelLinks.join("、")}。
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 摘要卡片：三列等高 */}
      <Row gutter={gutter} className="overview-stats-row">
        <Col xs={24} sm={8}>
          <Card className="overview-stat-card">
            <Statistic
              title="实例"
              value={presenceEntries.length}
              styles={{ content: { color: "#3f8600" } }}
              prefix={<ApiOutlined />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              过去 5 分钟内的在线信号。
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="overview-stat-card">
            <Statistic
              title="会话"
              value={settings.sessionKey ? 1 : 0}
              styles={{ content: { color: "#1890ff" } }}
              prefix={<UserOutlined />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              网关跟踪的最近会话密钥。
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="overview-stat-card">
            <Statistic
              title="定时任务"
              value="已启用"
              styles={{ content: { color: "#cf1322", fontSize: 20 } }}
              prefix={<ClockCircleOutlined />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              下次唤醒 n/a
            </Text>
          </Card>
        </Col>
      </Row>

      {/* 备注卡片：纳入网格 */}
      <Row gutter={gutter}>
        <Col span={24}>
          <Card>
            <Space orientation="vertical" size="small" style={{ width: "100%" }}>
              <Title level={5} style={{ margin: 0 }}>
                备注
              </Title>
              <Text type="secondary" style={{ fontSize: 14 }}>
                远程控制设置的快速提醒。
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
