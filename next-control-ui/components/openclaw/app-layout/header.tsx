"use client";

import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import { useRouter } from "next/navigation";
import { useMemo, type CSSProperties } from "react";
import type { TabDefinition, TabGroupKey } from "@/components/openclaw/navigation";
import { tabs } from "@/components/openclaw/navigation";
import { HeaderActions } from "./header-actions";
import { PageTitle } from "./page-title";
import { StatusBadges } from "./status-badges";

const { Header } = Layout;

// ============================================================================
// 类型定义
// ============================================================================

type HelloResponse = {
  server?: {
    version?: string | null;
  };
} | null;

type PresenceEntry = Record<string, unknown>;

export interface AppHeaderProps {
  /** 当前激活的标签页 */
  activeTab: TabDefinition;
  /** 是否已连接 */
  connected: boolean;
  /** 是否正在连接 */
  connecting: boolean;
  /** Hello 响应数据 */
  hello?: HelloResponse;
  /** 在线实例列表 */
  presenceEntries: PresenceEntry[];
  /** 当前主题 */
  theme: string;
  /** 切换主题 */
  onThemeChange: () => void;
  /** 导航栏是否折叠 */
  navCollapsed: boolean;
  /** 切换导航栏折叠状态 */
  onNavCollapseToggle: () => void;
  /** 连接操作 */
  onConnect: () => void;
  /** 断开连接操作 */
  onDisconnect: () => void;
  /** 打开移动端导航 */
  onMobileNavOpen: () => void;
  /** 是否显示顶部导航 */
  showTopNav: boolean;
  /** 自定义样式 */
  style?: CSSProperties;
}

// ============================================================================
// 常量
// ============================================================================

/** 顶部导航菜单样式 */
const TOP_NAV_MENU_STYLES: CSSProperties = {
  minWidth: 0,
  flex: "1 1 auto",
  background: "transparent",
  borderBottom: "none",
};

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 构建标签组到默认路径的映射
 * 该映射在每个标签组被点击时提供导航目标路径
 */
function buildGroupDefaultPaths(): Map<TabGroupKey, `/${string}`> {
  const paths: Array<[TabGroupKey, `/${string}`]> = [];

  // 遍历标签组，为每个组找到对应的第一个标签页路径
  const groupKeys: TabGroupKey[] = ["chat", "control", "agent", "settings"];
  for (const groupKey of groupKeys) {
    const defaultTab = tabs.find((tab) => tab.group === groupKey);
    paths.push([groupKey, defaultTab?.path ?? "/chat"]);
  }

  return new Map(paths);
}

// 预构建标签组路径映射（常量，不随渲染变化）
const GROUP_DEFAULT_PATHS = buildGroupDefaultPaths();

/**
 * 构建顶部菜单项
 * 为每个标签组创建菜单项
 */
function buildTopMenuItems(): MenuProps["items"] {
  return [
    { key: "chat", label: "对话" },
    { key: "control", label: "控制" },
    { key: "agent", label: "代理" },
    { key: "settings", label: "设置" },
  ];
}

// 预构建顶部菜单项（常量，不随渲染变化）
const TOP_MENU_ITEMS = buildTopMenuItems();

// ============================================================================
// 组件
// ============================================================================

export function AppHeader({
  activeTab,
  connected,
  connecting,
  hello,
  presenceEntries,
  theme,
  onThemeChange,
  navCollapsed,
  onNavCollapseToggle,
  onConnect,
  onDisconnect,
  onMobileNavOpen,
  showTopNav,
  style,
}: AppHeaderProps) {
  const router = useRouter();

  // 获取当前激活的标签组
  const activeGroup = useMemo(() => {
    const groups: Array<{ key: TabGroupKey; title: string }> = [
      { key: "chat", title: "对话" },
      { key: "control", title: "控制" },
      { key: "agent", title: "代理" },
      { key: "settings", title: "设置" },
    ];
    return groups.find((group) => group.key === activeTab.group) ?? groups[0];
  }, [activeTab.group]);

  /**
   * 处理菜单点击事件
   * 导航到被点击标签组的默认路径
   */
  const handleMenuClick = ({ key }: { key: string }) => {
    const path = GROUP_DEFAULT_PATHS.get(key as TabGroupKey);
    if (path) {
      router.push(path);
    }
  };

  return (
    <Header className="control-header" style={style}>
      <div className="control-header-bar">
        {/* 左侧：页面标题 */}
        <div className="control-header-main">
          <PageTitle
            activeTab={activeTab}
            activeGroup={activeGroup}
            onMobileNavOpen={onMobileNavOpen}
          />
        </div>

        {/* 中间：顶部导航菜单（条件渲染） */}
        {showTopNav ? (
          <Menu
            mode="horizontal"
            selectedKeys={[activeGroup.key]}
            items={TOP_MENU_ITEMS}
            onClick={handleMenuClick}
            className="control-top-nav"
            style={{
              ...TOP_NAV_MENU_STYLES,
              display: "flex",
              alignItems: "center",
            }}
          />
        ) : null}

        {/* 右侧：操作按钮和状态徽章 */}
        <HeaderActions
          theme={theme}
          onThemeChange={onThemeChange}
          navCollapsed={navCollapsed}
          onNavCollapseToggle={onNavCollapseToggle}
          connected={connected}
          connecting={connecting}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        >
          <StatusBadges
            connected={connected}
            connecting={connecting}
            presenceEntriesCount={presenceEntries.length}
            version={hello?.server?.version}
          />
        </HeaderActions>
      </div>
    </Header>
  );
}
