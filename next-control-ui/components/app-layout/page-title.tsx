"use client";

import { Button, Grid, Typography } from "antd";
import { Icon } from "@/components/icons";
import type { TabDefinition } from "@/components/navigation";

const { useBreakpoint } = Grid;
const { Text, Title } = Typography;

type TabGroup = {
  key: string;
  title: string;
};

type PageTitleProps = {
  activeTab: TabDefinition;
  activeGroup: TabGroup;
  onMobileNavOpen?: () => void;
};

export function PageTitle({ activeTab, activeGroup, onMobileNavOpen }: PageTitleProps) {
  const screens = useBreakpoint();

  return (
    <div className="control-page-copy">
      {!screens.lg && onMobileNavOpen ? (
        <Button type="text" onClick={onMobileNavOpen} icon={<Icon name="menu" size={18} />} />
      ) : null}
      <Text type="secondary">{activeGroup.title}</Text>
      <Title level={2} style={{ margin: 0, lineHeight: "1.2" }}>
        {activeTab.title}
      </Title>
      <Text type="secondary">{activeTab.subtitle}</Text>
    </div>
  );
}
