"use client";

import { Alert, Modal, Space, Typography } from "antd";

type ConfirmGatewayModalProps = {
  pendingGatewayUrl: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmGatewayModal({
  pendingGatewayUrl,
  onConfirm,
  onCancel,
}: ConfirmGatewayModalProps) {
  return (
    <Modal
      title="确认切换网关地址"
      open={Boolean(pendingGatewayUrl)}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="确认切换"
      cancelText="取消"
    >
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Typography.Text>检测到地址参数请求切换到新的网关：</Typography.Text>
        <Typography.Paragraph copyable style={{ marginBottom: 0 }}>
          {pendingGatewayUrl ?? ""}
        </Typography.Paragraph>
        <Alert
          type="warning"
          showIcon
          message="安全提示"
          description="仅在你信任该地址时确认。恶意地址可能危害你的系统。切换后将使用该地址对应的会话令牌并重新连接。"
        />
      </Space>
    </Modal>
  );
}
