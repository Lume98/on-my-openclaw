"use client";

import { Alert, Button, Empty, Input, Spin, Switch, Table, Tag, Typography } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  resolveAgentConfig,
  resolveModelLabel,
} from "@/components/openclaw/panels/agents-config-utils";
import { JsonBlock } from "@/components/openclaw/panels/dashboard-utils";
import { useGatewayQuery } from "@/components/openclaw/panels/use-gateway-query";
import { useGateway } from "@/components/openclaw/providers/gateway-provider";
import type {
  AgentsFilesListResult,
  AgentsListResult,
  ChannelsStatusSnapshot,
  ConfigSnapshot,
  CronJob,
  CronStatus,
  SkillStatusReport,
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

function formatNextRun(ms?: number | null) {
  if (ms == null || !Number.isFinite(ms)) {
    return "—";
  }
  const d = new Date(ms);
  return d.toLocaleString("zh-CN");
}

export function AgentsPanel() {
  const { request, connected } = useGateway();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AgentsPanelTab>("overview");
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [fileDrafts, setFileDrafts] = useState<Record<string, string>>({});
  const [fileLoading, setFileLoading] = useState(false);
  const [fileSaving, setFileSaving] = useState(false);
  const [fileLoadError, setFileLoadError] = useState<string | null>(null);

  // 切换代理时清空文件缓存，避免串数据（用 selectedAgentId，因其在 activeAgentId 之前已定义）
  useEffect(() => {
    setFileContents({});
    setFileDrafts({});
    setActiveFileName(null);
    setFileLoadError(null);
  }, [selectedAgentId]);

  const agents = useGatewayQuery<AgentsListResult>(
    useCallback(async () => await request<AgentsListResult>("agents.list", {}), [request]),
    connected,
  );

  const activeAgentId =
    selectedAgentId ?? agents.data?.defaultId ?? agents.data?.agents?.[0]?.id ?? null;
  const selectedAgent = activeAgentId
    ? ((agents.data?.agents ?? []).find((a) => a.id === activeAgentId) ?? null)
    : null;

  const config = useGatewayQuery<ConfigSnapshot>(
    useCallback(async () => await request<ConfigSnapshot>("config.get", {}), [request]),
    connected && Boolean(activeAgentId),
  );

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

  const skills = useGatewayQuery<SkillStatusReport>(
    useCallback(
      async () =>
        await request<SkillStatusReport>("skills.status", {
          agentId: activeAgentId ?? undefined,
        }),
      [activeAgentId, request],
    ),
    connected && Boolean(activeAgentId),
  );

  const channels = useGatewayQuery<ChannelsStatusSnapshot>(
    useCallback(
      async () =>
        await request<ChannelsStatusSnapshot>("channels.status", {
          probe: false,
          timeoutMs: 5000,
        }),
      [request],
    ),
    connected && activeTab === "channels",
  );

  const cron = useGatewayQuery<[CronStatus | null, { jobs?: CronJob[] }]>(
    useCallback(async () => {
      const [status, list] = await Promise.all([
        request<CronStatus>("cron.status", {}),
        request<{ jobs?: CronJob[] }>("cron.list", {
          includeDisabled: true,
          limit: 100,
          offset: 0,
          enabled: "all",
          sortBy: "nextRunAtMs",
          sortDir: "asc",
        }),
      ]);
      return [status, list];
    }, [request]),
    connected && activeTab === "cron",
  );

  const agentFiles = files.data?.agentId === activeAgentId ? (files.data.files ?? []) : [];
  const defaultId = agents.data?.defaultId ?? null;
  const configSnapshot = config.data;
  const {
    entry: agentConfigEntry,
    defaults: configDefaults,
    globalTools: configGlobalTools,
  } = resolveAgentConfig(configSnapshot, activeAgentId ?? "");
  const workspaceFromFiles = files.data?.agentId === activeAgentId ? files.data.workspace : null;
  const workspace =
    workspaceFromFiles ??
    agentConfigEntry?.workspace ??
    (configDefaults as { workspace?: string } | undefined)?.workspace ??
    "—";
  const primaryModel = resolveModelLabel(agentConfigEntry?.model ?? configDefaults?.model);
  const identityName =
    (selectedAgent?.name?.trim() ||
      selectedAgent?.identity?.name?.trim() ||
      agentConfigEntry?.name) ??
    selectedAgent?.id ??
    "—";
  const identityEmoji = resolveAgentEmoji(selectedAgent ?? {}) || "—";
  const skillsFilter = Array.isArray(agentConfigEntry?.skills)
    ? `${agentConfigEntry.skills.length} selected`
    : "all skills";

  // 选中文件时加载内容
  useEffect(() => {
    if (!activeAgentId || !activeFileName || !connected) {
      return;
    }
    if (Object.hasOwn(fileContents, activeFileName)) {
      return;
    }
    setFileLoadError(null);
    setFileLoading(true);
    request<{ file?: { content?: string } }>("agents.files.get", {
      agentId: activeAgentId,
      name: activeFileName,
    })
      .then((res) => {
        const content = res?.file?.content ?? "";
        setFileContents((prev) => ({ ...prev, [activeFileName]: content }));
        setFileDrafts((prev) => ({ ...prev, [activeFileName]: content }));
      })
      .catch((err) => setFileLoadError(String(err)))
      .finally(() => setFileLoading(false));
  }, [activeAgentId, activeFileName, connected, request, fileContents]);

  const activeContent = activeFileName ? (fileContents[activeFileName] ?? "") : "";
  const activeDraft = activeFileName ? (fileDrafts[activeFileName] ?? activeContent) : "";
  const isDirty = activeFileName ? activeDraft !== activeContent : false;

  const handleFileDraftChange = useCallback(
    (value: string) => {
      if (!activeFileName) {
        return;
      }
      setFileDrafts((prev) => ({ ...prev, [activeFileName]: value }));
    },
    [activeFileName],
  );

  const handleFileReset = useCallback(() => {
    if (!activeFileName) {
      return;
    }
    setFileDrafts((prev) => ({ ...prev, [activeFileName]: activeContent }));
  }, [activeFileName, activeContent]);

  const handleFileSave = useCallback(async () => {
    if (!activeAgentId || !activeFileName || !connected || fileSaving) {
      return;
    }
    setFileSaving(true);
    setFileLoadError(null);
    try {
      await request("agents.files.set", {
        agentId: activeAgentId,
        name: activeFileName,
        content: activeDraft,
      });
      setFileContents((prev) => ({ ...prev, [activeFileName]: activeDraft }));
      setFileDrafts((prev) => ({ ...prev, [activeFileName]: activeDraft }));
    } catch (err) {
      setFileLoadError(String(err));
    } finally {
      setFileSaving(false);
    }
  }, [activeAgentId, activeFileName, activeDraft, connected, request, fileSaving]);

  const cronStatus = cron.data?.[0] ?? null;
  const cronJobsRaw = cron.data?.[1]?.jobs ?? [];
  const cronJobsForAgent = activeAgentId
    ? cronJobsRaw.filter((j) => (j.agentId ?? null) === activeAgentId)
    : [];

  const tabs: Array<{ key: AgentsPanelTab; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "files", label: "Files" },
    { key: "tools", label: "Tools" },
    { key: "skills", label: "Skills" },
    { key: "channels", label: "Channels" },
    { key: "cron", label: "Cron Jobs" },
  ];

  const channelIds = channels.data
    ? Array.from(
        new Set([
          ...(channels.data.channelOrder ?? []),
          ...Object.keys(channels.data.channelAccounts ?? {}),
        ]),
      )
    : [];

  return (
    <div className="agents-page-wrap">
      <div className="agents-layout">
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

        <main className="agents-main">
          {!selectedAgent ? (
            <div className="agent-panel-card">
              <h3 className="agent-panel-title">选择代理</h3>
              <p className="agent-panel-sub">在左侧选择一个代理以查看其工作区、文件和工具。</p>
            </div>
          ) : (
            <>
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

              {activeTab === "overview" && (
                <div className="agent-panel-card">
                  <h3 className="agent-panel-title">Overview</h3>
                  <p className="agent-panel-sub">工作区路径与身份信息。</p>
                  <div className="agents-overview-grid" style={{ marginTop: 16 }}>
                    <div className="agent-kv">
                      <span className="agent-kv-label">Workspace</span>
                      <span className="agent-kv-value">{workspace}</span>
                    </div>
                    <div className="agent-kv">
                      <span className="agent-kv-label">Primary Model</span>
                      <span className="agent-kv-value">{primaryModel}</span>
                    </div>
                    <div className="agent-kv">
                      <span className="agent-kv-label">Identity Name</span>
                      <span className="agent-kv-value">{identityName}</span>
                    </div>
                    <div className="agent-kv">
                      <span className="agent-kv-label">Default</span>
                      <span className="agent-kv-value">
                        {defaultId === selectedAgent.id ? "yes" : "no"}
                      </span>
                    </div>
                    <div className="agent-kv">
                      <span className="agent-kv-label">Identity Emoji</span>
                      <span className="agent-kv-value">{identityEmoji}</span>
                    </div>
                    <div className="agent-kv">
                      <span className="agent-kv-label">Skills Filter</span>
                      <span className="agent-kv-value">{skillsFilter}</span>
                    </div>
                  </div>
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
                    <Alert type="error" message={files.error} style={{ marginBottom: 12 }} />
                  )}
                  {!files.data && !files.loading && activeAgentId && (
                    <p style={{ fontSize: 13, color: "rgba(15,23,42,0.55)" }}>
                      点击 Refresh 加载代理工作区文件列表。
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
                      <div
                        className="agent-files-editor"
                        style={{ minHeight: 280, display: "block" }}
                      >
                        {!activeFileName ? (
                          <p className="agent-files-editor-placeholder">Select a file to edit.</p>
                        ) : fileLoading ? (
                          <Spin />
                        ) : (
                          <>
                            {fileLoadError && (
                              <Alert
                                type="error"
                                message={fileLoadError}
                                style={{ marginBottom: 12 }}
                              />
                            )}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 8,
                                marginBottom: 12,
                              }}
                            >
                              <Typography.Text strong code>
                                {activeFileName}
                              </Typography.Text>
                              <span style={{ display: "flex", gap: 8 }}>
                                <Button size="small" disabled={!isDirty} onClick={handleFileReset}>
                                  Reset
                                </Button>
                                <Button
                                  type="primary"
                                  size="small"
                                  loading={fileSaving}
                                  disabled={!isDirty}
                                  onClick={() => void handleFileSave()}
                                >
                                  {fileSaving ? "Saving…" : "Save"}
                                </Button>
                              </span>
                            </div>
                            <Input.TextArea
                              value={activeDraft}
                              onChange={(e) => handleFileDraftChange(e.target.value)}
                              rows={14}
                              style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
                            />
                          </>
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
                      <h3 className="agent-panel-title">Tool Access</h3>
                      <p className="agent-panel-sub">
                        Profile + per-tool overrides for this agent. 在「配置」页可修改 tools
                        profile。
                      </p>
                    </div>
                    <Button
                      size="small"
                      loading={tools.loading}
                      onClick={() => void tools.refresh()}
                    >
                      刷新
                    </Button>
                  </div>
                  {tools.error && (
                    <Alert type="warning" message={tools.error} style={{ marginBottom: 12 }} />
                  )}
                  {(configSnapshot || tools.data) && (
                    <div
                      className="agents-overview-grid"
                      style={{ marginTop: 12, marginBottom: 16 }}
                    >
                      <div className="agent-kv">
                        <span className="agent-kv-label">Profile</span>
                        <span className="agent-kv-value">
                          {agentConfigEntry?.tools?.profile ?? configGlobalTools?.profile ?? "—"}
                        </span>
                      </div>
                      <div className="agent-kv">
                        <span className="agent-kv-label">Source</span>
                        <span className="agent-kv-value">
                          {agentConfigEntry?.tools?.profile
                            ? "agent override"
                            : configGlobalTools?.profile
                              ? "global default"
                              : "default"}
                        </span>
                      </div>
                    </div>
                  )}
                  {tools.data?.groups && tools.data.groups.length > 0 ? (
                    <div style={{ marginTop: 16 }}>
                      {tools.data.groups.map((group) => (
                        <div key={group.id} style={{ marginBottom: 20 }}>
                          <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
                            {group.label}
                          </Typography.Text>
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {(group.tools ?? []).map((tool) => (
                              <li key={tool.id}>
                                <code>{tool.label ?? tool.id}</code>
                                {tool.description && (
                                  <span style={{ color: "rgba(15,23,42,0.55)", marginLeft: 8 }}>
                                    {tool.description}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : tools.data && !tools.loading ? (
                    <div style={{ marginTop: 16 }}>
                      <JsonBlock value={tools.data} height={360} />
                    </div>
                  ) : null}
                  {!tools.data && !tools.loading && <Empty description="暂无工具目录" />}
                </div>
              )}

              {activeTab === "skills" && (
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
                      <h3 className="agent-panel-title">Skills</h3>
                      <p className="agent-panel-sub">当前代理工作区技能状态。</p>
                    </div>
                    <Button
                      size="small"
                      loading={skills.loading}
                      onClick={() => void skills.refresh()}
                    >
                      刷新
                    </Button>
                  </div>
                  {skills.error && (
                    <Alert type="error" message={skills.error} style={{ marginBottom: 12 }} />
                  )}
                  {skills.data?.skills?.length ? (
                    <Table
                      size="small"
                      rowKey={(r) => r.id ?? r.name}
                      dataSource={skills.data.skills}
                      columns={[
                        {
                          title: "名称",
                          dataIndex: "name",
                          key: "name",
                          render: (name: string) => (
                            <Typography.Text strong>{name}</Typography.Text>
                          ),
                        },
                        {
                          title: "状态",
                          dataIndex: "status",
                          key: "status",
                          render: (s: string) => (s ? <Tag>{s}</Tag> : "—"),
                        },
                        {
                          title: "启用",
                          dataIndex: "enabled",
                          key: "enabled",
                          render: (enabled: boolean, record: { name: string }) => (
                            <Switch
                              checked={enabled}
                              onChange={async (checked) => {
                                await request("skills.update", {
                                  skillKey: record.name,
                                  enabled: checked,
                                });
                                await skills.refresh();
                              }}
                            />
                          ),
                        },
                      ]}
                      pagination={false}
                    />
                  ) : (
                    !skills.loading && <Empty description="暂无技能或未加载" />
                  )}
                </div>
              )}

              {activeTab === "channels" && (
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
                      <h3 className="agent-panel-title">Channels</h3>
                      <p className="agent-panel-sub">网关通道状态快照。</p>
                    </div>
                    <Button
                      size="small"
                      loading={channels.loading}
                      onClick={() => void channels.refresh()}
                    >
                      刷新
                    </Button>
                  </div>
                  {channels.error && (
                    <Alert type="error" message={channels.error} style={{ marginBottom: 12 }} />
                  )}
                  {channels.data && channelIds.length > 0 ? (
                    <Table
                      size="small"
                      rowKey="id"
                      dataSource={channelIds.map((id) => {
                        const meta = channels.data?.channelMeta?.find((m) => m.id === id);
                        const label = meta?.label ?? channels.data?.channelLabels?.[id] ?? id;
                        const accounts = channels.data?.channelAccounts?.[id] ?? [];
                        const connected = accounts.filter(
                          (a) => a.connected === true || a.running === true,
                        ).length;
                        return {
                          id,
                          label,
                          total: accounts.length,
                          connected,
                        };
                      })}
                      columns={[
                        { title: "通道", dataIndex: "label", key: "label" },
                        {
                          title: "账户",
                          key: "accounts",
                          render: (_: unknown, r: { total: number; connected: number }) =>
                            `${r.connected}/${r.total} connected`,
                        },
                      ]}
                      pagination={false}
                    />
                  ) : (
                    !channels.loading && <Empty description="暂无通道或未加载" />
                  )}
                </div>
              )}

              {activeTab === "cron" && (
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
                      <h3 className="agent-panel-title">Cron Jobs</h3>
                      <p className="agent-panel-sub">针对当前代理的定时任务。</p>
                    </div>
                    <Button size="small" loading={cron.loading} onClick={() => void cron.refresh()}>
                      刷新
                    </Button>
                  </div>
                  {cronStatus && (
                    <div
                      className="agents-overview-grid"
                      style={{ marginTop: 12, marginBottom: 16 }}
                    >
                      <div className="agent-kv">
                        <span className="agent-kv-label">Enabled</span>
                        <span className="agent-kv-value">{cronStatus.enabled ? "Yes" : "No"}</span>
                      </div>
                      <div className="agent-kv">
                        <span className="agent-kv-label">Jobs</span>
                        <span className="agent-kv-value">{cronStatus.jobs ?? "—"}</span>
                      </div>
                      <div className="agent-kv">
                        <span className="agent-kv-label">Next wake</span>
                        <span className="agent-kv-value">
                          {formatNextRun(cronStatus.nextWakeAtMs)}
                        </span>
                      </div>
                    </div>
                  )}
                  <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
                    本代理任务
                  </Typography.Text>
                  {cronJobsForAgent.length > 0 ? (
                    <Table
                      size="small"
                      rowKey="id"
                      dataSource={cronJobsForAgent}
                      columns={[
                        { title: "名称", dataIndex: "name", key: "name" },
                        {
                          title: "状态",
                          key: "enabled",
                          render: (_: unknown, j: CronJob) =>
                            j.enabled !== false ? (
                              <Tag color="green">enabled</Tag>
                            ) : (
                              <Tag color="default">disabled</Tag>
                            ),
                        },
                        {
                          title: "下次运行",
                          key: "nextRun",
                          render: (_: unknown, j: CronJob) =>
                            formatNextRun(j.state?.nextRunAtMs ?? null),
                        },
                      ]}
                      pagination={false}
                    />
                  ) : (
                    !cron.loading && <Empty description="暂无针对此代理的定时任务" />
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
