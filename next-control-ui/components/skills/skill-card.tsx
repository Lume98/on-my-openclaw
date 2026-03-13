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

const chipBaseClassName = "m-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-medium leading-5";

const chipToneClassNames = {
  neutral: `${chipBaseClassName} bg-slate-100 text-slate-700`,
  success: `${chipBaseClassName} bg-emerald-100 text-emerald-700`,
  warning: `${chipBaseClassName} bg-amber-100 text-amber-700`,
} as const;

function buildSkillChips(skill: SkillStatusEntry) {
  const chips: Array<{ key: string; label: string; tone: keyof typeof chipToneClassNames }> = [];

  if (skill.source) {
    chips.push({ key: "source", label: skill.source, tone: "neutral" });
  }

  if (skill.bundled && skill.source !== "openclaw-bundled") {
    chips.push({ key: "bundled", label: "bundled", tone: "neutral" });
  }

  chips.push({
    key: "eligible",
    label: skill.eligible !== false ? "eligible" : "blocked",
    tone: skill.eligible !== false ? "success" : "warning",
  });

  if (skill.disabled) {
    chips.push({ key: "disabled", label: "disabled", tone: "warning" });
  }

  return chips;
}

function buildSkillMetaRows(skill: SkillStatusEntry) {
  const rows: Array<{ key: string; label: string; value: string }> = [];
  const missing = computeSkillMissing(skill);
  const reasons = computeSkillReasons(skill);

  if (missing.length > 0) {
    rows.push({ key: "missing", label: "Missing", value: missing.join(", ") });
  }

  if (reasons.length > 0) {
    rows.push({ key: "reason", label: "Reason", value: reasons.join(", ") });
  }

  return rows;
}

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
  const canInstall = (skill.install?.length ?? 0) > 0 && (skill.missing?.bins?.length ?? 0) > 0;
  const firstInstall = skill.install?.[0];
  const chips = buildSkillChips(skill);
  const metaRows = buildSkillMetaRows(skill);
  const title = `${skill.emoji ? `${skill.emoji} ` : ""}${skill.name}`;
  const toggleLabel = skill.disabled ? "Enable" : "Disable";
  const installLabel = busy ? "Installing…" : (firstInstall?.label ?? `Install ${skill.name}`);
  const messageToneClassName = message?.kind === "success" ? "text-emerald-700" : "text-red-600";

  return (
    <div className="flex flex-wrap items-start justify-between gap-3.5 rounded-[14px] border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="m-0 text-sm font-semibold leading-5 text-[var(--foreground)]">{title}</div>
        <div className="mt-1 text-xs leading-5 text-slate-500">
          {clampSkillDescription(skill.description, 140)}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <Tag key={chip.key} className={chipToneClassNames[chip.tone]}>
              {chip.label}
            </Tag>
          ))}
        </div>
        {metaRows.map((row) => (
          <div key={row.key} className="mt-1.5 text-xs text-slate-500">
            {row.label}: {row.value}
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-col items-end gap-2 max-sm:w-full max-sm:items-stretch">
        <Space wrap className="justify-end max-sm:justify-start">
          <Button
            size="small"
            disabled={busy}
            onClick={() => onToggle(skill, skill.disabled === true)}
          >
            {toggleLabel}
          </Button>
          {canInstall && firstInstall && (
            <Button size="small" disabled={busy} onClick={() => onInstall(skill)}>
              {installLabel}
            </Button>
          )}
        </Space>
        {message && (
          <div className={`text-right text-xs max-sm:text-left ${messageToneClassName}`}>
            {message.message}
          </div>
        )}
        {skill.primaryEnv && (
          <div className="mt-0.5 flex min-w-[200px] w-full max-w-sm flex-col items-end gap-2 max-sm:items-stretch">
            <label className="text-xs font-medium text-slate-600" htmlFor={apiKeyInputId}>
              API key
            </label>
            <Input.Password
              id={apiKeyInputId}
              size="small"
              value={editingKey}
              onChange={(e) => onEditKey(skill, e.target.value)}
              placeholder={skill.primaryEnv}
            />
            <Button
              type="primary"
              size="small"
              disabled={busy}
              onClick={() => onSaveKey(skill, editingKey)}
            >
              Save key
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});
