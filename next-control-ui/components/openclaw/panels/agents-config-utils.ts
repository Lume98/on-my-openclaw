/**
 * 从 config.get 快照中解析当前代理的配置（与 ui 目录 agents-utils 逻辑对齐）
 */
import type { ConfigSnapshot } from "@/components/openclaw/types";

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
