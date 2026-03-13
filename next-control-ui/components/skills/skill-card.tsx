"use client";

import { memo, useId } from "react";
import { Button, Input, Space, Tag } from "@/components/page-views/shared/dashboard-utils";
import {
  clampSkillDescription,
  computeSkillMissing,
  computeSkillReasons,
} from "@/components/page-views/shared/skills-utils";
import { getSkillKey } from "@/components/skills/skill-key";
import type { SkillActionMessage } from "@/components/skills/types";
import type { SkillStatusEntry } from "@/lib/types";

type SkillCardProps = {
  skill: SkillStatusEntry;
  busyKey: string | null;
  editingKey: string;
  message: SkillActionMessage | null;
  onEditKey: (skill: SkillStatusEntry, value: string) => void;
  onToggle: (skill: SkillStatusEntry, enabled: boolean) => void;
  onSaveKey: (skill: SkillStatusEntry, value: string) => void;
  onInstall: (skill: SkillStatusEntry) => void;
};

export const SkillCard = memo(function SkillCard({
  skill,
  busyKey,
  editingKey,
  message,
  onEditKey,
  onToggle,
  onSaveKey,
  onInstall,
}: SkillCardProps) {
  const key = getSkillKey(skill);
  const apiKeyInputId = useId();
  const busy = busyKey === key;
  const missing = computeSkillMissing(skill);
  const reasons = computeSkillReasons(skill);
  const showBundledBadge = Boolean(skill.bundled && skill.source !== "openclaw-bundled");
  const eligible = skill.eligible !== false;
  const canInstall = (skill.install?.length ?? 0) > 0 && (skill.missing?.bins?.length ?? 0) > 0;
  const firstInstall = skill.install?.[0];

  return (
    <div className="skill-card">
      <div className="skill-card-main">
        <div className="skill-card-title">
          {skill.emoji ? `${skill.emoji} ` : ""}
          {skill.name}
        </div>
        <div className="skill-card-desc">{clampSkillDescription(skill.description, 140)}</div>
        <div className="skill-card-chips">
          {skill.source && <Tag className="skill-chip skill-chip-source">{skill.source}</Tag>}
          {showBundledBadge && <Tag className="skill-chip">bundled</Tag>}
          <Tag className={eligible ? "skill-chip skill-chip-ok" : "skill-chip skill-chip-warn"}>
            {eligible ? "eligible" : "blocked"}
          </Tag>
          {skill.disabled && <Tag className="skill-chip skill-chip-warn">disabled</Tag>}
        </div>
        {missing.length > 0 && (
          <div className="skill-card-missing">Missing: {missing.join(", ")}</div>
        )}
        {reasons.length > 0 && (
          <div className="skill-card-reasons">Reason: {reasons.join(", ")}</div>
        )}
      </div>
      <div className="skill-card-meta">
        <Space wrap className="skill-card-actions">
          <Button
            size="small"
            disabled={busy}
            onClick={() => onToggle(skill, skill.disabled === true)}
          >
            {skill.disabled ? "Enable" : "Disable"}
          </Button>
          {canInstall && firstInstall && (
            <Button size="small" disabled={busy} onClick={() => onInstall(skill)}>
              {busy ? "Installing…" : (firstInstall.label ?? `Install ${skill.name}`)}
            </Button>
          )}
        </Space>
        {message && (
          <div className={`skill-card-message skill-card-message-${message.kind}`}>
            {message.message}
          </div>
        )}
        {skill.primaryEnv && (
          <div className="skill-card-apikey">
            <label className="skill-apikey-label" htmlFor={apiKeyInputId}>
              <span>API key</span>
            </label>
            <Input.Password
              id={apiKeyInputId}
              size="small"
              value={editingKey}
              onChange={(e) => onEditKey(skill, e.target.value)}
              placeholder={skill.primaryEnv}
              className="skill-apikey-input"
            />
            <Button
              type="primary"
              size="small"
              disabled={busy}
              onClick={() => onSaveKey(skill, editingKey)}
              className="skill-save-key-btn"
            >
              Save key
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});
