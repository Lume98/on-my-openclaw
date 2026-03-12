"use client";

import { ChatPanel } from "@/components/panels/chat-panel";

export type OpenClawAppProps = Record<string, never>;

export function OpenClawApp(): React.JSX.Element {
  return <ChatPanel />;
}

export default OpenClawApp;
