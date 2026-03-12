"use client";

import { Alert, Button, Empty, Switch, Tag, Typography } from "antd";
import { JsonBlock } from "@/components/views/dashboard-utils";
import { DEFAULT_PROFILE_OPTIONS, isToolAllowed } from "@/components/views/tools-policy-utils";
import type { ToolsTabProps } from "./types";

export function ToolsTab({
  tools,
  toolsError,
  toolsLoading,
  configSnapshot,
  configGlobalTools,
  agentConfigEntry,
  effectiveToolsProfile,
  effectiveToolsAlsoAllow,
  effectiveToolsDeny,
  hasAgentAllow,
  toolsDirty,
  configSaving,
  enabledToolCount,
  totalToolCount,
  profileOptionsFromApi,
  onConfigReload,
  onToolsPreset,
  onToolsEnableAll,
  onToolsDisableAll,
  onToolToggle,
  onToolsSave,
}: ToolsTabProps) {
  const toolCatalogGroups = tools?.groups ?? [];

  return (
    <div className="agents-tools-wrap">
      {/* 卡片 1：工具访问 + 快捷预设 */}
      <div className="agent-panel-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h3 className="agent-panel-title">工具访问</h3>
            <p className="agent-panel-sub">
              Profile + 本代理每工具覆盖。
              {totalToolCount > 0 ? `${enabledToolCount}/${totalToolCount} 已启用。` : ""}
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Button
              size="small"
              disabled={hasAgentAllow || !tools?.groups?.length}
              onClick={onToolsEnableAll}
            >
              启用全部
            </Button>
            <Button
              size="small"
              disabled={hasAgentAllow || !tools?.groups?.length}
              onClick={onToolsDisableAll}
            >
              禁用全部
            </Button>
            <Button size="small" disabled={toolsLoading} onClick={onConfigReload}>
              重载配置
            </Button>
            <Button
              type="primary"
              size="small"
              loading={configSaving}
              disabled={!toolsDirty || hasAgentAllow}
              onClick={() => onToolsSave()}
            >
              {configSaving ? "保存中…" : "保存"}
            </Button>
          </div>
        </div>
        {toolsError && (
          <Alert type="warning" title={toolsError} style={{ marginTop: 12, marginBottom: 0 }} />
        )}
        {hasAgentAllow && (
          <Alert
            type="info"
            title="当前代理使用显式 allow 列表，此处不可编辑；请在配置中修改。"
            style={{ marginTop: 12, marginBottom: 0 }}
          />
        )}
        {(configSnapshot || tools) &&
          !hasAgentAllow &&
          (() => {
            const globalProfile =
              (configGlobalTools as { profile?: string } | undefined)?.profile ?? "full";
            const toolsInherit =
              effectiveToolsProfile === globalProfile &&
              effectiveToolsAlsoAllow.length === 0 &&
              effectiveToolsDeny.length === 0;
            return (
              <div className="agents-overview-grid" style={{ marginTop: 12 }}>
                <div className="agent-kv">
                  <span className="agent-kv-label">配置集</span>
                  <span className="agent-kv-value">
                    {toolsInherit ? "继承" : effectiveToolsProfile}
                  </span>
                </div>
                <div className="agent-kv">
                  <span className="agent-kv-label">来源</span>
                  <span className="agent-kv-value">
                    {(agentConfigEntry as { tools?: { profile?: string } } | undefined)?.tools
                      ?.profile
                      ? "代理覆盖"
                      : (configGlobalTools as { profile?: string } | undefined)?.profile
                        ? "全局默认"
                        : "默认"}
                  </span>
                </div>
                <div className="agent-kv">
                  <span className="agent-kv-label">状态</span>
                  <span className="agent-kv-value">{toolsDirty ? "未保存" : "已保存"}</span>
                </div>
              </div>
            );
          })()}
        {/* 同卡内：快捷预设 */}
        {!hasAgentAllow && (tools?.profiles?.length || DEFAULT_PROFILE_OPTIONS.length) > 0 && (
          <div style={{ marginTop: 20 }}>
            <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
              快捷预设
            </Typography.Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {profileOptionsFromApi.map((p) => (
                <Button
                  key={p.id}
                  size="small"
                  type={effectiveToolsProfile === p.id ? "primary" : "default"}
                  onClick={() => onToolsPreset(p.id)}
                >
                  {p.label}
                </Button>
              ))}
              <Button
                size="small"
                type={
                  effectiveToolsProfile ===
                    ((configGlobalTools as { profile?: string } | undefined)?.profile ?? "full") &&
                  effectiveToolsAlsoAllow.length === 0 &&
                  effectiveToolsDeny.length === 0
                    ? "primary"
                    : "default"
                }
                onClick={() => onToolsPreset("inherit")}
              >
                继承
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 每个工具分类单独一张卡片 */}
      {toolCatalogGroups.length > 0 &&
        toolCatalogGroups.map((group) => (
          <div key={group.id} className="agent-panel-card">
            <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
              {group.label}
            </Typography.Text>
            <div className="agents-tools-group-grid">
              {(group.tools ?? []).map((tool) => {
                const { allowed } = isToolAllowed({
                  toolId: tool.id,
                  profile: effectiveToolsProfile,
                  defaultProfiles: tool.defaultProfiles,
                  alsoAllow: effectiveToolsAlsoAllow,
                  deny: effectiveToolsDeny,
                });
                const sourceLabel =
                  (group as { source?: string }).source === "plugin" ? "plugin" : "core";
                return (
                  <div key={tool.id} className="agents-tool-item-card">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13 }}>
                        <code style={{ marginRight: 6 }}>{tool.id}</code>
                        <Tag style={{ fontSize: 11 }}>{sourceLabel}</Tag>
                      </div>
                      <div
                        style={{
                          color: "rgba(15,23,42,0.55)",
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {tool.description ?? tool.label ?? tool.id}
                      </div>
                    </div>
                    <Switch
                      size="small"
                      checked={allowed}
                      disabled={hasAgentAllow}
                      onChange={(checked) => onToolToggle(tool.id, checked)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      {tools && !tools.groups?.length && !toolsLoading && (
        <div className="agent-panel-card">
          <JsonBlock value={tools} height={280} />
        </div>
      )}
      {!tools && !toolsLoading && (
        <div className="agent-panel-card">
          <Empty description="暂无工具目录" />
        </div>
      )}
    </div>
  );
}
