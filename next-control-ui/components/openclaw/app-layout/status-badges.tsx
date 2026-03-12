import { CONNECTION_STATUS, HEADER_LABELS } from "./header-constants";

type StatusBadgesProps = {
  connected: boolean;
  connecting: boolean;
  version?: string | null;
};

export function StatusBadges({ connected, connecting, version }: StatusBadgesProps) {
  const statusText = connected
    ? CONNECTION_STATUS.CONNECTED
    : connecting
      ? CONNECTION_STATUS.CONNECTING
      : CONNECTION_STATUS.DISCONNECTED;

  return (
    <span className="control-header-status">
      <span
        className={`control-header-status-item control-header-status--${connected ? "connected" : connecting ? "connecting" : "disconnected"}`}
      >
        <span className="control-header-status-dot" aria-hidden />
        {statusText}
      </span>
      <span className="control-header-status-item control-header-status--version">
        {HEADER_LABELS.VERSION} {version ?? HEADER_LABELS.UNKNOWN}
      </span>
    </span>
  );
}
