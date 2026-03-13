"use client";

import { Alert, Button, Collapse, Input, Switch, Tag } from "antd";
import { computeSkillMissing, groupSkills } from "@/components/page-views/shared/skills-utils";
import type { SkillsTabProps } from "./types";

export function SkillsTab({
  skills,
  skillsError,
  skillsLoading,
  configSnapshot: _configSnapshot,
  configLoading: _configLoading,
  configSaving,
  agentConfigEntry: _agentConfigEntry,
  skillsAllowlist: _skillsAllowlist,
  effectiveSkillsAllowlist,
  effectiveAllowSet,
  skillsEditable,
  skillsDirty,
  skillsSearchFilter,
  skillsGroupsActiveKey,
  onSkillsSearchFilterChange,
  onSkillsGroupsActiveKeyChange,
  onSkillsUseAll,
  onSkillsDisableAll,
  onSkillToggle,
  onSkillsSave,
}: SkillsTabProps) {
  const rawSkills = skills?.skills ?? [];
  const allSkillNames = rawSkills.map((s) => s.name).filter(Boolean);
  const effectiveAll = effectiveSkillsAllowlist === undefined;

  const searchLower = skillsSearchFilter.trim().toLowerCase();
  const filterSkill = (s: { name?: string; description?: string }) => {
    if (!searchLower) {
      return true;
    }
    const name = (s.name ?? "").toLowerCase();
    const desc = (s.description ?? "").toLowerCase();
    return name.includes(searchLower) || desc.includes(searchLower);
  };
  const groups = groupSkills(rawSkills);
  const groupedSkills: Record<string, typeof rawSkills> = {};
  for (const g of groups) {
    const filtered = searchLower ? g.skills.filter(filterSkill) : g.skills;
    if (filtered.length > 0) {
      groupedSkills[g.label] = filtered;
    }
  }
  const skillKeys = Object.keys(groupedSkills);

  const defaultActiveKeys =
    skillsGroupsActiveKey !== undefined
      ? skillsGroupsActiveKey
      : skillKeys.length > 0
        ? [skillKeys[0]]
        : [];

  return (
    <div className="agent-panel-card">
      <div className="agent-panel-skills-header">
        <div>
          <h3 className="agent-panel-title">技能</h3>
          <p className="agent-panel-sub">
            {effectiveAll
              ? "全部技能已启用。"
              : `已启用 ${effectiveAllowSet.size} / ${allSkillNames.length} 项技能。`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button size="small" disabled={!skillsEditable} onClick={onSkillsUseAll}>
            全部启用
          </Button>
          <Button size="small" disabled={!skillsEditable} onClick={onSkillsDisableAll}>
            全部禁用
          </Button>
          <Button
            type="primary"
            size="small"
            loading={configSaving}
            disabled={!skillsEditable || !skillsDirty}
            onClick={() => onSkillsSave()}
          >
            {configSaving ? "保存中…" : "保存"}
          </Button>
        </div>
      </div>

      {skillsError && <Alert type="error" title={skillsError} style={{ marginBottom: 12 }} />}

      <div style={{ marginTop: 16, marginBottom: 12 }}>
        <Input
          placeholder="搜索技能（名称或描述）"
          value={skillsSearchFilter}
          onChange={(e) => onSkillsSearchFilterChange(e.target.value)}
          allowClear
        />
      </div>

      <Collapse
        activeKey={defaultActiveKeys}
        onChange={(keys) => {
          const arr = Array.isArray(keys) ? keys : [keys];
          onSkillsGroupsActiveKeyChange(
            arr.length === skillKeys.length && skillKeys.length > 0 ? undefined : arr,
          );
        }}
        items={skillKeys
          .filter((category) => (groupedSkills[category]?.length ?? 0) > 0)
          .map((category) => {
            const entries = groupedSkills[category] ?? [];
            return {
              key: category,
              label: `${category} (${entries.length})`,
              children: (
                <div className="agent-skills-list">
                  {entries.map((skill) => {
                    const skillName = skill.name ?? "";
                    const trimmed = skillName.trim();
                    const enabled = effectiveAllowSet.has(trimmed);
                    const missing = computeSkillMissing(skill);

                    return (
                      <div key={trimmed} className="agent-skill-item">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{trimmed}</div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "rgba(15,23,42,0.55)",
                              marginTop: 2,
                            }}
                          >
                            {skill.description ?? "无描述"}
                          </div>
                          {missing.length > 0 && (
                            <div style={{ marginTop: 4 }}>
                              {missing.map((m) => (
                                <Tag key={m} color="orange" style={{ fontSize: 11 }}>
                                  缺少 {m}
                                </Tag>
                              ))}
                            </div>
                          )}
                        </div>
                        <Switch
                          size="small"
                          checked={enabled}
                          disabled={!skillsEditable}
                          onChange={(checked) => onSkillToggle(trimmed, checked)}
                        />
                      </div>
                    );
                  })}
                </div>
              ),
            };
          })}
      />

      {skillKeys.length === 0 && !skillsLoading && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "rgba(15,23,42,0.45)",
          }}
        >
          {skillsSearchFilter ? "没有匹配的技能。" : "暂无技能数据。"}
        </div>
      )}
    </div>
  );
}
