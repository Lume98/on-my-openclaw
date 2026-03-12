/**
 * 技能列表分组与缺失依赖计算，与 ui 目录 agents-panels-tools-skills / skills-grouping 逻辑对齐
 * 始终包含 BUILT-IN SKILLS 分组（即使为空），便于「展示所有内置技能」按钮展开
 */
import type { SkillStatusEntry } from "@/components/openclaw/types";

const SKILL_SOURCE_GROUPS: Array<{ id: string; label: string; sources: string[] }> = [
  { id: "workspace", label: "Workspace Skills", sources: ["openclaw-workspace"] },
  { id: "built-in", label: "BUILT-IN SKILLS", sources: ["openclaw-bundled"] },
  { id: "installed", label: "Installed Skills", sources: ["openclaw-managed"] },
  { id: "extra", label: "Extra Skills", sources: ["openclaw-extra"] },
];

export type SkillGroup = {
  id: string;
  label: string;
  skills: SkillStatusEntry[];
};

/** 判断是否为内置技能：与 ui skills-grouping 一致，bundled 或 source 为 openclaw-bundled */
function isBuiltInSkill(skill: SkillStatusEntry): boolean {
  if (skill.bundled === true) {
    return true;
  }
  return skill.source === "openclaw-bundled";
}

export function groupSkills(skills: SkillStatusEntry[]): SkillGroup[] {
  const groups = new Map<string, SkillGroup>();
  for (const def of SKILL_SOURCE_GROUPS) {
    groups.set(def.id, { id: def.id, label: def.label, skills: [] });
  }
  const builtInGroup = SKILL_SOURCE_GROUPS.find((g) => g.id === "built-in");
  const other: SkillGroup = { id: "other", label: "Other Skills", skills: [] };
  for (const skill of skills) {
    const match = isBuiltInSkill(skill)
      ? builtInGroup
      : SKILL_SOURCE_GROUPS.find((g) => g.sources.includes(skill.source ?? ""));
    if (match) {
      groups.get(match.id)?.skills.push(skill);
    } else {
      other.skills.push(skill);
    }
  }
  const ordered = SKILL_SOURCE_GROUPS.map((id) => groups.get(id)).filter(
    (g): g is SkillGroup => Boolean(g) && (g.skills.length > 0 || g.id === "built-in"),
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
