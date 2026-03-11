"use client";

import { Input, Modal, Space } from "antd";
import type { UiSettings } from "@/components/openclaw/types";

type ConnectModalProps = {
  open: boolean;
  settings: Pick<UiSettings, "gatewayUrl" | "token">;
  password: string;
  onSettingsChange: (patch: Partial<UiSettings>) => void;
  onPasswordChange: (value: string) => void;
  onConnect: () => void;
  onCancel: () => void;
  connecting: boolean;
};

export function ConnectModal({
  open,
  settings,
  password,
  onSettingsChange,
  onPasswordChange,
  onConnect,
  onCancel,
  connecting,
}: ConnectModalProps) {
  return (
    <Modal
      title="连接 OpenClaw 网关"
      open={open}
      onCancel={onCancel}
      onOk={() => {
        onConnect();
        onCancel();
      }}
      okText="连接"
      cancelText="取消"
      okButtonProps={{ loading: connecting }}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <div className="control-field-label">网关地址</div>
          <Input
            value={settings.gatewayUrl}
            onChange={(event) => onSettingsChange({ gatewayUrl: event.target.value })}
            placeholder="ws://localhost:8789"
          />
        </div>
        <div>
          <div className="control-field-label">令牌</div>
          <Input
            value={settings.token}
            onChange={(event) => onSettingsChange({ token: event.target.value })}
            placeholder="可选，用于共享令牌连接"
          />
        </div>
        <div>
          <div className="control-field-label">密码</div>
          <Input.Password
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="可选，用于密码认证"
          />
        </div>
      </Space>
    </Modal>
  );
}
