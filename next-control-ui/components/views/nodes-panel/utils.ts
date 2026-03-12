import type { DevicePairingList } from "@/components/types";

export function normalizeDevicePairingList(payload: unknown): DevicePairingList {
  if (!payload || typeof payload !== "object") {
    return { pending: [], paired: [] };
  }

  const entry = payload as { pending?: unknown; paired?: unknown };
  return {
    pending: Array.isArray(entry.pending) ? (entry.pending as DevicePairingList["pending"]) : [],
    paired: Array.isArray(entry.paired) ? (entry.paired as DevicePairingList["paired"]) : [],
  };
}

export function normalizeNodesPayload(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload.filter((entry): entry is Record<string, unknown> =>
      Boolean(entry && typeof entry === "object"),
    );
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const nodes = (payload as { nodes?: unknown }).nodes;
  return Array.isArray(nodes)
    ? nodes.filter((entry): entry is Record<string, unknown> =>
        Boolean(entry && typeof entry === "object"),
      )
    : [];
}
