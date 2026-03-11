"use client";

import { Alert, Button, Drawer, Empty, Space, Spin, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useGateway } from "@/components/openclaw/providers/gateway-provider";
import { useSettings } from "@/components/openclaw/providers/settings-provider";
import type { ChatAttachment, ChatMessage } from "@/components/openclaw/types";
import { JsonBlock, SectionCard, formatTimestamp } from "./dashboard-utils";

const { Text } = Typography;

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
      : extractTextFromContent(entry.content) || JSON.stringify(message);

  return {
    id: typeof entry.id === "string" ? entry.id : fallbackId,
    role,
    text,
    timestamp: typeof entry.timestamp === "number" ? entry.timestamp : Date.now(),
    raw: message,
  };
}

export function ChatPanel() {
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
    return subscribe((event) => {
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
          <input
            value={settings.sessionKey}
            onChange={(event) =>
              applySettings({
                sessionKey: event.target.value || "main",
                lastActiveSessionKey: event.target.value || "main",
              })
            }
            placeholder="session key"
            className="ant-input"
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
          <textarea
            rows={5}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="输入要发送给 OpenClaw 的消息"
            className="ant-input"
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
                <span
                  key={attachment.id}
                  onClick={() =>
                    setAttachments((current) =>
                      current.filter((entry) => entry.id !== attachment.id),
                    )
                  }
                  style={{
                    padding: "4px 12px",
                    background: "#f0f0f0",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {attachment.name}
                  <span>×</span>
                </span>
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
