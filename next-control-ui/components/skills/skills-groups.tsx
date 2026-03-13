"use client";

import { Collapse, Empty } from "@/components/page-views/shared/dashboard-utils";
import { SkillCard } from "@/components/skills/skill-card";
import { getSkillKey } from "@/components/skills/skill-key";
import type { SkillActionMessage } from "@/components/skills/types";
import type { SkillStatusEntry } from "@/lib/types";

type SkillGroup = {
  id: string;
  label: string;
  skills: SkillStatusEntry[];
};

type SkillsGroupsProps = {
  busyKey: string | null;
  collapseDefaultOpen: string[];
  editingKeys: Record<string, string>;
  filteredCount: number;
  groups: SkillGroup[];
  messages: Record<string, SkillActionMessage>;
  onEditKey: (skill: SkillStatusEntry, value: string) => void;
  onInstall: (skill: SkillStatusEntry) => void;
  onSaveKey: (skill: SkillStatusEntry, value: string) => void;
  onToggle: (skill: SkillStatusEntry, enabled: boolean) => void;
};

export function SkillsGroups({
  busyKey,
  collapseDefaultOpen,
  editingKeys,
  filteredCount,
  groups,
  messages,
  onEditKey,
  onInstall,
  onSaveKey,
  onToggle,
}: SkillsGroupsProps) {
  if (filteredCount === 0) {
    return (
      <div className="skills-empty">
        <Empty description="No skills found." />
      </div>
    );
  }

  return (
    <Collapse
      defaultActiveKey={collapseDefaultOpen}
      className="skills-groups-collapse"
      items={groups.map((group) => ({
        key: group.id,
        label: (
          <span className="skills-group-label">
            {group.label}
            <span className="skills-group-count">{group.skills.length}</span>
          </span>
        ),
        children: (
          <div className="skills-grid">
            {group.skills.map((skill) => {
              const skillKey = getSkillKey(skill);

              return (
                <SkillCard
                  key={skillKey}
                  skill={skill}
                  busyKey={busyKey}
                  editingKey={editingKeys[skillKey] ?? ""}
                  onEditKey={onEditKey}
                  message={messages[skillKey] ?? null}
                  onToggle={onToggle}
                  onSaveKey={onSaveKey}
                  onInstall={onInstall}
                />
              );
            })}
          </div>
        ),
      }))}
    />
  );
}
