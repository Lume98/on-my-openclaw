"use client";

import { useCallback, useMemo, useState } from "react";
import { Alert, Card } from "@/components/page-views/shared/dashboard-utils";
import { groupSkills } from "@/components/page-views/shared/skills-utils";
import { useGatewayQuery } from "@/components/page-views/shared/use-gateway-query";
import { useGateway } from "@/components/providers/gateway-provider";
import { getSkillKey } from "@/components/skills/skill-key";
import { SkillsGroups } from "@/components/skills/skills-groups";
import { SkillsToolbar } from "@/components/skills/skills-toolbar";
import type { SkillActionMessage } from "@/components/skills/types";
import type { SkillStatusEntry, SkillStatusReport } from "@/lib/types";

export default function SkillsPage() {
  const { request, connected } = useGateway();
  const [filter, setFilter] = useState("");
  const [editingKeys, setEditingKeys] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, SkillActionMessage>>({});

  const skillsQuery = useGatewayQuery<SkillStatusReport>(
    useCallback(async () => await request<SkillStatusReport>("skills.status", {}), [request]),
    connected,
  );

  const { filtered, groups } = useMemo(() => {
    const skills = skillsQuery.data?.skills ?? [];
    const filterLower = filter.trim().toLowerCase();
    const filtered =
      filterLower.length > 0
        ? skills.filter((skill) =>
            [skill.name, skill.description, skill.source]
              .join(" ")
              .toLowerCase()
              .includes(filterLower),
          )
        : skills;

    return {
      filtered,
      groups: groupSkills(filtered),
    };
  }, [skillsQuery.data, filter]);

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

  const handleEditKey = useCallback((skill: SkillStatusEntry, value: string) => {
    setEditingKeys((prev) => ({ ...prev, [getSkillKey(skill)]: value }));
  }, []);

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
    async (skill: SkillStatusEntry, apiKey: string) => {
      const key = getSkillKey(skill);
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
    [request, skillsQuery, setMessage],
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

  const collapseDefaultOpen = useMemo(
    () =>
      groups
        .filter((group) => group.id !== "workspace" && group.id !== "built-in")
        .map((group) => group.id),
    [groups],
  );

  return (
    <Card className="skills-section-card" variant="borderless">
      <SkillsToolbar
        connected={connected}
        count={filtered.length}
        filter={filter}
        loading={skillsQuery.loading}
        onFilterChange={setFilter}
        onRefresh={handleRefresh}
      />

      {skillsQuery.error && (
        <Alert type="error" message={skillsQuery.error} className="skills-error-alert" />
      )}

      <SkillsGroups
        busyKey={busyKey}
        collapseDefaultOpen={collapseDefaultOpen}
        editingKeys={editingKeys}
        filteredCount={filtered.length}
        groups={groups}
        messages={messages}
        onEditKey={handleEditKey}
        onInstall={handleInstall}
        onSaveKey={handleSaveKey}
        onToggle={handleToggle}
      />
    </Card>
  );
}
