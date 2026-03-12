"use client";

import { Button } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useGateway } from "@/components/providers/gateway-provider";
import type {
  AgentsFilesListResult,
  AgentsListResult,
  ChannelsStatusSnapshot,
  ConfigSnapshot,
  CronJob,
  CronStatus,
  SkillStatusReport,
  ToolsCatalogResult,
} from "@/components/types";
import {
  resolveAgentConfig,
  resolveEffectiveModelFallbacks,
  resolveModelLabel,
  resolveModelPrimary,
} from "@/components/views/agents-config-utils";
import { DEFAULT_PROFILE_OPTIONS, isToolAllowed } from "@/components/views/tools-policy-utils";
import { useGatewayQuery } from "@/components/views/use-gateway-query";
import { ChannelsTab } from "./channels-tab";
import { CronTab } from "./cron-tab";
import { FilesTab } from "./files-tab";
import { OverviewTab } from "./overview-tab";
import { SkillsTab } from "./skills-tab";
import { ToolsTab } from "./tools-tab";
import type { AgentsPanelTab, ToolsDraft } from "./types";
import { normalizeAgentLabel, resolveAgentEmoji } from "./utils";

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
  const [toolsDraft, setToolsDraft] = useState<ToolsDraft | null>(null);
  const [skillsDraft, setSkillsDraft] = useState<string[] | undefined | null>(null);
  const [skillsSearchFilter, setSkillsSearchFilter] = useState("");
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

  const _agentFiles = files.data?.agentId === activeAgentId ? (files.data.files ?? []) : [];
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
  const _isDirty = activeFileName ? activeDraft !== activeContent : false;

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

  const handleFilesRefresh = useCallback(() => {
    void files.refresh();
  }, [files]);

  const _handleChannelsRefresh = useCallback(() => {
    void channels.refresh();
  }, [channels]);

  const _handleCronRefresh = useCallback(() => {
    void cron.refresh();
  }, [cron]);

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
                <OverviewTab
                  workspace={workspace}
                  primaryModel={primaryModel}
                  identityName={identityName}
                  identityEmoji={identityEmoji}
                  skillsFilter={skillsFilter}
                  defaultId={defaultId}
                  selectedAgent={selectedAgent}
                  configSnapshot={configSnapshot}
                  configLoading={config.loading}
                  configSaving={configSaving}
                  effectivePrimary={effectivePrimary}
                  defaultPrimary={defaultPrimary}
                  fallbackText={fallbackText}
                  overviewConfigDirty={overviewConfigDirty}
                  onConfigReload={handleConfigReload}
                  onOverviewModelSave={handleOverviewModelSave}
                  onModelPrimaryChange={(v) => setOverviewModelPrimaryDraft(v)}
                  onModelFallbacksChange={(v) => setOverviewModelFallbacksDraft(v)}
                />
              )}

              {activeTab === "files" && (
                <FilesTab
                  files={files.data ?? null}
                  filesLoading={files.loading}
                  filesError={files.error ?? null}
                  activeFileName={activeFileName}
                  fileContents={fileContents}
                  fileDrafts={fileDrafts}
                  fileLoading={fileLoading}
                  fileSaving={fileSaving}
                  fileLoadError={fileLoadError}
                  workspace={workspace}
                  agentId={activeAgentId}
                  onRefresh={handleFilesRefresh}
                  onFileSelect={setActiveFileName}
                  onFileDraftChange={handleFileDraftChange}
                  onFileReset={handleFileReset}
                  onFileSave={handleFileSave}
                />
              )}

              {activeTab === "tools" && (
                <ToolsTab
                  tools={tools.data ?? null}
                  toolsError={tools.error ?? null}
                  toolsLoading={tools.loading}
                  configSnapshot={configSnapshot}
                  configGlobalTools={configGlobalTools}
                  agentConfigEntry={agentConfigEntry}
                  effectiveToolsProfile={effectiveToolsProfile}
                  effectiveToolsAlsoAllow={effectiveToolsAlsoAllow}
                  effectiveToolsDeny={effectiveToolsDeny}
                  hasAgentAllow={hasAgentAllow}
                  toolsDirty={toolsDirty}
                  configSaving={configSaving}
                  enabledToolCount={enabledToolCount}
                  totalToolCount={totalToolCount}
                  profileOptionsFromApi={profileOptionsFromApi}
                  onConfigReload={handleConfigReload}
                  onToolsPreset={handleToolsPreset}
                  onToolsEnableAll={handleToolsEnableAll}
                  onToolsDisableAll={handleToolsDisableAll}
                  onToolToggle={handleToolToggle}
                  onToolsSave={handleToolsSave}
                />
              )}

              {activeTab === "skills" && (
                <SkillsTab
                  skills={skills.data ?? null}
                  skillsError={skills.error ?? null}
                  skillsLoading={skills.loading}
                  configSnapshot={configSnapshot}
                  configLoading={config.loading}
                  configSaving={configSaving}
                  agentConfigEntry={agentConfigEntry}
                  skillsAllowlist={skillsAllowlist}
                  effectiveSkillsAllowlist={effectiveSkillsAllowlist}
                  effectiveAllowSet={effectiveAllowSet}
                  skillsEditable={skillsEditable}
                  skillsDirty={skillsDirty}
                  skillsSearchFilter={skillsSearchFilter}
                  skillsGroupsActiveKey={skillsGroupsActiveKey}
                  onSkillsSearchFilterChange={setSkillsSearchFilter}
                  onSkillsGroupsActiveKeyChange={setSkillsGroupsActiveKey}
                  onSkillsUseAll={handleSkillsUseAll}
                  onSkillsDisableAll={handleSkillsDisableAll}
                  onSkillToggle={handleSkillToggle}
                  onSkillsSave={handleSkillsSave}
                />
              )}

              {activeTab === "channels" && (
                <ChannelsTab
                  channels={channels.data ?? null}
                  channelsError={channels.error ?? null}
                  channelsLoading={channels.loading}
                  channelIds={channelIds}
                />
              )}

              {activeTab === "cron" && (
                <CronTab
                  cronStatus={cronStatus}
                  cronJobsForAgent={cronJobsForAgent}
                  cronError={cron.error ?? null}
                  cronLoading={cron.loading}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
