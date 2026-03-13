/**
 * 技能列表分组与缺失依赖计算，与 ui 目录 skills-grouping / skills-shared 逻辑对齐
 */
import type { SkillStatusEntry } from "@/lib/types";

/** 与 ui 目录 skills-grouping.ts 分组与标签一致 */
const SKILL_SOURCE_GROUPS: Array<{ id: string; label: string; sources: string[] }> = [
  { id: "workspace", label: "Workspace Skills", sources: ["openclaw-workspace"] },
  { id: "built-in", label: "Built-in Skills", sources: ["openclaw-bundled"] },
  { id: "installed", label: "Installed Skills", sources: ["openclaw-managed"] },
  { id: "extra", label: "Extra Skills", sources: ["openclaw-extra"] },
];

export type SkillGroup = {
  id: string;
  label: string;
  skills: SkillStatusEntry[];
};

export function groupSkills(skills: SkillStatusEntry[]): SkillGroup[] {
  const groups = new Map<string, SkillGroup>();
  for (const def of SKILL_SOURCE_GROUPS) {
    groups.set(def.id, { id: def.id, label: def.label, skills: [] });
  }
  const builtInGroup = SKILL_SOURCE_GROUPS.find((g) => g.id === "built-in");
  const other: SkillGroup = { id: "other", label: "Other Skills", skills: [] };
  for (const skill of skills) {
    const match = skill.bundled
      ? builtInGroup
      : SKILL_SOURCE_GROUPS.find((g) => g.sources.includes(skill.source ?? ""));
    if (match) {
      groups.get(match.id)?.skills.push(skill);
    } else {
      other.skills.push(skill);
    }
  }
  const ordered = SKILL_SOURCE_GROUPS.map((def) => groups.get(def.id)).filter(
    (g): g is SkillGroup => Boolean(g && g.skills.length > 0),
  );
  if (other.skills.length > 0) {
    ordered.push(other);
  }
  return ordered;
}

export function computeSkillMissing(skill: SkillStatusEntry): string[] {
  const m = skill.missing;
  if (!m) {
    return [];
  }
  return [
    ...(m.bins ?? []).map((b) => `bin:${b}`),
    ...(m.env ?? []).map((e) => `env:${e}`),
    ...(m.config ?? []).map((c) => `config:${c}`),
    ...(m.os ?? []).map((o) => `os:${o}`),
  ];
}

/** 与 ui 目录 skills-shared computeSkillReasons 对齐：禁用、allowlist 等原因 */
export function computeSkillReasons(skill: SkillStatusEntry): string[] {
  const reasons: string[] = [];
  if (skill.disabled) {
    reasons.push("disabled");
  }
  if (skill.blockedByAllowlist) {
    reasons.push("blocked by allowlist");
  }
  return reasons;
}

/** 截断描述文案，与 ui 目录 clampText 对齐 */
export function clampSkillDescription(text: string | undefined, maxLen = 140): string {
  if (!text || !text.trim()) {
    return "";
  }
  const t = text.trim();
  if (t.length <= maxLen) {
    return t;
  }
  return t.slice(0, maxLen).trim() + "…";
}
