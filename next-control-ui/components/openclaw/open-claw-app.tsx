"use client";

import { ChatPanel } from "@/components/openclaw/panels/chat-panel";

export type OpenClawAppProps = Record<string, never>;

export function OpenClawApp(): React.JSX.Element {
  return <ChatPanel />;
}

export default OpenClawApp;
