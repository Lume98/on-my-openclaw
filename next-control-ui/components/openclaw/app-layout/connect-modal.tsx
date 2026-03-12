"use client";

import { Input, Modal, Select, Space, Typography } from "antd";
import type { UiSettings } from "@/components/openclaw/types";

type ConnectModalProps = {
  open: boolean;
  settings: Pick<UiSettings, "gatewayUrl" | "token" | "sessionKey" | "locale">;
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
      width={440}
    >
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <div className="control-field-label">网关地址</div>
          <Input
            value={settings.gatewayUrl}
            onChange={(e) => onSettingsChange({ gatewayUrl: e.target.value })}
            placeholder="ws://localhost:8789"
          />
        </div>
        <div>
          <div className="control-field-label">网关令牌</div>
          <Input
            value={settings.token}
            onChange={(e) => onSettingsChange({ token: e.target.value })}
            placeholder="可选，openclaw doctor --generate-gateway-token 生成"
          />
        </div>
        <div>
          <div className="control-field-label">密码（不存储）</div>
          <Input.Password
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="选填"
            autoComplete="off"
          />
        </div>
        <div>
          <div className="control-field-label">默认会话密钥</div>
          <Input
            value={settings.sessionKey}
            onChange={(e) => {
              const v = e.target.value.trim() || "main";
              onSettingsChange({ sessionKey: v, lastActiveSessionKey: v });
            }}
            placeholder="agent:main:main"
          />
        </div>
        <div>
          <div className="control-field-label">语言</div>
          <Select
            value={settings.locale ?? "zh-CN"}
            onChange={(value) => onSettingsChange({ locale: value })}
            style={{ width: "100%" }}
            options={[
              { label: "简体中文", value: "zh-CN" },
              { label: "English", value: "en-US" },
            ]}
          />
        </div>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          仅在你信任该网关地址时连接。可通过带 token 的仪表盘链接或 CLI 生成令牌。
        </Typography.Text>
      </Space>
    </Modal>
  );
}
