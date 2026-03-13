import type { SkillStatusEntry } from "@/lib/types";

export function getSkillKey(skill: SkillStatusEntry): string {
  return (skill.skillKey ?? skill.id ?? skill.name) || "";
}
