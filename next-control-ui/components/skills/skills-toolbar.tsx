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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="m-0 text-base font-semibold leading-5 text-[var(--foreground)]">技能</div>
          <div className="mt-1 text-[13px] leading-[1.4] text-slate-500">
            内置、已管理和工作区技能。
          </div>
        </div>
        <Button onClick={onRefresh} loading={loading} disabled={!connected}>
          {loading ? "加载中…" : "刷新"}
        </Button>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-3">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
          <span className="text-[13px] font-medium text-slate-600">筛选</span>
          <Input
            placeholder="搜索技能"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            type="search"
            autoComplete="off"
            name="skills-filter"
            allowClear
          />
        </label>
        <Text type="secondary" className="shrink-0 text-[13px] flex items-center">
          已显示 {count} 项
        </Text>
      </div>
    </>
  );
}
