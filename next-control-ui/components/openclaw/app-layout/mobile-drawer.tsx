"use client";

import { Drawer } from "antd";
import Link from "next/link";
import type { ReactNode } from "react";

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function MobileDrawer({ open, onClose, children }: MobileDrawerProps) {
  return (
    <Drawer
      placement="left"
      open={open}
      onClose={onClose}
      size={280}
      title={
        <Link href="/chat" onClick={onClose}>
          OpenClaw
        </Link>
      }
    >
      {children}
    </Drawer>
  );
}
