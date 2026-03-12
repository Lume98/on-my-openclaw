"use client";

import {
  Alert,
  Button,
  Collapse,
  Empty,
  Input,
  Select,
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  getConfiguredModelOptions,
  parseFallbackList,
  resolveAgentConfig,
  resolveEffectiveModelFallbacks,
  resolveModelLabel,
  resolveModelPrimary,
} from "@/components/openclaw/panels/agents-config-utils";
import { JsonBlock } from "@/components/openclaw/panels/dashboard-utils";
import { computeSkillMissing, groupSkills } from "@/components/openclaw/panels/skills-utils";
import {
  DEFAULT_PROFILE_OPTIONS,
  isToolAllowed,
} from "@/components/openclaw/panels/tools-policy-utils";
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
  const [configSaving, setConfigSaving] = useState(false);
  const [overviewModelPrimaryDraft, setOverviewModelPrimaryDraft] = useState<
    string | null | undefined
  >(undefined);
  const [overviewModelFallbacksDraft, setOverviewModelFallbacksDraft] = useState<
    string[] | undefined
  >(undefined);
  type ToolsDraft = { profile?: string | null; alsoAllow?: string[]; deny?: string[] };
  const [toolsDraft, setToolsDraft] = useState<ToolsDraft | null>(null);
  /** 技能允许列表草稿：null=未编辑，undefined=全部启用（无 allowlist），string[]=当前 allowlist */
  const [skillsDraft, setSkillsDraft] = useState<string[] | undefined | null>(null);
  const [skillsSearchFilter, setSkillsSearchFilter] = useState("");
  /** 技能分组折叠的 activeKey，undefined 表示使用默认（仅第一组展开） */
  const [skillsGroupsActiveKey, setSkillsGroupsActiveKey] = useState<string[] | undefined>(
    undefined,
  );

  // 切换代理时清空文件缓存与 Overview/Tools/Skills 草稿
  useEffect(() => {
    setFileContents({});
    setFileDrafts({});
    setActiveFileName(null);
    setFileLoadError(null);
    setOverviewModelPrimaryDraft(undefined);
    setOverviewModelFallbacksDraft(undefined);
    setToolsDraft(null);
    setSkillsDraft(null);
    setSkillsSearchFilter("");
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
    connected && Boolean(activeAgentId) && activeTab === "skills",
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
  const defaultPrimary = resolveModelPrimary(configDefaults?.model);
  const modelPrimaryFromEntry = resolveModelPrimary(agentConfigEntry?.model);
  const effectivePrimary =
    overviewModelPrimaryDraft !== undefined
      ? overviewModelPrimaryDraft
      : (modelPrimaryFromEntry ?? (primaryModel !== "—" ? primaryModel : null) ?? defaultPrimary);
  const modelFallbacksFromConfig = resolveEffectiveModelFallbacks(
    agentConfigEntry?.model,
    configDefaults?.model,
  );
  const fallbackTextFromConfig = modelFallbacksFromConfig
    ? modelFallbacksFromConfig.join(", ")
    : "";
  const fallbackText =
    overviewModelFallbacksDraft !== undefined
      ? overviewModelFallbacksDraft.join(", ")
      : fallbackTextFromConfig;
  const overviewConfigDirty =
    (overviewModelPrimaryDraft !== undefined &&
      overviewModelPrimaryDraft !== (modelPrimaryFromEntry ?? defaultPrimary ?? null)) ||
    (overviewModelFallbacksDraft !== undefined &&
      overviewModelFallbacksDraft.join(", ") !== fallbackTextFromConfig);
  const identityName =
    (selectedAgent?.name?.trim() ||
      selectedAgent?.identity?.name?.trim() ||
      agentConfigEntry?.name) ??
    selectedAgent?.id ??
    "—";
  const identityEmoji = resolveAgentEmoji(selectedAgent ?? {}) || "—";
  const skillsFilter = Array.isArray(agentConfigEntry?.skills)
    ? `已选 ${agentConfigEntry.skills.length} 项`
    : "全部技能";

  const toolCatalogGroups = tools.data?.groups ?? [];
  const effectiveToolsProfile =
    toolsDraft?.profile ??
    agentConfigEntry?.tools?.profile ??
    (configGlobalTools as { profile?: string } | undefined)?.profile ??
    "full";
  const effectiveToolsAlsoAllow = toolsDraft?.alsoAllow ?? agentConfigEntry?.tools?.alsoAllow ?? [];
  const effectiveToolsDeny = toolsDraft?.deny ?? agentConfigEntry?.tools?.deny ?? [];
  const hasAgentAllow = Boolean(
    Array.isArray(agentConfigEntry?.tools?.allow) && agentConfigEntry.tools.allow.length > 0,
  );
  const allToolIds = toolCatalogGroups.flatMap((g) => (g.tools ?? []).map((t) => t.id));
  const enabledToolCount = toolCatalogGroups.reduce((acc, g) => {
    for (const t of g.tools ?? []) {
      const { allowed } = isToolAllowed({
        toolId: t.id,
        profile: effectiveToolsProfile,
        defaultProfiles: t.defaultProfiles,
        alsoAllow: effectiveToolsAlsoAllow,
        deny: effectiveToolsDeny,
      });
      if (allowed) {
        acc += 1;
      }
    }
    return acc;
  }, 0);
  const totalToolCount = allToolIds.length;
  const toolsDirty = toolsDraft !== null;
  const profileOptionsFromApi = tools.data?.profiles?.length
    ? tools.data.profiles
    : DEFAULT_PROFILE_OPTIONS.filter((p) => p.id !== "inherit");

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

  const handleConfigReload = useCallback(() => {
    void config.refresh();
  }, [config]);

  const handleOverviewModelSave = useCallback(async () => {
    if (!activeAgentId || !configSnapshot?.hash || !connected || configSaving) {
      return;
    }
    const primary =
      overviewModelPrimaryDraft !== undefined ? overviewModelPrimaryDraft : effectivePrimary;
    const fallbacks =
      overviewModelFallbacksDraft !== undefined
        ? overviewModelFallbacksDraft
        : (modelFallbacksFromConfig ?? []);
    setConfigSaving(true);
    try {
      await request("config.patch", {
        baseHash: configSnapshot.hash,
        raw: JSON.stringify({
          agents: {
            list: [{ id: activeAgentId, model: { primary: primary || null, fallbacks } }],
          },
        }),
      });
      await config.refresh();
      setOverviewModelPrimaryDraft(undefined);
      setOverviewModelFallbacksDraft(undefined);
    } finally {
      setConfigSaving(false);
    }
  }, [
    activeAgentId,
    configSnapshot?.hash,
    connected,
    configSaving,
    request,
    config,
    overviewModelPrimaryDraft,
    overviewModelFallbacksDraft,
    effectivePrimary,
    modelFallbacksFromConfig,
  ]);

  const handleToolsPreset = useCallback(
    (profileId: string) => {
      if (profileId === "inherit") {
        const globalProfile =
          (configGlobalTools as { profile?: string } | undefined)?.profile ?? "full";
        setToolsDraft({ profile: globalProfile, alsoAllow: [], deny: [] });
        return;
      }
      setToolsDraft({ profile: profileId, alsoAllow: [], deny: [] });
    },
    [configGlobalTools],
  );

  const handleToolsEnableAll = useCallback(() => {
    setToolsDraft((prev) => ({
      profile: prev?.profile ?? effectiveToolsProfile,
      alsoAllow: [...allToolIds],
      deny: [],
    }));
  }, [allToolIds, effectiveToolsProfile]);

  const handleToolsDisableAll = useCallback(() => {
    setToolsDraft((prev) => ({
      profile: prev?.profile ?? effectiveToolsProfile,
      alsoAllow: [],
      deny: [...allToolIds],
    }));
  }, [allToolIds, effectiveToolsProfile]);

  const handleToolToggle = useCallback(
    (toolId: string, enabled: boolean) => {
      const toolEntry = toolCatalogGroups
        .flatMap((g) => g.tools ?? [])
        .find((t) => t.id === toolId);
      const { baseAllowed } = toolEntry
        ? isToolAllowed({
            toolId: toolEntry.id,
            profile: effectiveToolsProfile,
            defaultProfiles: toolEntry.defaultProfiles,
            alsoAllow: effectiveToolsAlsoAllow,
            deny: effectiveToolsDeny,
          })
        : { baseAllowed: false };
      setToolsDraft((prev) => {
        const profile = prev?.profile ?? effectiveToolsProfile;
        let alsoAllow = prev?.alsoAllow ?? [...effectiveToolsAlsoAllow];
        let deny = prev?.deny ?? [...effectiveToolsDeny];
        if (enabled) {
          deny = deny.filter((id) => id !== toolId);
          if (!baseAllowed && !alsoAllow.includes(toolId)) {
            alsoAllow = [...alsoAllow, toolId];
          }
        } else {
          alsoAllow = alsoAllow.filter((id) => id !== toolId);
          if (!deny.includes(toolId)) {
            deny = [...deny, toolId];
          }
        }
        return { profile, alsoAllow, deny };
      });
    },
    [toolCatalogGroups, effectiveToolsProfile, effectiveToolsAlsoAllow, effectiveToolsDeny],
  );

  const handleToolsSave = useCallback(async () => {
    if (!activeAgentId || !configSnapshot?.hash || !connected || configSaving) {
      return;
    }
    const profile = toolsDraft?.profile ?? effectiveToolsProfile;
    const alsoAllow = toolsDraft?.alsoAllow ?? effectiveToolsAlsoAllow;
    const deny = toolsDraft?.deny ?? effectiveToolsDeny;
    setConfigSaving(true);
    try {
      await request("config.patch", {
        baseHash: configSnapshot.hash,
        raw: JSON.stringify({
          agents: {
            list: [{ id: activeAgentId, tools: { profile, alsoAllow, deny } }],
          },
        }),
      });
      await config.refresh();
      setToolsDraft(null);
    } finally {
      setConfigSaving(false);
    }
  }, [
    activeAgentId,
    configSnapshot?.hash,
    connected,
    configSaving,
    request,
    config,
    toolsDraft,
    effectiveToolsProfile,
    effectiveToolsAlsoAllow,
    effectiveToolsDeny,
  ]);

  const skillsAllowlist = agentConfigEntry?.skills;
  const rawSkills = skills.data?.skills ?? [];
  const allSkillNames = rawSkills.map((s) => s.name).filter(Boolean);
  const effectiveSkillsAllowlist = skillsDraft !== null ? skillsDraft : skillsAllowlist;
  const effectiveAllowSet =
    effectiveSkillsAllowlist === undefined
      ? new Set(allSkillNames)
      : new Set(
          Array.isArray(effectiveSkillsAllowlist)
            ? effectiveSkillsAllowlist.map((n) => String(n).trim()).filter(Boolean)
            : [],
        );
  const skillsEditable = Boolean(configSnapshot) && !config.loading && !configSaving;
  const skillsDirty =
    skillsDraft !== null &&
    (skillsDraft === undefined
      ? skillsAllowlist !== undefined
      : JSON.stringify([...(skillsDraft ?? [])].toSorted()) !==
        JSON.stringify([...(skillsAllowlist ?? [])].toSorted()));

  const handleSkillsUseAll = useCallback(() => {
    setSkillsDraft(undefined);
  }, []);

  const handleSkillsDisableAll = useCallback(() => {
    setSkillsDraft([]);
  }, []);

  const handleSkillToggle = useCallback(
    (skillName: string, enabled: boolean) => {
      const base =
        skillsDraft !== null
          ? skillsDraft === undefined
            ? allSkillNames
            : skillsDraft
          : (skillsAllowlist ?? allSkillNames);
      const next = new Set(base.map((n) => String(n).trim()).filter(Boolean));
      const name = skillName.trim();
      if (!name) {
        return;
      }
      if (enabled) {
        next.add(name);
      } else {
        next.delete(name);
      }
      const arr = [...next];
      setSkillsDraft(arr.length === allSkillNames.length ? undefined : arr);
    },
    [skillsDraft, skillsAllowlist, allSkillNames],
  );

  const handleSkillsSave = useCallback(async () => {
    if (!activeAgentId || !configSnapshot?.hash || !connected || configSaving) {
      return;
    }
    setConfigSaving(true);
    try {
      await request("config.patch", {
        baseHash: configSnapshot.hash,
        raw: JSON.stringify({
          agents: {
            list: [
              {
                id: activeAgentId,
                skills: skillsDraft === undefined ? null : (skillsDraft ?? []),
              },
            ],
          },
        }),
      });
      await config.refresh();
      setSkillsDraft(null);
    } finally {
      setConfigSaving(false);
    }
  }, [activeAgentId, configSnapshot?.hash, connected, configSaving, request, config, skillsDraft]);

  const cronStatus = cron.data?.[0] ?? null;
  const cronJobsRaw = cron.data?.[1]?.jobs ?? [];
  const cronJobsForAgent = activeAgentId
    ? cronJobsRaw.filter((j) => (j.agentId ?? null) === activeAgentId)
    : [];

  const tabs: Array<{ key: AgentsPanelTab; label: string }> = [
    { key: "overview", label: "概览" },
    { key: "files", label: "文件" },
    { key: "tools", label: "工具" },
    { key: "skills", label: "技能" },
    { key: "channels", label: "通道" },
    { key: "cron", label: "定时任务" },
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
              <h2 className="agents-sidebar-title">代理</h2>
              <p className="agents-sidebar-sub">
                已配置 {agents.data?.agents?.length ?? 0} 个代理。
              </p>
            </div>
            <Button size="small" onClick={() => void agents.refresh()} loading={agents.loading}>
              刷新
            </Button>
          </div>
          {agents.error && (
            <div style={{ fontSize: 13, color: "var(--ant-color-error)" }}>{agents.error}</div>
          )}
          <div className="agents-list">
            {(agents.data?.agents ?? []).length === 0 && !agents.loading ? (
              <p style={{ fontSize: 13, color: "rgba(15,23,42,0.55)", margin: 0 }}>未找到代理。</p>
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
                    {isDefault && <span className="agent-pill">默认</span>}
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
                      {selectedAgent.identity?.theme?.trim() || "代理工作区与路由。"}
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
                  {defaultId === selectedAgent.id && <span className="agent-pill">默认</span>}
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
                  <h3 className="agent-panel-title">概览</h3>
                  <p className="agent-panel-sub">工作区路径与身份信息。</p>
                  <div className="agents-overview-grid" style={{ marginTop: 16 }}>
                    <div className="agent-kv">
                      <span className="agent-kv-label">工作区</span>
                      <span className="agent-kv-value">{workspace}</span>
                    </div>
                    <div className="agent-kv">
                      <span className="agent-kv-label">主模型</span>
                      <span className="agent-kv-value">{primaryModel}</span>
                    </div>
                    <div className="agent-kv">
                      <span className="agent-kv-label">身份名称</span>
                      <span className="agent-kv-value">{identityName}</span>
                    </div>
                    <div className="agent-kv">
                      <span className="agent-kv-label">默认代理</span>
                      <span className="agent-kv-value">
                        {defaultId === selectedAgent.id ? "是" : "否"}
                      </span>
                    </div>
                    <div className="agent-kv">
                      <span className="agent-kv-label">身份 Emoji</span>
                      <span className="agent-kv-value">{identityEmoji}</span>
                    </div>
                    <div className="agent-kv">
                      <span className="agent-kv-label">技能筛选</span>
                      <span className="agent-kv-value">{skillsFilter}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
                      模型选择
                    </Typography.Text>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ minWidth: 260, flex: "1 1 260px" }}>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>
                          主模型
                          {defaultId === selectedAgent.id ? "（默认）" : ""}
                        </label>
                        <Select
                          style={{ width: "100%" }}
                          placeholder="继承默认"
                          allowClear
                          value={
                            effectivePrimary === null
                              ? "__inherit__"
                              : effectivePrimary || undefined
                          }
                          disabled={!configSnapshot || config.loading || configSaving}
                          options={[
                            ...(defaultId !== selectedAgent.id && defaultPrimary
                              ? [
                                  {
                                    value: "__inherit__",
                                    label: `继承默认（${defaultPrimary}）`,
                                  },
                                ]
                              : []),
                            ...getConfiguredModelOptions(
                              configSnapshot,
                              effectivePrimary ?? null,
                            ).map((o) => ({ value: o.value, label: o.label })),
                          ]}
                          onChange={(v) =>
                            setOverviewModelPrimaryDraft(
                              v === undefined || v === "__inherit__" ? null : v,
                            )
                          }
                        />
                      </div>
                      <div style={{ minWidth: 260, flex: "1 1 260px" }}>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>
                          备用模型（逗号分隔）
                        </label>
                        <Input
                          placeholder="provider/model, provider/model"
                          value={fallbackText}
                          disabled={!configSnapshot || config.loading || configSaving}
                          onChange={(e) =>
                            setOverviewModelFallbacksDraft(parseFallbackList(e.target.value))
                          }
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                      <Button size="small" disabled={config.loading} onClick={handleConfigReload}>
                        重载配置
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        loading={configSaving}
                        disabled={!overviewConfigDirty}
                        onClick={() => void handleOverviewModelSave()}
                      >
                        {configSaving ? "保存中…" : "保存"}
                      </Button>
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
                      <h3 className="agent-panel-title">核心文件</h3>
                      <p className="agent-panel-sub">引导人格、身份与工具说明。</p>
                    </div>
                    <Button
                      size="small"
                      loading={files.loading}
                      onClick={() => void files.refresh()}
                    >
                      刷新
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
                      工作区：{files.data.workspace}
                    </p>
                  )}
                  {files.error && (
                    <Alert type="error" title={files.error} style={{ marginBottom: 12 }} />
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
                          <p className="agent-files-editor-placeholder">选择要编辑的文件。</p>
                        ) : fileLoading ? (
                          <Spin />
                        ) : (
                          <>
                            {fileLoadError && (
                              <Alert
                                type="error"
                                title={fileLoadError}
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
                                  重置
                                </Button>
                                <Button
                                  type="primary"
                                  size="small"
                                  loading={fileSaving}
                                  disabled={!isDirty}
                                  onClick={() => void handleFileSave()}
                                >
                                  {fileSaving ? "保存中…" : "保存"}
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
                        未找到文件。
                      </p>
                    )}
                </div>
              )}

              {activeTab === "tools" && (
                <div className="agents-tools-wrap">
                  {/* 卡片 1：工具访问 + 快捷预设 */}
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
                        <h3 className="agent-panel-title">工具访问</h3>
                        <p className="agent-panel-sub">
                          Profile + 本代理每工具覆盖。
                          {totalToolCount > 0
                            ? `${enabledToolCount}/${totalToolCount} 已启用。`
                            : ""}
                        </p>
                      </div>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}
                      >
                        <Button
                          size="small"
                          disabled={hasAgentAllow || !tools.data?.groups?.length}
                          onClick={handleToolsEnableAll}
                        >
                          启用全部
                        </Button>
                        <Button
                          size="small"
                          disabled={hasAgentAllow || !tools.data?.groups?.length}
                          onClick={handleToolsDisableAll}
                        >
                          禁用全部
                        </Button>
                        <Button size="small" loading={config.loading} onClick={handleConfigReload}>
                          重载配置
                        </Button>
                        <Button
                          type="primary"
                          size="small"
                          loading={configSaving}
                          disabled={!toolsDirty || hasAgentAllow}
                          onClick={() => void handleToolsSave()}
                        >
                          {configSaving ? "保存中…" : "保存"}
                        </Button>
                      </div>
                    </div>
                    {tools.error && (
                      <Alert
                        type="warning"
                        title={tools.error}
                        style={{ marginTop: 12, marginBottom: 0 }}
                      />
                    )}
                    {hasAgentAllow && (
                      <Alert
                        type="info"
                        title="当前代理使用显式 allow 列表，此处不可编辑；请在配置中修改。"
                        style={{ marginTop: 12, marginBottom: 0 }}
                      />
                    )}
                    {(configSnapshot || tools.data) &&
                      !hasAgentAllow &&
                      (() => {
                        const globalProfile =
                          (configGlobalTools as { profile?: string } | undefined)?.profile ??
                          "full";
                        const toolsInherit =
                          effectiveToolsProfile === globalProfile &&
                          effectiveToolsAlsoAllow.length === 0 &&
                          effectiveToolsDeny.length === 0;
                        return (
                          <div className="agents-overview-grid" style={{ marginTop: 12 }}>
                            <div className="agent-kv">
                              <span className="agent-kv-label">配置集</span>
                              <span className="agent-kv-value">
                                {toolsInherit ? "继承" : effectiveToolsProfile}
                              </span>
                            </div>
                            <div className="agent-kv">
                              <span className="agent-kv-label">来源</span>
                              <span className="agent-kv-value">
                                {(agentConfigEntry?.tools?.profile ?? toolsDraft?.profile)
                                  ? "代理覆盖"
                                  : (configGlobalTools as { profile?: string } | undefined)?.profile
                                    ? "全局默认"
                                    : "默认"}
                              </span>
                            </div>
                            <div className="agent-kv">
                              <span className="agent-kv-label">状态</span>
                              <span className="agent-kv-value">
                                {toolsDirty ? "未保存" : "已保存"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    {/* 同卡内：快捷预设 */}
                    {!hasAgentAllow &&
                      (tools.data?.profiles?.length || DEFAULT_PROFILE_OPTIONS.length) > 0 && (
                        <div style={{ marginTop: 20 }}>
                          <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
                            快捷预设
                          </Typography.Text>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {profileOptionsFromApi.map((p) => (
                              <Button
                                key={p.id}
                                size="small"
                                type={effectiveToolsProfile === p.id ? "primary" : "default"}
                                onClick={() => handleToolsPreset(p.id)}
                              >
                                {p.label}
                              </Button>
                            ))}
                            <Button
                              size="small"
                              type={
                                effectiveToolsProfile ===
                                  ((configGlobalTools as { profile?: string } | undefined)
                                    ?.profile ?? "full") &&
                                effectiveToolsAlsoAllow.length === 0 &&
                                effectiveToolsDeny.length === 0
                                  ? "primary"
                                  : "default"
                              }
                              onClick={() => handleToolsPreset("inherit")}
                            >
                              继承
                            </Button>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* 每个工具分类单独一张卡片 */}
                  {tools.data?.groups &&
                    tools.data.groups.length > 0 &&
                    tools.data.groups.map((group) => (
                      <div key={group.id} className="agent-panel-card">
                        <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
                          {group.label}
                        </Typography.Text>
                        <div className="agents-tools-group-grid">
                          {(group.tools ?? []).map((tool) => {
                            const { allowed } = isToolAllowed({
                              toolId: tool.id,
                              profile: effectiveToolsProfile,
                              defaultProfiles: tool.defaultProfiles,
                              alsoAllow: effectiveToolsAlsoAllow,
                              deny: effectiveToolsDeny,
                            });
                            const sourceLabel =
                              (group as { source?: string }).source === "plugin"
                                ? "plugin"
                                : "core";
                            return (
                              <div key={tool.id} className="agents-tool-item-card">
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontSize: 13 }}>
                                    <code style={{ marginRight: 6 }}>{tool.id}</code>
                                    <Tag style={{ fontSize: 11 }}>{sourceLabel}</Tag>
                                  </div>
                                  <div
                                    style={{
                                      color: "rgba(15,23,42,0.55)",
                                      fontSize: 12,
                                      marginTop: 2,
                                    }}
                                  >
                                    {tool.description ?? tool.label ?? tool.id}
                                  </div>
                                </div>
                                <Switch
                                  size="small"
                                  checked={allowed}
                                  disabled={hasAgentAllow}
                                  onChange={(checked) => handleToolToggle(tool.id, checked)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                  {tools.data && !tools.data.groups?.length && !tools.loading && (
                    <div className="agent-panel-card">
                      <JsonBlock value={tools.data} height={280} />
                    </div>
                  )}
                  {!tools.data && !tools.loading && (
                    <div className="agent-panel-card">
                      <Empty description="暂无工具目录" />
                    </div>
                  )}
                </div>
              )}

              {activeTab === "skills" && (
                <div className="agent-panel-card">
                  <div
                    className="agent-panel-skills-header"
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
                      <p className="agent-panel-sub">
                        Per-agent skill allowlist and workspace skills.{" "}
                        {rawSkills.length > 0 ? (
                          <span className="agent-panel-mono">
                            {effectiveAllowSet.size}/{rawSkills.length}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <Button size="small" disabled={!skillsEditable} onClick={handleSkillsUseAll}>
                        启用所有
                      </Button>
                      <Button
                        size="small"
                        disabled={!skillsEditable}
                        onClick={handleSkillsDisableAll}
                      >
                        禁用所有
                      </Button>
                      <Button size="small" disabled={config.loading} onClick={handleConfigReload}>
                        重载配置
                      </Button>
                      <Button
                        size="small"
                        loading={skills.loading}
                        onClick={() => void skills.refresh()}
                      >
                        刷新
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        loading={configSaving}
                        disabled={!skillsDirty}
                        onClick={() => void handleSkillsSave()}
                      >
                        {configSaving ? "保存中…" : "保存"}
                      </Button>
                    </div>
                  </div>
                  {!configSnapshot && (
                    <Alert
                      type="info"
                      title="请先加载网关配置以设置按代理的技能允许列表。"
                      style={{ marginTop: 12 }}
                    />
                  )}
                  {configSnapshot && (
                    <Alert
                      type="info"
                      title={
                        effectiveSkillsAllowlist !== undefined
                          ? "当前代理使用自定义技能允许列表。"
                          : "所有技能均已启用。禁用任意技能将创建按代理的允许列表。"
                      }
                      style={{ marginTop: 12 }}
                    />
                  )}
                  {skills.error && (
                    <Alert type="error" title={skills.error} style={{ marginTop: 12 }} />
                  )}
                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <label className="agent-panel-filter-label">
                      <span>筛选</span>
                      <Input
                        placeholder="Search skills"
                        value={skillsSearchFilter}
                        onChange={(e) => setSkillsSearchFilter(e.target.value)}
                        allowClear
                        style={{ maxWidth: 320 }}
                      />
                    </label>
                    <span className="agent-panel-muted" style={{ fontSize: 12 }}>
                      {(() => {
                        const filter = skillsSearchFilter.trim().toLowerCase();
                        const filtered = filter
                          ? rawSkills.filter((s) =>
                              [s.name, s.description ?? "", s.source ?? ""]
                                .join(" ")
                                .toLowerCase()
                                .includes(filter),
                            )
                          : rawSkills;
                        return `${filtered.length} shown`;
                      })()}
                    </span>
                    {skills.data?.skills?.length ? (
                      <>
                        <Button
                          size="small"
                          onClick={() => {
                            setSkillsGroupsActiveKey((prev) => [
                              ...new Set([...(prev ?? []), "built-in"]),
                            ]);
                          }}
                        >
                          展示所有内置技能
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            const filter = skillsSearchFilter.trim().toLowerCase();
                            const filtered = filter
                              ? rawSkills.filter((s) =>
                                  [s.name, s.description ?? "", s.source ?? ""]
                                    .join(" ")
                                    .toLowerCase()
                                    .includes(filter),
                                )
                              : rawSkills;
                            const groups = groupSkills(filtered);
                            setSkillsGroupsActiveKey(groups.map((g) => g.id));
                          }}
                        >
                          展开所有
                        </Button>
                        <Button size="small" onClick={() => setSkillsGroupsActiveKey([])}>
                          收起所有
                        </Button>
                      </>
                    ) : null}
                  </div>
                  {skills.data?.skills?.length
                    ? (() => {
                        const filter = skillsSearchFilter.trim().toLowerCase();
                        const filtered = filter
                          ? rawSkills.filter((s) =>
                              [s.name, s.description ?? "", s.source ?? ""]
                                .join(" ")
                                .toLowerCase()
                                .includes(filter),
                            )
                          : rawSkills;
                        const groups = groupSkills(filtered);
                        const collapseItems = groups.map((group) => ({
                          key: group.id,
                          label: (
                            <span>
                              {group.label}{" "}
                              <span className="agent-panel-muted">({group.skills.length})</span>
                            </span>
                          ),
                          children: (
                            <div className="agent-skills-list">
                              {group.skills.length === 0 ? (
                                <Empty
                                  description={
                                    group.id === "built-in" ? "暂无内置技能" : "暂无技能"
                                  }
                                  style={{ padding: "16px 0" }}
                                />
                              ) : (
                                group.skills.map((skill) => {
                                  const enabled = effectiveAllowSet.has(skill.name);
                                  const missing = computeSkillMissing(skill);
                                  return (
                                    <div
                                      key={skill.skillKey ?? skill.name}
                                      className="agent-skill-row"
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        gap: 12,
                                        padding: "10px 0",
                                        borderBottom: "1px solid rgba(15,23,42,0.06)",
                                      }}
                                    >
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            marginBottom: 4,
                                          }}
                                        >
                                          {skill.emoji ? (
                                            <span style={{ fontSize: 16 }}>{skill.emoji}</span>
                                          ) : null}
                                          <Typography.Text strong>{skill.name}</Typography.Text>
                                        </div>
                                        {skill.description ? (
                                          <div
                                            className="agent-panel-muted"
                                            style={{ fontSize: 12, marginBottom: 6 }}
                                          >
                                            {skill.description}
                                          </div>
                                        ) : null}
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                          <Tag>{skill.source ?? "—"}</Tag>
                                          <Tag
                                            color={skill.eligible !== false ? "success" : "warning"}
                                          >
                                            {skill.eligible !== false ? "eligible" : "blocked"}
                                          </Tag>
                                        </div>
                                        {missing.length > 0 && (
                                          <div
                                            className="agent-panel-muted"
                                            style={{
                                              fontSize: 12,
                                              marginTop: 6,
                                              color: "var(--ant-color-error)",
                                            }}
                                          >
                                            Missing: {missing.join(", ")}
                                          </div>
                                        )}
                                      </div>
                                      <div style={{ flexShrink: 0 }}>
                                        <Switch
                                          checked={enabled}
                                          disabled={!skillsEditable}
                                          onChange={(checked) =>
                                            handleSkillToggle(skill.name, checked)
                                          }
                                        />
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          ),
                        }));
                        const defaultGroupKey = groups.length > 0 ? [groups[0].id] : [];
                        return (
                          <Collapse
                            className="agent-skills-groups"
                            style={{ marginTop: 16 }}
                            items={collapseItems}
                            activeKey={
                              skillsGroupsActiveKey !== undefined
                                ? skillsGroupsActiveKey
                                : defaultGroupKey
                            }
                            onChange={(keys) =>
                              setSkillsGroupsActiveKey(
                                Array.isArray(keys) ? keys : keys ? [keys] : [],
                              )
                            }
                            ghost
                          />
                        );
                      })()
                    : !skills.loading && (
                        <Empty
                          description={rawSkills.length === 0 ? "暂无技能或未加载" : "无匹配技能"}
                          style={{ marginTop: 24 }}
                        />
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
                      <h3 className="agent-panel-title">通道</h3>
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
                    <Alert type="error" title={channels.error} style={{ marginBottom: 12 }} />
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
                            `${r.connected}/${r.total} 已连接`,
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
                      <h3 className="agent-panel-title">定时任务</h3>
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
                        <span className="agent-kv-label">已启用</span>
                        <span className="agent-kv-value">{cronStatus.enabled ? "是" : "否"}</span>
                      </div>
                      <div className="agent-kv">
                        <span className="agent-kv-label">任务数</span>
                        <span className="agent-kv-value">{cronStatus.jobs ?? "—"}</span>
                      </div>
                      <div className="agent-kv">
                        <span className="agent-kv-label">下次唤醒</span>
                        <span className="agent-kv-value">
                          {formatNextRun(cronStatus.nextWakeAtMs)}
                        </span>
                      </div>
                    </div>
                  )}
                  <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
                    本代理定时任务
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
                              <Tag color="green">已启用</Tag>
                            ) : (
                              <Tag color="default">已禁用</Tag>
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
