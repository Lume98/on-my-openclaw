"use client";

import { Button, Empty, Spin } from "antd";
import { useCallback, useState } from "react";
import { JsonBlock } from "@/components/openclaw/panels/dashboard-utils";
import { useGatewayQuery } from "@/components/openclaw/panels/use-gateway-query";
import { useGateway } from "@/components/openclaw/providers/gateway-provider";
import type {
  AgentsFilesListResult,
  AgentsListResult,
  ToolsCatalogResult,
} from "@/components/openclaw/types";

type AgentsPanelTab = "overview" | "files" | "tools" | "skills" | "channels" | "cron";

function normalizeAgentLabel(agent: { id: string; name?: string; identity?: { name?: string } }) {
  return agent.name?.trim() || agent.identity?.name?.trim() || agent.id;
}

function resolveAgentEmoji(agent: { identity?: { emoji?: string; avatar?: string } }) {
  const emoji = agent.identity?.emoji?.trim();
  if (emoji && emoji.length <= 4) {
    return emoji;
  }
  const avatar = agent.identity?.avatar?.trim();
  if (avatar && avatar.length <= 4) {
    return avatar;
  }
  return "";
}

function formatBytes(bytes?: number) {
  if (bytes == null || !Number.isFinite(bytes)) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i += 1;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[i]}`;
}

function formatRelative(ms?: number) {
  if (ms == null || !Number.isFinite(ms)) {
    return "—";
  }
  const d = Date.now() - ms;
  if (d < 60_000) {
    return "刚刚";
  }
  if (d < 3600_000) {
    return `${Math.floor(d / 60_000)} 分钟前`;
  }
  if (d < 86400_000) {
    return `${Math.floor(d / 3600_000)} 小时前`;
  }
  return `${Math.floor(d / 86400_000)} 天前`;
}

export function AgentsPanel() {
  const { request, connected } = useGateway();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AgentsPanelTab>("overview");
  const [activeFileName, setActiveFileName] = useState<string | null>(null);

  const agents = useGatewayQuery<AgentsListResult>(
    useCallback(async () => await request<AgentsListResult>("agents.list", {}), [request]),
    connected,
  );

  const activeAgentId =
    selectedAgentId ?? agents.data?.defaultId ?? agents.data?.agents?.[0]?.id ?? null;
  const selectedAgent = activeAgentId
    ? ((agents.data?.agents ?? []).find((a) => a.id === activeAgentId) ?? null)
    : null;

  const files = useGatewayQuery<AgentsFilesListResult | null>(
    useCallback(
      async () =>
        activeAgentId
          ? await request<AgentsFilesListResult | null>("agents.files.list", {
              agentId: activeAgentId,
            })
          : null,
      [request, activeAgentId],
    ),
    connected && Boolean(activeAgentId),
  );

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

  const agentFiles = files.data?.agentId === activeAgentId ? (files.data.files ?? []) : [];
  const defaultId = agents.data?.defaultId ?? null;

  const tabs: Array<{ key: AgentsPanelTab; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "files", label: "Files" },
    { key: "tools", label: "Tools" },
    { key: "skills", label: "Skills" },
    { key: "channels", label: "Channels" },
    { key: "cron", label: "Cron Jobs" },
  ];

  return (
    <div className="agents-page-wrap">
      <div className="agents-layout">
        {/* 左侧：代理列表 */}
        <aside className="agents-sidebar">
          <div className="agents-sidebar-header">
            <div>
              <h2 className="agents-sidebar-title">Agents</h2>
              <p className="agents-sidebar-sub">{agents.data?.agents?.length ?? 0} configured.</p>
            </div>
            <Button size="small" onClick={() => void agents.refresh()} loading={agents.loading}>
              Refresh
            </Button>
          </div>
          {agents.error && (
            <div style={{ fontSize: 13, color: "var(--ant-color-error)" }}>{agents.error}</div>
          )}
          <div className="agents-list">
            {(agents.data?.agents ?? []).length === 0 && !agents.loading ? (
              <p style={{ fontSize: 13, color: "rgba(15,23,42,0.55)", margin: 0 }}>
                No agents found.
              </p>
            ) : (
              (agents.data?.agents ?? []).map((agent) => {
                const label = normalizeAgentLabel(agent);
                const emoji = resolveAgentEmoji(agent);
                const isDefault = defaultId === agent.id;
                const isActive = activeAgentId === agent.id;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    className={`agent-row ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      setActiveFileName(null);
                    }}
                  >
                    <div className="agent-avatar">{emoji || label.slice(0, 1).toUpperCase()}</div>
                    <div className="agent-info">
                      <span className="agent-title">{label}</span>
                      <span className="agent-sub">{agent.description ?? agent.id}</span>
                    </div>
                    {isDefault && <span className="agent-pill">DEFAULT</span>}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* 右侧：详情 */}
        <main className="agents-main">
          {!selectedAgent ? (
            <div className="agent-panel-card">
              <h3 className="agent-panel-title">选择代理</h3>
              <p className="agent-panel-sub">在左侧选择一个代理以查看其工作区、文件和工具。</p>
            </div>
          ) : (
            <>
              {/* 代理头部 */}
              <div className="agent-header-card">
                <div className="agent-header-main">
                  <div className="agent-header-avatar">
                    {resolveAgentEmoji(selectedAgent) ||
                      normalizeAgentLabel(selectedAgent).slice(0, 1).toUpperCase()}
                  </div>
                  <div className="agent-header-meta">
                    <span className="agent-header-title">{normalizeAgentLabel(selectedAgent)}</span>
                    <span className="agent-header-sub">
                      {selectedAgent.identity?.theme?.trim() || "Agent workspace and routing."}
                    </span>
                  </div>
                </div>
                <div className="agent-header-right">
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                      color: "rgba(15,23,42,0.6)",
                    }}
                  >
                    {selectedAgent.id}
                  </span>
                  {defaultId === selectedAgent.id && <span className="agent-pill">DEFAULT</span>}
                </div>
              </div>

              {/* 标签页 */}
              <div className="agent-tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`agent-tab ${activeTab === tab.key ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 内容区 */}
              {activeTab === "overview" && (
                <div className="agent-panel-card">
                  <h3 className="agent-panel-title">Overview</h3>
                  <p className="agent-panel-sub">工作区路径与身份信息。</p>
                  {files.data?.agentId === activeAgentId && (
                    <div className="agents-overview-grid" style={{ marginTop: 16 }}>
                      <div className="agent-kv">
                        <span className="agent-kv-label">Workspace</span>
                        <span className="agent-kv-value">{files.data.workspace}</span>
                      </div>
                      <div className="agent-kv">
                        <span className="agent-kv-label">Agent ID</span>
                        <span className="agent-kv-value">{selectedAgent.id}</span>
                      </div>
                      <div className="agent-kv">
                        <span className="agent-kv-label">Default</span>
                        <span className="agent-kv-value">
                          {defaultId === selectedAgent.id ? "yes" : "no"}
                        </span>
                      </div>
                    </div>
                  )}
                  {files.data?.agentId !== activeAgentId && !files.loading && (
                    <p style={{ margin: 0, fontSize: 13, color: "rgba(15,23,42,0.55)" }}>
                      刷新或切换到 Files 可加载工作区路径。
                    </p>
                  )}
                </div>
              )}

              {activeTab === "files" && (
                <div className="agent-panel-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div>
                      <h3 className="agent-panel-title">Core Files</h3>
                      <p className="agent-panel-sub">
                        Bootstrap persona, identity, and tool guidance.
                      </p>
                    </div>
                    <Button
                      size="small"
                      loading={files.loading}
                      onClick={() => void files.refresh()}
                    >
                      Refresh
                    </Button>
                  </div>
                  {files.data?.agentId === activeAgentId && (
                    <p
                      style={{
                        margin: "0 0 12px",
                        fontSize: 12,
                        color: "rgba(15,23,42,0.55)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      Workspace: {files.data.workspace}
                    </p>
                  )}
                  {files.error && (
                    <p style={{ fontSize: 13, color: "var(--ant-color-error)" }}>{files.error}</p>
                  )}
                  {!files.data && !files.loading && activeAgentId && (
                    <p style={{ fontSize: 13, color: "rgba(15,23,42,0.55)" }}>
                      加载代理工作区文件以编辑核心说明。
                    </p>
                  )}
                  {files.data?.agentId === activeAgentId && agentFiles.length > 0 && (
                    <div className="agent-files-grid">
                      <div className="agent-files-list">
                        {agentFiles.map((file) => (
                          <button
                            key={file.name}
                            type="button"
                            className={`agent-file-row ${activeFileName === file.name ? "active" : ""}`}
                            onClick={() => setActiveFileName(file.name)}
                          >
                            <span className="agent-file-name">{file.name}</span>
                            <span className="agent-file-meta">
                              {file.missing
                                ? "Missing"
                                : `${formatBytes(file.size)} · ${formatRelative(file.updatedAtMs)}`}
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="agent-files-editor">
                        {activeFileName ? (
                          <p className="agent-files-editor-placeholder">
                            文件编辑功能可在后续接入 agents.files.get / agents.files.set。
                          </p>
                        ) : (
                          <p className="agent-files-editor-placeholder">Select a file to edit.</p>
                        )}
                      </div>
                    </div>
                  )}
                  {files.data?.agentId === activeAgentId &&
                    agentFiles.length === 0 &&
                    !files.loading && (
                      <p style={{ marginTop: 16, fontSize: 13, color: "rgba(15,23,42,0.55)" }}>
                        No files found.
                      </p>
                    )}
                  {files.loading && <Spin size="small" />}
                </div>
              )}

              {activeTab === "tools" && (
                <div className="agent-panel-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div>
                      <h3 className="agent-panel-title">工具目录</h3>
                      <p className="agent-panel-sub">当前代理可用的工具列表。</p>
                    </div>
                    <Button
                      size="small"
                      loading={tools.loading}
                      onClick={() => void tools.refresh()}
                    >
                      刷新
                    </Button>
                  </div>
                  {tools.loading && <Spin size="small" />}
                  {tools.error && (
                    <p style={{ fontSize: 13, color: "var(--ant-color-error)" }}>{tools.error}</p>
                  )}
                  {tools.data && !tools.loading && (
                    <div style={{ marginTop: 16 }}>
                      <JsonBlock value={tools.data} height={360} />
                    </div>
                  )}
                  {!tools.data && !tools.loading && <Empty description="暂无工具目录" />}
                </div>
              )}

              {activeTab === "skills" && (
                <div className="agent-panel-card">
                  <h3 className="agent-panel-title">Skills</h3>
                  <p className="agent-panel-sub">技能状态与启停（占位，后续接入 API）。</p>
                </div>
              )}

              {activeTab === "channels" && (
                <div className="agent-panel-card">
                  <h3 className="agent-panel-title">Channels</h3>
                  <p className="agent-panel-sub">通道状态（占位，后续接入 API）。</p>
                </div>
              )}

              {activeTab === "cron" && (
                <div className="agent-panel-card">
                  <h3 className="agent-panel-title">Cron Jobs</h3>
                  <p className="agent-panel-sub">定时任务（占位，后续接入 API）。</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
