"use client";

import { Button, Input, Select, Typography } from "antd";
import {
  getConfiguredModelOptions,
  parseFallbackList,
} from "@/components/views/agents-config-utils";
import type { OverviewTabProps } from "./types";

export function OverviewTab({
  workspace,
  primaryModel,
  identityName,
  identityEmoji,
  skillsFilter,
  defaultId,
  selectedAgent,
  configSnapshot,
  configLoading,
  configSaving,
  effectivePrimary,
  defaultPrimary,
  fallbackText,
  overviewConfigDirty,
  onConfigReload,
  onOverviewModelSave,
  onModelPrimaryChange,
  onModelFallbacksChange,
}: OverviewTabProps) {
  return (
    <div className="agent-panel-card">
      <h3 className="agent-panel-title">概览</h3>
      <p className="agent-panel-sub">工作区路径与身份信息。</p>
      <div className="agents-overview-grid" style={{ marginTop: 16 }}>
        <div className="agent-kv">
          <span className="agent-kv-label">工作区</span>
          <span className="agent-kv-value">{workspace}</span>
        </div>
        <div className="agent-kv">
          <span className="agent-kv-label">主模型</span>
          <span className="agent-kv-value">{primaryModel}</span>
        </div>
        <div className="agent-kv">
          <span className="agent-kv-label">身份名称</span>
          <span className="agent-kv-value">{identityName}</span>
        </div>
        <div className="agent-kv">
          <span className="agent-kv-label">默认代理</span>
          <span className="agent-kv-value">{defaultId === selectedAgent?.id ? "是" : "否"}</span>
        </div>
        <div className="agent-kv">
          <span className="agent-kv-label">身份 Emoji</span>
          <span className="agent-kv-value">{identityEmoji}</span>
        </div>
        <div className="agent-kv">
          <span className="agent-kv-label">技能筛选</span>
          <span className="agent-kv-value">{skillsFilter}</span>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
          模型选择
        </Typography.Text>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <div style={{ minWidth: 260, flex: "1 1 260px" }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>
              主模型
              {defaultId === selectedAgent?.id ? "（默认）" : ""}
            </label>
            <Select
              style={{ width: "100%" }}
              placeholder="继承默认"
              allowClear
              value={effectivePrimary === null ? "__inherit__" : effectivePrimary || undefined}
              disabled={!configSnapshot || configLoading || configSaving}
              options={[
                ...(defaultId !== selectedAgent?.id && defaultPrimary
                  ? [
                      {
                        value: "__inherit__",
                        label: `继承默认（${defaultPrimary}）`,
                      },
                    ]
                  : []),
                ...getConfiguredModelOptions(configSnapshot, effectivePrimary ?? null).map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
              ]}
              onChange={(v) =>
                onModelPrimaryChange(v === undefined || v === "__inherit__" ? null : v)
              }
            />
          </div>
          <div style={{ minWidth: 260, flex: "1 1 260px" }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>
              备用模型（逗号分隔）
            </label>
            <Input
              placeholder="provider/model, provider/model"
              value={fallbackText}
              disabled={!configSnapshot || configLoading || configSaving}
              onChange={(e) => onModelFallbacksChange(parseFallbackList(e.target.value))}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button size="small" disabled={configLoading} onClick={onConfigReload}>
            重载配置
          </Button>
          <Button
            type="primary"
            size="small"
            loading={configSaving}
            disabled={!overviewConfigDirty}
            onClick={() => onOverviewModelSave()}
          >
            {configSaving ? "保存中…" : "保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}
