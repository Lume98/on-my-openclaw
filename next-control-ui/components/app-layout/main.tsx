"use client";

import { Breadcrumb, Layout, Tag, theme } from "antd";
import { useMemo, type CSSProperties, type ReactNode } from "react";
import type { TabDefinition } from "@/components/navigation";
import { tabGroups } from "@/components/navigation";

const { Content } = Layout;

type MainProps = {
  children: ReactNode;
  activeTab: TabDefinition;
  lastError?: string | null;
  style?: CSSProperties;
  contentSurfaceStyle?: CSSProperties;
  /** 为 true 时不渲染最外层边框/背景容器，仅保留面包屑与内容 */
  skipSurface?: boolean;
};

export function Main({
  children,
  activeTab,
  lastError,
  style,
  contentSurfaceStyle,
  skipSurface,
}: MainProps) {
  const activeGroup = useMemo(
    () => tabGroups.find((group) => group.key === activeTab.group) ?? tabGroups[0],
    [activeTab.group],
  );

  const {
    token: { colorBgContainer, colorBorderSecondary },
  } = theme.useToken();

  const breadcrumbItems = useMemo(
    () => [{ title: "OpenClaw" }, { title: activeGroup.title }, { title: activeTab.title }],
    [activeGroup.title, activeTab.title],
  );

  const inner = (
    <>
      {lastError ? (
        <div className="control-inline-alert">
          <Tag color="error">连接错误</Tag>
          <span>{lastError}</span>
        </div>
      ) : null}
      <div className="control-content-wrap">{children}</div>
    </>
  );

  const surfacePadding = contentSurfaceStyle?.padding ?? "20px";

  return (
    <Content className="control-content" style={style}>
      <Breadcrumb className="control-breadcrumb" items={breadcrumbItems} />
      {skipSurface ? (
        <div
          className="control-content-skip-surface"
          style={{ paddingTop: surfacePadding, paddingBottom: surfacePadding }}
        >
          {inner}
        </div>
      ) : (
        <div
          className="control-content-surface"
          style={{
            background: contentSurfaceStyle?.background ?? colorBgContainer,
            border: contentSurfaceStyle?.border ?? `1px solid ${colorBorderSecondary}`,
            borderRadius: contentSurfaceStyle?.borderRadius ?? "8px",
            boxShadow:
              contentSurfaceStyle?.boxShadow ??
              "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
            padding: surfacePadding,
          }}
        >
          {inner}
        </div>
      )}
    </Content>
  );
}
