"use client";

import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { ConnectErrorDetailCodes } from "@/components/openclaw/connect-error-details";
import { clearDeviceAuthToken, storeDeviceAuthToken } from "@/components/openclaw/device-auth";
import { loadOrCreateDeviceIdentity } from "@/components/openclaw/device-identity";
import type { TabKey } from "@/components/openclaw/navigation";
import { useGateway } from "@/components/openclaw/providers/gateway-provider";
import { useSettings } from "@/components/openclaw/providers/settings-provider";
import type {
  AgentsListResult,
  ChannelAccountSnapshot,
  ChatAttachment,
  ChatMessage,
  ChannelsStatusSnapshot,
  ConfigSchemaResponse,
  ConfigSnapshot,
  DevicePairingList,
  GatewayEventFrame,
  SessionsListResult,
  SkillStatusReport,
  ToolsCatalogResult,
} from "@/components/openclaw/types";

const { Text, Title } = Typography;

type DashboardPageProps = {
  tabKey: TabKey;
};

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
};

function stringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatTimestamp(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }
  return new Date(value).toLocaleString("zh-CN");
}

function formatDuration(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "—";
  }

  const totalSeconds = Math.floor(value / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `${days} 天 ${hours} 小时`;
  }
  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分钟`;
  }
  if (minutes > 0) {
    return `${minutes} 分钟`;
  }
  return `${totalSeconds} 秒`;
}

function stringifyList(values: unknown) {
  return Array.isArray(values) && values.length > 0 ? values.map(String).join(", ") : "—";
}

function shouldShowPairingHint(
  connected: boolean,
  lastError: string | null,
  lastErrorCode: string | null,
) {
  if (connected || !lastError) {
    return false;
  }

  return (
    lastErrorCode === ConnectErrorDetailCodes.PAIRING_REQUIRED ||
    lastError.toLowerCase().includes("pairing required")
  );
}

const authRequiredCodes = new Set<string>([
  ConnectErrorDetailCodes.AUTH_REQUIRED,
  ConnectErrorDetailCodes.AUTH_TOKEN_MISSING,
  ConnectErrorDetailCodes.AUTH_PASSWORD_MISSING,
  ConnectErrorDetailCodes.AUTH_TOKEN_NOT_CONFIGURED,
  ConnectErrorDetailCodes.AUTH_PASSWORD_NOT_CONFIGURED,
]);

const authFailureCodes = new Set<string>([
  ...authRequiredCodes,
  ConnectErrorDetailCodes.AUTH_UNAUTHORIZED,
  ConnectErrorDetailCodes.AUTH_TOKEN_MISMATCH,
  ConnectErrorDetailCodes.AUTH_PASSWORD_MISMATCH,
  ConnectErrorDetailCodes.AUTH_DEVICE_TOKEN_MISMATCH,
  ConnectErrorDetailCodes.AUTH_RATE_LIMITED,
  ConnectErrorDetailCodes.AUTH_TAILSCALE_IDENTITY_MISSING,
  ConnectErrorDetailCodes.AUTH_TAILSCALE_PROXY_MISSING,
  ConnectErrorDetailCodes.AUTH_TAILSCALE_WHOIS_FAILED,
  ConnectErrorDetailCodes.AUTH_TAILSCALE_IDENTITY_MISMATCH,
]);

function collectChannelFacts(account: ChannelAccountSnapshot) {
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

function normalizeDevicePairingList(payload: unknown): DevicePairingList {
  if (!payload || typeof payload !== "object") {
    return { pending: [], paired: [] };
  }

  const entry = payload as { pending?: unknown; paired?: unknown };
  return {
    pending: Array.isArray(entry.pending) ? (entry.pending as DevicePairingList["pending"]) : [],
    paired: Array.isArray(entry.paired) ? (entry.paired as DevicePairingList["paired"]) : [],
  };
}

function normalizeNodesPayload(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload.filter((entry): entry is Record<string, unknown> =>
      Boolean(entry && typeof entry === "object"),
    );
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const nodes = (payload as { nodes?: unknown }).nodes;
  return Array.isArray(nodes)
    ? nodes.filter((entry): entry is Record<string, unknown> =>
        Boolean(entry && typeof entry === "object"),
      )
    : [];
}

function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return "";
        }
        const text = (entry as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function normalizeChatMessage(message: unknown, fallbackId: string): ChatMessage | null {
  if (!message || typeof message !== "object") {
    return null;
  }

  const entry = message as Record<string, unknown>;
  const roleValue = entry.role;
  const role =
    roleValue === "assistant" ||
    roleValue === "system" ||
    roleValue === "tool" ||
    roleValue === "user"
      ? roleValue
      : "assistant";
  const text =
    typeof entry.text === "string"
      ? entry.text
      : extractTextFromContent(entry.content) || stringify(message);

  return {
    id: typeof entry.id === "string" ? entry.id : fallbackId,
    role,
    text,
    timestamp: typeof entry.timestamp === "number" ? entry.timestamp : Date.now(),
    raw: message,
  };
}

function JsonBlock({ value, height = 320 }: { value: unknown; height?: number }) {
  return (
    <pre className="control-json-block" style={{ maxHeight: height }}>
      {stringify(value)}
    </pre>
  );
}

function SectionCard({
  title,
  extra,
  children,
}: {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card title={title} extra={extra} className="control-card">
      {children}
    </Card>
  );
}

function useGatewayQuery<T>(loader: () => Promise<T>, enabled = true): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : String(fetchError));
    } finally {
      setLoading(false);
    }
  }, [enabled, loader]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh, setData };
}

function OverviewPanel() {
  const {
    connected,
    connecting,
    hello,
    lastError,
    lastErrorCode,
    presenceEntries,
    eventLog,
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

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card className="control-card">
            <Statistic title="连接状态" value={connected ? "在线" : "离线"} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="control-card">
            <Statistic title="在线实例" value={presenceEntries.length} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="control-card">
            <Statistic title="协议版本" value={hello?.protocol ?? "—"} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="control-card">
            <Statistic title="鉴权模式" value={snapshot?.authMode ?? "未知"} />
          </Card>
        </Col>
      </Row>

      <SectionCard
        title="连接入口"
        extra={
          <Space>
            <Button onClick={() => void refreshPresence()} disabled={!connected}>
              刷新 Presence
            </Button>
            {connected ? (
              <Button danger onClick={disconnect}>
                断开
              </Button>
            ) : (
              <Button type="primary" loading={connecting} onClick={connect}>
                连接网关
              </Button>
            )}
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <div className="control-field-label">网关地址</div>
            <Input
              value={settings.gatewayUrl}
              onChange={(event) => applySettings({ gatewayUrl: event.target.value })}
              placeholder="ws://localhost:8789"
            />
          </Col>
          <Col xs={24} md={12} lg={6}>
            <div className="control-field-label">令牌</div>
            <Input
              value={settings.token}
              onChange={(event) => applySettings({ token: event.target.value })}
              placeholder="共享令牌"
            />
          </Col>
          <Col xs={24} md={12} lg={6}>
            <div className="control-field-label">密码</div>
            <Input.Password
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="可选密码"
            />
          </Col>
          <Col xs={24} md={12} lg={12}>
            <div className="control-field-label">会话 Key</div>
            <Input
              value={settings.sessionKey}
              onChange={(event) =>
                applySettings({
                  sessionKey: event.target.value || "main",
                  lastActiveSessionKey: event.target.value || "main",
                })
              }
              placeholder="main"
            />
          </Col>
          <Col xs={24} md={12} lg={12}>
            <div className="control-field-label">语言</div>
            <Select
              value={settings.locale ?? "zh-CN"}
              onChange={(value) => applySettings({ locale: value })}
              options={[
                { label: "简体中文", value: "zh-CN" },
                { label: "English", value: "en-US" },
              ]}
            />
          </Col>
        </Row>

        <Space orientation="vertical" size="middle" style={{ width: "100%", marginTop: 16 }}>
          {lastError ? <Alert type="error" showIcon message={lastError} /> : null}
          {showPairingHint ? (
            <Alert
              type="warning"
              showIcon
              message="当前连接需要设备配对"
              description="先在已登录的设备或 CLI 中批准当前浏览器的配对请求，然后回到节点页查看待审批设备。"
            />
          ) : null}
          {showAuthHint ? (
            <Alert
              type="warning"
              showIcon
              message={
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
              message="当前浏览器上下文不安全"
              description="设备身份签名只在 HTTPS、localhost 或受信安全上下文下可用。若必须使用 HTTP，需要网关允许不安全鉴权。"
            />
          ) : null}
        </Space>
      </SectionCard>

      <SectionCard
        title="网关摘要"
        extra={<Button onClick={() => void refreshPresence()}>刷新 Presence</Button>}
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label="服务端版本">
            {hello?.server?.version ?? "未知"}
          </Descriptions.Item>
          <Descriptions.Item label="连接 ID">{hello?.server?.connId ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="鉴权模式">{snapshot?.authMode ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="运行时长">
            {formatDuration(snapshot?.uptimeMs)}
          </Descriptions.Item>
          <Descriptions.Item label="心跳周期">
            {typeof snapshot?.policy?.tickIntervalMs === "number"
              ? `${snapshot.policy.tickIntervalMs} ms`
              : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="最近错误代码">{lastErrorCode ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="权限范围" span={2}>
            {stringifyList(hello?.auth?.scopes)}
          </Descriptions.Item>
          <Descriptions.Item label="支持方法" span={2}>
            {(hello?.features?.methods ?? []).slice(0, 12).join(", ") || "—"}
          </Descriptions.Item>
        </Descriptions>
      </SectionCard>

      <SectionCard title="最近事件">
        {eventLog.length === 0 ? (
          <Empty description="还没有事件" />
        ) : (
          <JsonBlock value={eventLog} height={280} />
        )}
      </SectionCard>
    </Space>
  );
}

function ChatPanel() {
  const { request, connected, subscribe } = useGateway();
  const { settings, applySettings } = useSettings();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamText, setStreamText] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [assistantName, setAssistantName] = useState("OpenClaw");
  const [latestAgentEvent, setLatestAgentEvent] = useState<unknown>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!connected) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await request<{ messages?: unknown[] }>("chat.history", {
        sessionKey: settings.sessionKey,
        limit: 200,
      });
      const normalized = (result.messages ?? [])
        .map((entry, index) => normalizeChatMessage(entry, `history-${index}`))
        .filter((entry): entry is ChatMessage => Boolean(entry));
      setMessages(normalized);
      setStreamText("");
    } catch (historyError) {
      setError(historyError instanceof Error ? historyError.message : String(historyError));
    } finally {
      setLoading(false);
    }
  }, [connected, request, settings.sessionKey]);

  const loadAssistantIdentity = useCallback(async () => {
    if (!connected) {
      return;
    }
    try {
      const result = await request<{ name?: unknown }>("agent.identity.get", {
        sessionKey: settings.sessionKey,
      });
      setAssistantName(
        typeof result.name === "string" && result.name.trim() ? result.name : "OpenClaw",
      );
    } catch {
      setAssistantName("OpenClaw");
    }
  }, [connected, request, settings.sessionKey]);

  useEffect(() => {
    void loadHistory();
    void loadAssistantIdentity();
  }, [loadAssistantIdentity, loadHistory]);

  useEffect(() => {
    return subscribe((event: GatewayEventFrame) => {
      if (event.event === "agent") {
        setLatestAgentEvent(event.payload);
        return;
      }

      if (event.event !== "chat") {
        return;
      }

      const payload = event.payload as
        | {
            sessionKey?: string;
            runId?: string;
            state?: string;
            message?: unknown;
            errorMessage?: string;
          }
        | undefined;

      if (!payload || payload.sessionKey !== settings.sessionKey) {
        return;
      }

      if (payload.state === "delta") {
        const nextMessage = normalizeChatMessage(payload.message, `delta-${Date.now()}`);
        setStreamText(nextMessage?.text ?? "");
        return;
      }

      if (payload.state === "final" || payload.state === "aborted") {
        const nextMessage = normalizeChatMessage(payload.message, `final-${Date.now()}`);
        setMessages((current) => (nextMessage ? [...current, nextMessage] : current));
        setRunId(null);
        setStreamText("");
      }

      if (payload.state === "error") {
        setRunId(null);
        setStreamText("");
        setError(payload.errorMessage ?? "聊天请求失败");
      }
    });
  }, [settings.sessionKey, subscribe]);

  const onSend = useCallback(async () => {
    const trimmed = draft.trim();
    if ((!trimmed && attachments.length === 0) || !connected || sending) {
      return;
    }

    const nextRunId = crypto.randomUUID();
    const optimisticMessage: ChatMessage = {
      id: nextRunId,
      role: "user",
      text: trimmed || "[图片消息]",
      timestamp: Date.now(),
    };
    setMessages((current) => [...current, optimisticMessage]);
    setDraft("");
    setSending(true);
    setRunId(nextRunId);
    setError(null);

    try {
      await request("chat.send", {
        sessionKey: settings.sessionKey,
        message: trimmed,
        deliver: false,
        idempotencyKey: nextRunId,
        attachments: attachments.map((attachment) => ({
          type: "image",
          mimeType: attachment.mimeType,
          content: attachment.dataUrl.split(",")[1] ?? "",
        })),
      });
      setAttachments([]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : String(sendError));
      setRunId(null);
      setStreamText("");
    } finally {
      setSending(false);
    }
  }, [attachments, connected, draft, request, sending, settings.sessionKey]);

  const onAbort = useCallback(async () => {
    if (!runId) {
      return;
    }

    await request("chat.abort", {
      sessionKey: settings.sessionKey,
      runId,
    });
    setRunId(null);
    setStreamText("");
  }, [request, runId, settings.sessionKey]);

  const onUploadFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList?.length) {
      return;
    }

    const nextAttachments = await Promise.all(
      Array.from(fileList).map(
        (file) =>
          new Promise<ChatAttachment>((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener("load", () =>
              resolve({
                id: crypto.randomUUID(),
                name: file.name,
                mimeType: file.type || "application/octet-stream",
                size: file.size,
                dataUrl: typeof reader.result === "string" ? reader.result : "",
              }),
            );
            reader.addEventListener("error", () => reject(new Error(`读取文件失败：${file.name}`)));
            reader.readAsDataURL(file);
          }),
      ),
    );

    setAttachments((current) => [...current, ...nextAttachments]);
  }, []);

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <SectionCard
        title="会话控制"
        extra={
          <Space>
            <Button onClick={() => void loadHistory()} disabled={!connected}>
              刷新历史
            </Button>
            <Button onClick={() => setDrawerOpen(true)} disabled={!latestAgentEvent}>
              查看工具事件
            </Button>
          </Space>
        }
      >
        <Space orientation="vertical" style={{ width: "100%" }}>
          <Input
            value={settings.sessionKey}
            onChange={(event) =>
              applySettings({
                sessionKey: event.target.value || "main",
                lastActiveSessionKey: event.target.value || "main",
              })
            }
            placeholder="session key"
          />
          <Text type="secondary">当前助手：{assistantName}</Text>
        </Space>
      </SectionCard>

      <SectionCard title="消息流">
        {error ? (
          <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />
        ) : null}
        {loading ? <Spin /> : null}
        <div className="chat-transcript">
          {messages.length === 0 && !loading ? <Empty description="还没有消息" /> : null}
          {messages.map((message) => (
            <div key={message.id} className={`chat-bubble is-${message.role}`}>
              <div className="chat-bubble-meta">
                <span>
                  {message.role === "user"
                    ? "你"
                    : message.role === "assistant"
                      ? assistantName
                      : message.role}
                </span>
                <span>{formatTimestamp(message.timestamp)}</span>
              </div>
              <div className="chat-bubble-text">{message.text}</div>
            </div>
          ))}
          {streamText ? (
            <div className="chat-bubble is-assistant is-streaming">
              <div className="chat-bubble-meta">
                <span>{assistantName}</span>
                <span>流式响应中</span>
              </div>
              <div className="chat-bubble-text">{streamText}</div>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="发送消息"
        extra={
          <Space>
            <Button danger onClick={() => void onAbort()} disabled={!runId}>
              中止
            </Button>
            <Button type="primary" onClick={() => void onSend()} disabled={!connected || sending}>
              {sending ? "发送中" : "发送"}
            </Button>
          </Space>
        }
      >
        <Space orientation="vertical" style={{ width: "100%" }}>
          <Input.TextArea
            rows={5}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="输入要发送给 OpenClaw 的消息"
          />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => void onUploadFiles(event.target.files)}
          />
          {attachments.length > 0 ? (
            <Space wrap>
              {attachments.map((attachment) => (
                <Tag
                  key={attachment.id}
                  closable
                  onClose={() =>
                    setAttachments((current) =>
                      current.filter((entry) => entry.id !== attachment.id),
                    )
                  }
                >
                  {attachment.name}
                </Tag>
              ))}
            </Space>
          ) : null}
        </Space>
      </SectionCard>

      <Drawer
        title="最新工具事件"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        size={640}
      >
        <JsonBlock value={latestAgentEvent} height={560} />
      </Drawer>
    </Space>
  );
}

function ChannelsPanel() {
  const { request, connected } = useGateway();
  const [probe, setProbe] = useState(false);
  const channels = useGatewayQuery(
    useCallback(
      async () =>
        await request<ChannelsStatusSnapshot>("channels.status", { probe, timeoutMs: 8000 }),
      [probe, request],
    ),
    connected,
  );
  const snapshot = channels.data;
  const channelIds = snapshot
    ? Array.from(
        new Set([
          ...(snapshot.channelOrder ?? []),
          ...Object.keys(snapshot.channelAccounts ?? {}),
          ...Object.keys(snapshot.channels ?? {}),
        ]),
      )
    : [];

  return (
    <SectionCard
      title="通道连接"
      extra={
        <Space>
          <Space size="small">
            <Text type="secondary">主动探测</Text>
            <Switch checked={probe} onChange={setProbe} />
          </Space>
          <Button onClick={() => void channels.refresh()}>刷新</Button>
        </Space>
      }
    >
      {channels.loading ? <Spin /> : null}
      {channels.error ? (
        <Alert type="error" showIcon message={channels.error} style={{ marginBottom: 16 }} />
      ) : null}
      {!snapshot ? (
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
                          <Descriptions size="small" column={2}>
                            <Descriptions.Item label="账号 ID">
                              {account.accountId}
                            </Descriptions.Item>
                            <Descriptions.Item label="最近探测">
                              {formatTimestamp(account.lastProbeAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="最近连接">
                              {formatTimestamp(account.lastConnectedAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="重连次数">
                              {account.reconnectAttempts ?? "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="最近入站">
                              {formatTimestamp(account.lastInboundAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="最近出站">
                              {formatTimestamp(account.lastOutboundAt)}
                            </Descriptions.Item>
                            {facts.map((fact) => (
                              <Descriptions.Item
                                key={`${account.accountId}-${fact.label}`}
                                label={fact.label}
                              >
                                {fact.value}
                              </Descriptions.Item>
                            ))}
                          </Descriptions>
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
  );
}

function InstancesPanel() {
  const { presenceEntries, refreshPresence } = useGateway();
  return (
    <SectionCard
      title="Presence 实例"
      extra={<Button onClick={() => void refreshPresence()}>刷新</Button>}
    >
      {presenceEntries.length === 0 ? (
        <Empty description="当前没有在线实例" />
      ) : (
        <Table
          rowKey={(record) => String(record.id ?? Math.random())}
          pagination={false}
          dataSource={presenceEntries}
          columns={[
            { title: "ID", dataIndex: "id", key: "id" },
            { title: "名称", dataIndex: "name", key: "name" },
            { title: "状态", dataIndex: "status", key: "status" },
            {
              title: "时间",
              dataIndex: "timestamp",
              key: "timestamp",
              render: (value: unknown) => formatTimestamp(value),
            },
          ]}
        />
      )}
    </SectionCard>
  );
}

function SessionsPanel() {
  const { request, connected } = useGateway();
  const { applySettings } = useSettings();
  const [activeMinutes, setActiveMinutes] = useState("0");
  const [limit, setLimit] = useState("100");
  const [includeGlobal, setIncludeGlobal] = useState(true);
  const [includeUnknown, setIncludeUnknown] = useState(true);

  const sessions = useGatewayQuery<SessionsListResult>(
    useCallback(
      async () =>
        await request<SessionsListResult>("sessions.list", {
          includeGlobal,
          includeUnknown,
          ...(Number(activeMinutes) > 0 ? { activeMinutes: Number(activeMinutes) } : {}),
          ...(Number(limit) > 0 ? { limit: Number(limit) } : {}),
        }),
      [activeMinutes, includeGlobal, includeUnknown, limit, request],
    ),
    connected,
  );

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <SectionCard
        title="筛选条件"
        extra={<Button onClick={() => void sessions.refresh()}>刷新</Button>}
      >
        <Space wrap>
          <Input
            value={activeMinutes}
            onChange={(event) => setActiveMinutes(event.target.value)}
            addonBefore="活跃分钟"
          />
          <Input
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            addonBefore="数量限制"
          />
          <Space>
            <Text>包含全局</Text>
            <Switch checked={includeGlobal} onChange={setIncludeGlobal} />
          </Space>
          <Space>
            <Text>包含未知</Text>
            <Switch checked={includeUnknown} onChange={setIncludeUnknown} />
          </Space>
        </Space>
      </SectionCard>

      <SectionCard title="会话列表">
        {sessions.error ? (
          <Alert type="error" showIcon message={sessions.error} style={{ marginBottom: 16 }} />
        ) : null}
        <Table
          rowKey="key"
          loading={sessions.loading}
          dataSource={sessions.data?.sessions ?? []}
          columns={[
            { title: "会话 Key", dataIndex: "key", key: "key", width: 280 },
            { title: "标题", dataIndex: "derivedTitle", key: "derivedTitle" },
            { title: "通道", dataIndex: "channel", key: "channel", width: 120 },
            {
              title: "更新时间",
              dataIndex: "updatedAt",
              key: "updatedAt",
              width: 180,
              render: (value: unknown) => formatTimestamp(value),
            },
            {
              title: "操作",
              key: "actions",
              width: 220,
              render: (_, row) => (
                <Space>
                  <Button
                    size="small"
                    onClick={() =>
                      applySettings({
                        sessionKey: row.key,
                        lastActiveSessionKey: row.key,
                      })
                    }
                  >
                    设为当前会话
                  </Button>
                  <Popconfirm
                    title="删除会话"
                    description={`确认删除 ${row.key} 吗？`}
                    onConfirm={async () => {
                      await request("sessions.delete", { key: row.key, deleteTranscript: true });
                      await sessions.refresh();
                    }}
                  >
                    <Button size="small" danger>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </SectionCard>
    </Space>
  );
}

function UsagePanel() {
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
          <Input
            value={range.startDate}
            onChange={(event) =>
              setRange((current) => ({ ...current, startDate: event.target.value }))
            }
            addonBefore="开始日期"
          />
          <Input
            value={range.endDate}
            onChange={(event) =>
              setRange((current) => ({ ...current, endDate: event.target.value }))
            }
            addonBefore="结束日期"
          />
        </Space>
      </SectionCard>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <SectionCard title="Sessions Usage">
            {usage.loading ? <Spin /> : <JsonBlock value={usageResult} />}
          </SectionCard>
        </Col>
        <Col xs={24} md={12}>
          <SectionCard title="Usage Cost">
            {usage.loading ? <Spin /> : <JsonBlock value={costResult} />}
          </SectionCard>
        </Col>
      </Row>
    </Space>
  );
}

function CronPanel() {
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
        {cron.loading ? <Spin /> : <JsonBlock value={status} height={220} />}
      </SectionCard>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <SectionCard title="任务列表">
            {cron.loading ? <Spin /> : <JsonBlock value={jobs} />}
          </SectionCard>
        </Col>
        <Col xs={24} lg={12}>
          <SectionCard title="运行记录">
            {cron.loading ? <Spin /> : <JsonBlock value={runs} />}
          </SectionCard>
        </Col>
      </Row>
    </Space>
  );
}

function AgentsPanel() {
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
          <Spin />
        ) : tools.data ? (
          <JsonBlock value={tools.data} />
        ) : (
          <Empty description="暂无工具目录" />
        )}
      </SectionCard>
    </Space>
  );
}

function SkillsPanel() {
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
                    <Tag>{skill.status ?? "未知状态"}</Tag>
                  </Space>
                  <Space wrap>
                    <Switch
                      checked={skill.enabled !== false}
                      onChange={async (enabled) => {
                        await request("skills.update", { skillKey, enabled });
                        await skills.refresh();
                      }}
                    />
                    <Input
                      placeholder="API Key"
                      value={editingKeys[skillKey] ?? ""}
                      onChange={(event) =>
                        setEditingKeys((current) => ({
                          ...current,
                          [skillKey]: event.target.value,
                        }))
                      }
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

function NodesPanel() {
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
                      <Button size="small" type="primary">
                        批准
                      </Button>
                    </Popconfirm>
                    <Popconfirm
                      title="拒绝设备配对"
                      description={`确认拒绝 ${row.displayName?.trim() || row.deviceId} 吗？`}
                      onConfirm={async () => await rejectDevice(row.requestId)}
                    >
                      <Button size="small">拒绝</Button>
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
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="设备 ID">{device.deviceId}</Descriptions.Item>
                <Descriptions.Item label="来源 IP">{device.remoteIp ?? "—"}</Descriptions.Item>
                <Descriptions.Item label="角色">{stringifyList(device.roles)}</Descriptions.Item>
                <Descriptions.Item label="权限范围">
                  {stringifyList(device.scopes)}
                </Descriptions.Item>
                <Descriptions.Item label="批准时间">
                  {formatTimestamp(device.approvedAtMs)}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {formatTimestamp(device.createdAtMs)}
                </Descriptions.Item>
              </Descriptions>
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
                            size="small"
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
                              <Button size="small" danger>
                                吊销
                              </Button>
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

function ConfigPanel() {
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

function DebugPanel() {
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
            {debug.loading ? <Spin /> : <JsonBlock value={debug.data} />}
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

function LogsPanel() {
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

export function DashboardPage({ tabKey }: DashboardPageProps) {
  switch (tabKey) {
    case "chat":
      return <ChatPanel />;
    case "overview":
      return <OverviewPanel />;
    case "channels":
      return <ChannelsPanel />;
    case "instances":
      return <InstancesPanel />;
    case "sessions":
      return <SessionsPanel />;
    case "usage":
      return <UsagePanel />;
    case "cron":
      return <CronPanel />;
    case "agents":
      return <AgentsPanel />;
    case "skills":
      return <SkillsPanel />;
    case "nodes":
      return <NodesPanel />;
    case "config":
      return <ConfigPanel />;
    case "debug":
      return <DebugPanel />;
    case "logs":
      return <LogsPanel />;
    default:
      return <Empty description="未知页面" />;
  }
}
