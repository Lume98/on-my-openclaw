"use client";

import { Button, Checkbox, Empty, Input, Space, Spin, Typography } from "antd";
import { useCallback, useMemo, useState } from "react";
import { LOG_LEVELS, parseLogLine } from "@/components/openclaw/panels/logs-parse";
import { useGatewayQuery } from "@/components/openclaw/panels/use-gateway-query";
import { useGateway } from "@/components/openclaw/providers/gateway-provider";
import type { LogEntry, LogsTailPayload } from "@/components/openclaw/types";

const { Text } = Typography;

const DEFAULT_LEVEL_FILTERS: Record<string, boolean> = {
  trace: true,
  debug: true,
  info: true,
  warn: true,
  error: true,
  fatal: true,
};

function formatLogTime(value?: string | null): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString("zh-CN", { hour12: false });
}

function matchesFilter(entry: LogEntry, needle: string): boolean {
  if (!needle) {
    return true;
  }
  const haystack = [entry.message, entry.subsystem, entry.raw]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle.toLowerCase());
}

export function LogsPanel() {
  const { request, connected } = useGateway();
  const [filterText, setFilterText] = useState("");
  const [levelFilters, setLevelFilters] = useState(DEFAULT_LEVEL_FILTERS);
  const [autoFollow, setAutoFollow] = useState(true);

  const logs = useGatewayQuery<LogsTailPayload>(
    useCallback(
      async () =>
        await request<LogsTailPayload>("logs.tail", {
          limit: 400,
          maxBytes: 200000,
        }),
      [request],
    ),
    connected,
  );

  const { entries, file, truncated } = useMemo(() => {
    const payload = logs.data;
    if (!payload) {
      return { entries: [] as LogEntry[], file: null as string | null, truncated: false };
    }
    const lines = Array.isArray(payload.lines)
      ? payload.lines.filter((line) => typeof line === "string")
      : [];
    return {
      entries: lines.map(parseLogLine),
      file: typeof payload.file === "string" ? payload.file : null,
      truncated: Boolean(payload.truncated),
    };
  }, [logs.data]);

  const filteredEntries = useMemo(() => {
    const needle = filterText.trim();
    return entries.filter((entry) => {
      if (entry.level && !levelFilters[entry.level]) {
        return false;
      }
      return matchesFilter(entry, needle);
    });
  }, [entries, filterText, levelFilters]);

  const handleExport = useCallback(() => {
    if (filteredEntries.length === 0) {
      return;
    }
    const lines = filteredEntries.map((e) => e.raw);
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openclaw-logs-${filterText.trim() || "visible"}-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredEntries, filterText]);

  const exportLabel =
    filterText.trim() || Object.values(levelFilters).some((v) => !v) ? "筛选结果" : "可见日志";

  if (!connected) {
    return (
      <div className="logs-page">
        <div className="logs-header">
          <span className="logs-title">网关日志</span>
        </div>
        <Empty description="请先连接网关后查看日志" />
      </div>
    );
  }

  return (
    <div className="logs-page">
      <div className="logs-header">
        <span className="logs-title">网关日志</span>
        <Space>
          <Button onClick={() => void logs.refresh()} loading={logs.loading}>
            刷新
          </Button>
          <Button onClick={handleExport} disabled={filteredEntries.length === 0}>
            导出{exportLabel}
          </Button>
        </Space>
      </div>
      <div className="logs-section-desc">
        <Text type="secondary">网关文件日志（JSONL），按时间和级别筛选。</Text>
      </div>

      <div className="logs-filters">
        <Space wrap align="center" size="middle">
          <label className="logs-filter-field">
            <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>
              筛选
            </Text>
            <Input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="搜索日志"
              allowClear
              style={{ width: 220 }}
            />
          </label>
          <label className="logs-filter-field logs-auto-follow">
            <Checkbox checked={autoFollow} onChange={(e) => setAutoFollow(e.target.checked)} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              自动跟随
            </Text>
          </label>
        </Space>
      </div>

      <div className="logs-level-row">
        {LOG_LEVELS.map((level) => (
          <label key={level} className={`logs-level-chip logs-level--${level}`}>
            <Checkbox
              checked={levelFilters[level]}
              onChange={(e) => setLevelFilters((prev) => ({ ...prev, [level]: e.target.checked }))}
            />
            <span>{level}</span>
          </label>
        ))}
      </div>

      {file ? (
        <div className="logs-file-path">
          <Text type="secondary" style={{ fontSize: 12 }}>
            文件：{file}
          </Text>
        </div>
      ) : null}

      {truncated ? (
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
          日志已截断，仅显示最新一段。
        </Text>
      ) : null}

      {logs.error ? (
        <Text type="danger" style={{ display: "block", marginTop: 8 }}>
          {logs.error}
        </Text>
      ) : null}

      <div className="logs-stream">
        {logs.loading && entries.length === 0 ? (
          <div className="logs-stream-loading">
            <Spin tip="加载日志…" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="logs-stream-empty">
            <Text type="secondary">暂无日志条目</Text>
          </div>
        ) : (
          filteredEntries.map((entry, index) => (
            <div key={`${index}-${entry.raw.slice(0, 40)}`} className="logs-row">
              <span className="logs-time">{formatLogTime(entry.time)}</span>
              <span className={`logs-level logs-level--${entry.level ?? "unknown"}`}>
                {entry.level ?? "—"}
              </span>
              <span className="logs-subsystem">{entry.subsystem ?? "—"}</span>
              <span className="logs-message">{entry.message ?? entry.raw}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
