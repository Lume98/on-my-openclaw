/**
 * 工具策略辅助：与 ui 目录 agents-panels-tools-skills 逻辑对齐（简化版，仅精确匹配）
 */
import type { ToolCatalogProfileId } from "@/components/openclaw/types";

const ALIASES: Record<string, string> = {
  bash: "exec",
  "apply-patch": "apply_patch",
};

export function normalizeToolId(id: string): string {
  const t = id.trim().toLowerCase();
  return ALIASES[t] ?? t;
}

function inList(toolId: string, list: string[]): boolean {
  const n = normalizeToolId(toolId);
  return list.some((e) => normalizeToolId(e) === n);
}

/** 根据 profile 与 defaultProfiles 判断是否在基础策略中启用 */
export function isInProfile(
  profile: string,
  defaultProfiles: ToolCatalogProfileId[] | undefined,
): boolean {
  if (!defaultProfiles?.length) {
    return false;
  }
  const p = profile.toLowerCase();
  return defaultProfiles.some((d) => d.toLowerCase() === p);
}

/** 综合 profile、alsoAllow、deny 判断工具是否启用 */
export function isToolAllowed(params: {
  toolId: string;
  profile: string;
  defaultProfiles: ToolCatalogProfileId[] | undefined;
  alsoAllow: string[];
  deny: string[];
}): { allowed: boolean; baseAllowed: boolean } {
  const baseAllowed = isInProfile(params.profile, params.defaultProfiles);
  const extraAllowed = inList(params.toolId, params.alsoAllow);
  const denied = inList(params.toolId, params.deny);
  const allowed = (baseAllowed || extraAllowed) && !denied;
  return { allowed, baseAllowed };
}

/** 默认预设列表（与 gateway tools.catalog 返回一致） */
export const DEFAULT_PROFILE_OPTIONS: Array<{ id: string; label: string }> = [
  { id: "minimal", label: "Minimal" },
  { id: "coding", label: "Coding" },
  { id: "messaging", label: "Messaging" },
  { id: "full", label: "Full" },
  { id: "inherit", label: "Inherit" },
];
