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

export type AgentsPanelTab = "overview" | "files" | "tools" | "skills" | "channels" | "cron";

export type ToolsDraft = { profile?: string | null; alsoAllow?: string[]; deny?: string[] };

export interface AgentsPanelData {
  agents: AgentsListResult | null;
  config: ConfigSnapshot | null;
  files: AgentsFilesListResult | null;
  tools: ToolsCatalogResult | null;
  skills: SkillStatusReport | null;
  channels: ChannelsStatusSnapshot | null;
  cron: [CronStatus | null, { jobs?: CronJob[] }] | null;
}

export interface OverviewTabProps {
  workspace: string;
  primaryModel: string;
  identityName: string;
  identityEmoji: string;
  skillsFilter: string;
  defaultId: string | null;
  selectedAgent: { id: string } | null;
  configSnapshot: ConfigSnapshot | null;
  configLoading: boolean;
  configSaving: boolean;
  effectivePrimary: string | null | undefined;
  defaultPrimary: string | null | undefined;
  fallbackText: string;
  overviewConfigDirty: boolean;
  onConfigReload: () => void;
  onOverviewModelSave: () => void;
  onModelPrimaryChange: (value: string | null) => void;
  onModelFallbacksChange: (value: string[]) => void;
}

export interface FilesTabProps {
  files: AgentsFilesListResult | null;
  filesLoading: boolean;
  filesError: string | null;
  activeFileName: string | null;
  fileContents: Record<string, string>;
  fileDrafts: Record<string, string>;
  fileLoading: boolean;
  fileSaving: boolean;
  fileLoadError: string | null;
  workspace: string;
  agentId: string | null;
  onRefresh: () => void;
  onFileSelect: (fileName: string) => void;
  onFileDraftChange: (value: string) => void;
  onFileReset: () => void;
  onFileSave: () => void;
}

export interface ToolsTabProps {
  tools: ToolsCatalogResult | null;
  toolsError: string | null;
  toolsLoading: boolean;
  configSnapshot: ConfigSnapshot | null;
  configGlobalTools: unknown;
  agentConfigEntry: unknown;
  effectiveToolsProfile: string;
  effectiveToolsAlsoAllow: string[];
  effectiveToolsDeny: string[];
  hasAgentAllow: boolean;
  toolsDirty: boolean;
  configSaving: boolean;
  enabledToolCount: number;
  totalToolCount: number;
  profileOptionsFromApi: Array<{ id: string; label: string }>;
  onConfigReload: () => void;
  onToolsPreset: (profileId: string) => void;
  onToolsEnableAll: () => void;
  onToolsDisableAll: () => void;
  onToolToggle: (toolId: string, enabled: boolean) => void;
  onToolsSave: () => void;
}

export interface SkillsTabProps {
  skills: SkillStatusReport | null;
  skillsError: string | null;
  skillsLoading: boolean;
  configSnapshot: ConfigSnapshot | null;
  configLoading: boolean;
  configSaving: boolean;
  agentConfigEntry: unknown;
  skillsAllowlist: string[] | undefined;
  effectiveSkillsAllowlist: string[] | undefined | null;
  effectiveAllowSet: Set<string>;
  skillsEditable: boolean;
  skillsDirty: boolean;
  skillsSearchFilter: string;
  skillsGroupsActiveKey: string[] | undefined;
  onSkillsSearchFilterChange: (value: string) => void;
  onSkillsGroupsActiveKeyChange: (keys: string[] | undefined) => void;
  onSkillsUseAll: () => void;
  onSkillsDisableAll: () => void;
  onSkillToggle: (skillName: string, enabled: boolean) => void;
  onSkillsSave: () => void;
}

export interface ChannelsTabProps {
  channels: ChannelsStatusSnapshot | null;
  channelsError: string | null;
  channelsLoading: boolean;
  channelIds: string[];
}

export interface CronTabProps {
  cronStatus: CronStatus | null;
  cronJobsForAgent: Array<CronJob>;
  cronError: string | null;
  cronLoading: boolean;
}
