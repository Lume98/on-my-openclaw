import type { ChatMessage } from "@/components/types";

export function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return "";
        }
        const text = (entry as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

export function normalizeChatMessage(message: unknown, fallbackId: string): ChatMessage | null {
  if (!message || typeof message !== "object") {
    return null;
  }

  const entry = message as Record<string, unknown>;
  const roleValue = entry.role;
  const role =
    roleValue === "assistant" ||
    roleValue === "system" ||
    roleValue === "tool" ||
    roleValue === "user"
      ? roleValue
      : "assistant";
  const text =
    typeof entry.text === "string"
      ? entry.text
      : extractTextFromContent(entry.content) || JSON.stringify(message);

  return {
    id: typeof entry.id === "string" ? entry.id : fallbackId,
    role,
    text,
    timestamp: typeof entry.timestamp === "number" ? entry.timestamp : Date.now(),
    raw: message,
  };
}
