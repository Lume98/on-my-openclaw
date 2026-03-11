import { Badge, Tag } from "antd";
import { CONNECTION_STATUS, HEADER_LABELS } from "./header-constants";

type StatusBadgesProps = {
  connected: boolean;
  connecting: boolean;
  presenceEntriesCount: number;
  version?: string | null;
};

export function StatusBadges({
  connected,
  connecting,
  presenceEntriesCount,
  version,
}: StatusBadgesProps) {
  return (
    <>
      <Tag color={connected ? "success" : connecting ? "processing" : "default"}>
        {connected
          ? CONNECTION_STATUS.CONNECTED
          : connecting
            ? CONNECTION_STATUS.CONNECTING
            : CONNECTION_STATUS.DISCONNECTED}
      </Tag>
      <Badge count={presenceEntriesCount} size="small">
        <Tag color="cyan">{HEADER_LABELS.ONLINE_INSTANCES}</Tag>
      </Badge>
      <Tag color="geekblue">
        {HEADER_LABELS.VERSION} {version ?? HEADER_LABELS.UNKNOWN}
      </Tag>
    </>
  );
}
