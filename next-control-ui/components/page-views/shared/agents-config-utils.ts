/**
 * 从 config.get 快照中解析当前代理的配置（与 ui 目录 agents-utils 逻辑对齐）
 */
import type { ConfigSnapshot } from "@/lib/types";

export type AgentConfigEntry = {
  id: string;
  name?: string;
  workspace?: string;
  model?: unknown;
  skills?: string[];
  tools?: {
    profile?: string;
    allow?: string[];
    alsoAllow?: string[];
    deny?: string[];
  };
};

export function resolveAgentConfig(
  snapshot: ConfigSnapshot | null | undefined,
  agentId: string,
): {
  entry: AgentConfigEntry | undefined;
  defaults: { workspace?: string; model?: unknown } | undefined;
  globalTools: { profile?: string; allow?: string[] } | undefined;
} {
  const cfg = snapshot?.config as
    | {
        agents?: {
          defaults?: { workspace?: string; model?: unknown };
          list?: AgentConfigEntry[];
        };
        tools?: { profile?: string; allow?: string[] };
      }
    | undefined;
  const list = cfg?.agents?.list ?? [];
  const entry = list.find((a) => a?.id === agentId);
  return {
    entry,
    defaults: cfg?.agents?.defaults,
    globalTools: cfg?.tools,
  };
}

export function resolveModelLabel(model: unknown): string {
  if (!model) {
    return "—";
  }
  if (typeof model === "string") {
    return model.trim() || "—";
  }
  if (typeof model === "object" && model !== null && "primary" in model) {
    const p = (model as { primary?: string }).primary;
    return typeof p === "string" && p.trim() ? p.trim() : "—";
  }
  return "—";
}

export function resolveModelPrimary(model: unknown): string | null {
  if (!model) {
    return null;
  }
  if (typeof model === "string") {
    const t = model.trim();
    return t || null;
  }
  if (typeof model === "object" && model !== null) {
    const r = model as Record<string, unknown>;
    const c =
      typeof r.primary === "string"
        ? r.primary
        : typeof r.model === "string"
          ? r.model
          : typeof r.id === "string"
            ? r.id
            : typeof r.value === "string"
              ? r.value
              : null;
    const t = c?.trim();
    return t || null;
  }
  return null;
}

export function resolveModelFallbacks(model: unknown): string[] | null {
  if (!model || typeof model === "string") {
    return null;
  }
  if (typeof model !== "object") {
    return null;
  }
  const r = model as Record<string, unknown>;
  const fallbacks = Array.isArray(r.fallbacks)
    ? r.fallbacks
    : Array.isArray(r.fallback)
      ? r.fallback
      : null;
  return fallbacks ? fallbacks.filter((x): x is string => typeof x === "string") : null;
}

export function resolveEffectiveModelFallbacks(
  entryModel: unknown,
  defaultModel: unknown,
): string[] | null {
  return resolveModelFallbacks(entryModel) ?? resolveModelFallbacks(defaultModel);
}

export function parseFallbackList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type ModelOption = { value: string; label: string };

export function getConfiguredModelOptions(
  snapshot: ConfigSnapshot | null | undefined,
  currentPrimary: string | null,
): ModelOption[] {
  const cfg = snapshot?.config as
    | { agents?: { defaults?: { models?: Record<string, { alias?: string }> } } }
    | undefined;
  const models = cfg?.agents?.defaults?.models;
  if (!models || typeof models !== "object") {
    return [];
  }
  const options: ModelOption[] = [];
  for (const [modelId, modelRaw] of Object.entries(models)) {
    const trimmed = modelId.trim();
    if (!trimmed) {
      continue;
    }
    const alias =
      modelRaw && typeof modelRaw === "object" && typeof modelRaw.alias === "string"
        ? modelRaw.alias.trim()
        : undefined;
    const label = alias && alias !== trimmed ? `${alias} (${trimmed})` : trimmed;
    options.push({ value: trimmed, label });
  }
  const hasCurrent = currentPrimary ? options.some((o) => o.value === currentPrimary) : false;
  if (currentPrimary && !hasCurrent) {
    options.unshift({ value: currentPrimary, label: `当前 (${currentPrimary})` });
  }
  return options;
}
