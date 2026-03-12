"use client";

import { DownOutlined, RightOutlined } from "@ant-design/icons";
import { Layout } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties } from "react";
import { Icon } from "@/components/icons";
import { getTabByPath, tabGroups, tabs, type TabGroupKey } from "@/components/openclaw/navigation";

const { Sider } = Layout;

type SidebarProps = {
  pathname: string;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  showSider: boolean;
  showContentOnly?: boolean;
  onMenuItemClick?: () => void;
  theme: "light" | "dark";
  style?: CSSProperties;
};

const defaultExpandedGroups: TabGroupKey[] = ["chat", "control", "agent", "settings", "docs"];

export function Sidebar({
  pathname,
  collapsed,
  onCollapse,
  showSider,
  showContentOnly,
  onMenuItemClick,
  theme,
  style,
}: SidebarProps) {
  const router = useRouter();
  const activeTab = useMemo(() => getTabByPath(pathname), [pathname]);

  const [expandedGroups, setExpandedGroups] = useState<TabGroupKey[]>(defaultExpandedGroups);

  const toggleGroup = (key: TabGroupKey) => {
    setExpandedGroups((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleNav = (path: string) => {
    // 处理外部链接
    if (path.startsWith("http")) {
      window.open(path, "_blank", "noreferrer");
      return;
    }
    router.push(path);
    onMenuItemClick?.();
  };

  const sidebarContent = (
    <div className="control-sider-content">
      {/* Logo / Brand */}
      <div className="control-brand">
        <Link href="/chat" className="control-brand-link" onClick={() => onMenuItemClick?.()}>
          <div className="control-brand-badge">OC</div>
          {!collapsed ? (
            <div className="control-brand-copy">
              <span className="control-brand-title">OpenClaw</span>
              <span className="control-brand-subtitle">Gateway Dashboard</span>
            </div>
          ) : null}
        </Link>
      </div>

      {/* Navigation: 展开时按分组折叠展示，收起时仅图标列表 */}
      <nav className="control-nav-menu-wrapper">
        {collapsed ? (
          <div className="control-nav-icons">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleNav(tab.path)}
                className={`control-nav-icon-btn${activeTab.key === tab.key ? " control-nav-icon-btn-active" : ""}`}
                title={tab.title}
              >
                <Icon name={tab.icon} size={18} />
              </button>
            ))}
          </div>
        ) : (
          <div className="control-nav-groups">
            {tabGroups.map((group) => {
              const groupTabs = tabs.filter((t) => t.group === group.key);
              const isExpanded = expandedGroups.includes(group.key);
              const firstTab = groupTabs[0];
              return (
                <div key={group.key} className="control-nav-group">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className={`control-nav-group-btn${isExpanded ? " control-nav-group-btn-expanded" : ""}`}
                  >
                    <span className="control-nav-group-label">
                      {firstTab ? <Icon name={firstTab.icon} size={16} /> : null}
                      <span>{group.title}</span>
                    </span>
                    {isExpanded ? (
                      <DownOutlined className="control-nav-chevron" />
                    ) : (
                      <RightOutlined className="control-nav-chevron" />
                    )}
                  </button>
                  {isExpanded && groupTabs.length > 0 && (
                    <div className="control-nav-children">
                      {groupTabs.map((tab) => {
                        const isActive = activeTab.key === tab.key;
                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => handleNav(tab.path)}
                            className={`control-nav-child${isActive ? " control-nav-child-active" : ""}`}
                          >
                            {tab.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </nav>
    </div>
  );

  if (showContentOnly) {
    return <>{sidebarContent}</>;
  }

  if (!showSider) {
    return null;
  }

  return (
    <Sider
      theme={theme}
      width={232}
      collapsedWidth={88}
      collapsible
      trigger={null}
      collapsed={collapsed}
      onCollapse={onCollapse}
      className="control-sider"
      style={style}
    >
      {sidebarContent}
    </Sider>
  );
}
