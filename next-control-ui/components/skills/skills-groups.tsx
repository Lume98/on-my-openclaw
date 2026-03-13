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
      <div className="mt-4">
        <Empty description="No skills found." />
      </div>
    );
  }

  return (
    <Collapse
      // defaultActiveKey={collapseDefaultOpen}
      ghost
      className="mt-4 bg-transparent [&_.ant-collapse-content-box]:!px-0 [&_.ant-collapse-content-box]:!pb-0 [&_.ant-collapse-header]:!px-0 [&_.ant-collapse-header]:!py-3 [&_.ant-collapse-header]:text-[13px] [&_.ant-collapse-header]:font-semibold [&_.ant-collapse-header]:text-slate-800"
      items={groups.map((group, index: number) => ({
        key: `${group.id}-${index}`,
        label: (
          <span className="inline-flex items-center gap-2">
            {group.label}
            <span className="text-xs font-medium text-slate-500">{group.skills.length}</span>
          </span>
        ),
        children: (
          <div className="flex flex-col gap-3 py-1">
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
