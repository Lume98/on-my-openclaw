"use client";

import { Modal, Space, Typography } from "antd";

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
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Typography.Text>检测到地址参数请求切换到新的网关：</Typography.Text>
        <Typography.Paragraph copyable style={{ marginBottom: 0 }}>
          {pendingGatewayUrl ?? ""}
        </Typography.Paragraph>
        <Typography.Text type="secondary">
          仅在你信任这个地址时确认。切换后会使用该地址对应的会话令牌并重新连接。
        </Typography.Text>
      </Space>
    </Modal>
  );
}
