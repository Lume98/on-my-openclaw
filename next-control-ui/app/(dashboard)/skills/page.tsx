"use client";

import { useCallback, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Collapse,
  Empty,
  Input,
  Space,
  Tag,
  Typography,
} from "@/components/page-views/shared/dashboard-utils";
import {
  clampSkillDescription,
  computeSkillMissing,
  computeSkillReasons,
  groupSkills,
} from "@/components/page-views/shared/skills-utils";
import { useGatewayQuery } from "@/components/page-views/shared/use-gateway-query";
import { useGateway } from "@/components/providers/gateway-provider";
import type { SkillStatusEntry, SkillStatusReport } from "@/lib/types";

const { Text } = Typography;

function getSkillKey(skill: SkillStatusEntry): string {
  return (skill.skillKey ?? skill.id ?? skill.name) || "";
}

type SkillCardProps = {
  skill: SkillStatusEntry;
  busyKey: string | null;
  editingKey: string;
  message: { kind: "success" | "error"; message: string } | null;
  onEditKey: (value: string) => void;
  onToggle: (skill: SkillStatusEntry, enabled: boolean) => void;
  onSaveKey: (skill: SkillStatusEntry) => void;
  onInstall: (skill: SkillStatusEntry) => void;
};

function SkillCard({
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
            <label className="skill-apikey-label">
              <span>API key</span>
              <Input.Password
                size="small"
                value={editingKey}
                onChange={(e) => onEditKey(e.target.value)}
                placeholder={skill.primaryEnv}
                className="skill-apikey-input"
              />
            </label>
            <Button
              type="primary"
              size="small"
              disabled={busy}
              onClick={() => onSaveKey(skill)}
              className="skill-save-key-btn"
            >
              Save key
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SkillsPage() {
  const { request, connected } = useGateway();
  const [filter, setFilter] = useState("");
  const [editingKeys, setEditingKeys] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Record<string, { kind: "success" | "error"; message: string }>
  >({});

  const skillsQuery = useGatewayQuery<SkillStatusReport>(
    useCallback(async () => await request<SkillStatusReport>("skills.status", {}), [request]),
    connected,
  );

  const skills = skillsQuery.data?.skills ?? [];
  const filterLower = filter.trim().toLowerCase();
  const filtered =
    filterLower.length > 0
      ? skills.filter((s) =>
          [s.name, s.description, s.source].join(" ").toLowerCase().includes(filterLower),
        )
      : skills;
  const groups = groupSkills(filtered);

  const setMessage = useCallback(
    (key: string, msg: { kind: "success" | "error"; message: string } | null) => {
      setMessages((prev) => {
        const next = { ...prev };
        if (msg) next[key] = msg;
        else delete next[key];
        return next;
      });
    },
    [],
  );

  const handleRefresh = useCallback(() => {
    void skillsQuery.refresh();
  }, [skillsQuery]);

  const handleToggle = useCallback(
    async (skill: SkillStatusEntry, enabled: boolean) => {
      const key = getSkillKey(skill);
      setBusyKey(key);
      setMessage(key, null);
      try {
        await request("skills.update", { skillKey: key, enabled });
        await skillsQuery.refresh();
        setMessage(key, {
          kind: "success",
          message: enabled ? "Skill enabled" : "Skill disabled",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setMessage(key, { kind: "error", message });
      } finally {
        setBusyKey(null);
      }
    },
    [request, skillsQuery, setMessage],
  );

  const handleSaveKey = useCallback(
    async (skill: SkillStatusEntry) => {
      const key = getSkillKey(skill);
      const apiKey = editingKeys[key] ?? "";
      setBusyKey(key);
      setMessage(key, null);
      try {
        await request("skills.update", { skillKey: key, apiKey });
        await skillsQuery.refresh();
        setMessage(key, { kind: "success", message: "API key saved" });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setMessage(key, { kind: "error", message });
      } finally {
        setBusyKey(null);
      }
    },
    [request, skillsQuery, editingKeys, setMessage],
  );

  const handleInstall = useCallback(
    async (skill: SkillStatusEntry) => {
      const install = skill.install?.[0];
      if (!install) return;
      const key = getSkillKey(skill);
      setBusyKey(key);
      setMessage(key, null);
      try {
        const result = await request<{ message?: string }>("skills.install", {
          name: skill.name,
          installId: install.id,
          timeoutMs: 120000,
        });
        await skillsQuery.refresh();
        setMessage(key, {
          kind: "success",
          message: result?.message ?? "Installed",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setMessage(key, { kind: "error", message });
      } finally {
        setBusyKey(null);
      }
    },
    [request, skillsQuery, setMessage],
  );

  const collapseDefaultOpen = groups
    .filter((g) => g.id !== "workspace" && g.id !== "built-in")
    .map((g) => g.id);

  return (
    <Card className="skills-section-card" variant="borderless">
      <div className="skills-section-head">
        <div>
          <div className="skills-section-title">Skills</div>
          <div className="skills-section-sub">Bundled, managed, and workspace skills.</div>
        </div>
        <Button onClick={handleRefresh} loading={skillsQuery.loading} disabled={!connected}>
          {skillsQuery.loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      <div className="skills-filter-row">
        <label className="skills-filter-label">
          <span>Filter</span>
          <Input
            placeholder="Search skills"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            allowClear
            className="skills-filter-input"
          />
        </label>
        <Text type="secondary" className="skills-filter-count">
          {filtered.length} shown
        </Text>
      </div>

      {skillsQuery.error && (
        <Alert type="error" message={skillsQuery.error} className="skills-error-alert" />
      )}

      {filtered.length === 0 ? (
        <div className="skills-empty">
          <Empty description="No skills found." />
        </div>
      ) : (
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
                {group.skills.map((skill) => (
                  <SkillCard
                    key={getSkillKey(skill)}
                    skill={skill}
                    busyKey={busyKey}
                    editingKey={editingKeys[getSkillKey(skill)] ?? ""}
                    onEditKey={(value) =>
                      setEditingKeys((prev) => ({ ...prev, [getSkillKey(skill)]: value }))
                    }
                    message={messages[getSkillKey(skill)] ?? null}
                    onToggle={handleToggle}
                    onSaveKey={handleSaveKey}
                    onInstall={handleInstall}
                  />
                ))}
              </div>
            ),
          }))}
        />
      )}
    </Card>
  );
}
