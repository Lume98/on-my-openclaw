"use client";

import { Alert, Button, Input, Spin, Typography } from "antd";
import type { FilesTabProps } from "./types";
import { formatBytes, formatRelative } from "./utils";

interface AgentFile {
  name: string;
  size?: number;
  updatedAtMs?: number;
  missing?: boolean;
}

export function FilesTab({
  files,
  filesLoading,
  filesError,
  activeFileName,
  fileContents,
  fileDrafts,
  fileLoading,
  fileSaving,
  fileLoadError,
  workspace,
  agentId,
  onRefresh,
  onFileSelect,
  onFileDraftChange,
  onFileReset,
  onFileSave,
}: FilesTabProps) {
  const agentFiles: AgentFile[] = files?.agentId === agentId ? (files.files ?? []) : [];
  const activeContent = activeFileName ? (fileContents[activeFileName] ?? "") : "";
  const activeDraft = activeFileName ? (fileDrafts[activeFileName] ?? activeContent) : "";
  const isDirty = activeFileName ? activeDraft !== activeContent : false;

  return (
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
          <h3 className="agent-panel-title">核心文件</h3>
          <p className="agent-panel-sub">引导人格、身份与工具说明。</p>
        </div>
        <Button size="small" loading={filesLoading} onClick={onRefresh}>
          刷新
        </Button>
      </div>
      {files?.agentId === agentId && (
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 12,
            color: "rgba(15,23,42,0.55)",
            fontFamily: "var(--font-mono)",
          }}
        >
          工作区：{workspace}
        </p>
      )}
      {filesError && <Alert type="error" title={filesError} style={{ marginBottom: 12 }} />}
      {!files && !filesLoading && agentId && (
        <p style={{ fontSize: 13, color: "rgba(15,23,42,0.55)" }}>
          点击 Refresh 加载代理工作区文件列表。
        </p>
      )}
      {files?.agentId === agentId && agentFiles.length > 0 && (
        <div className="agent-files-grid">
          <div className="agent-files-list">
            {agentFiles.map((file) => (
              <button
                key={file.name}
                type="button"
                className={`agent-file-row ${activeFileName === file.name ? "active" : ""}`}
                onClick={() => onFileSelect(file.name)}
              >
                <span className="agent-file-name">{file.name}</span>
                <span className="agent-file-meta">
                  {file.missing
                    ? "Missing"
                    : `${formatBytes(file.size)} · ${formatRelative(file.updatedAtMs)}`}
                </span>
              </button>
            ))}
          </div>
          <div className="agent-files-editor" style={{ minHeight: 280, display: "block" }}>
            {!activeFileName ? (
              <p className="agent-files-editor-placeholder">选择要编辑的文件。</p>
            ) : fileLoading ? (
              <Spin />
            ) : (
              <>
                {fileLoadError && (
                  <Alert type="error" title={fileLoadError} style={{ marginBottom: 12 }} />
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Typography.Text strong code>
                    {activeFileName}
                  </Typography.Text>
                  <span style={{ display: "flex", gap: 8 }}>
                    <Button size="small" disabled={!isDirty} onClick={onFileReset}>
                      重置
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      loading={fileSaving}
                      disabled={!isDirty}
                      onClick={() => onFileSave()}
                    >
                      {fileSaving ? "保存中…" : "保存"}
                    </Button>
                  </span>
                </div>
                <Input.TextArea
                  value={activeDraft}
                  onChange={(e) => onFileDraftChange(e.target.value)}
                  rows={14}
                  style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
                />
              </>
            )}
          </div>
        </div>
      )}
      {files?.agentId === agentId && agentFiles.length === 0 && !filesLoading && (
        <p style={{ marginTop: 16, fontSize: 13, color: "rgba(15,23,42,0.55)" }}>未找到文件。</p>
      )}
    </div>
  );
}
