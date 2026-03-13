"use client";

import { Button, Input, Typography } from "@/components/page-views/shared/dashboard-utils";

const { Text } = Typography;

type SkillsToolbarProps = {
  connected: boolean;
  count: number;
  filter: string;
  loading: boolean;
  onFilterChange: (value: string) => void;
  onRefresh: () => void;
};

export function SkillsToolbar({
  connected,
  count,
  filter,
  loading,
  onFilterChange,
  onRefresh,
}: SkillsToolbarProps) {
  return (
    <>
      <div className="skills-section-head">
        <div>
          <div className="skills-section-title">Skills</div>
          <div className="skills-section-sub">Bundled, managed, and workspace skills.</div>
        </div>
        <Button onClick={onRefresh} loading={loading} disabled={!connected}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      <div className="skills-filter-row">
        <label className="skills-filter-label">
          <span>Filter</span>
          <Input
            placeholder="Search skills"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            allowClear
            className="skills-filter-input"
          />
        </label>
        <Text type="secondary" className="skills-filter-count">
          {count} shown
        </Text>
      </div>
    </>
  );
}
