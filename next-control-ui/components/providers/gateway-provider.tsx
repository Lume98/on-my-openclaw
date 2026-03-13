"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useSettings } from "@/components/providers/settings-provider";
import { readConnectErrorDetailCode } from "@/lib/connect-error-details";
import { GatewayBrowserClient } from "@/lib/gateway";
import type { GatewayEventFrame, GatewayHelloOk, PresenceEntry } from "@/lib/types";

type GatewayEventListener = (event: GatewayEventFrame) => void;

type GatewayContextValue = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  connecting: boolean;
  hello: GatewayHelloOk | null;
  lastError: string | null;
  lastErrorCode: string | null;
  presenceEntries: PresenceEntry[];
  eventLog: Array<{ ts: number; event: string; payload?: unknown }>;
  connect: () => void;
  disconnect: () => void;
  request: <T = unknown>(method: string, params?: unknown) => Promise<T>;
  subscribe: (listener: GatewayEventListener) => () => void;
  refreshPresence: () => Promise<void>;
};

const GatewayContext = createContext<GatewayContextValue | null>(null);

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return String(error);
}

export function GatewayProvider({ children }: PropsWithChildren) {
  const { settings, password, settingsHydrated } = useSettings();
  const [client, setClient] = useState<GatewayBrowserClient | null>(null);
  const hasAutoConnectedRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [hello, setHello] = useState<GatewayHelloOk | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [presenceEntries, setPresenceEntries] = useState<PresenceEntry[]>([]);
  const [eventLog, setEventLog] = useState<Array<{ ts: number; event: string; payload?: unknown }>>(
    [],
  );
  const [instanceId] = useState(() => `next-control-ui-${crypto.randomUUID()}`);
  const listenersRef = useRef(new Set<GatewayEventListener>());
  const clientRef = useRef<GatewayBrowserClient | null>(null);

  const disconnect = useCallback(() => {
    clientRef.current?.stop();
    clientRef.current = null;
    setClient(null);
    setConnected(false);
    setConnecting(false);
  }, []);

  const connect = useCallback(() => {
    if (connecting) {
      return;
    }

    disconnect();
    setConnecting(true);
    setLastError(null);
    setLastErrorCode(null);
    setHello(null);

    const nextClient = new GatewayBrowserClient({
      url: settings.gatewayUrl,
      token: settings.token.trim() || undefined,
      password: password.trim() || undefined,
      clientName: "openclaw-control-ui",
      clientVersion: "next-control-ui",
      mode: "webchat",
      instanceId,
      onHello: (payload) => {
        setClient(nextClient);
        setConnected(true);
        setConnecting(false);
        setLastError(null);
        setLastErrorCode(null);
        setHello(payload);

        const snapshot = payload.snapshot as { presence?: PresenceEntry[] } | undefined;
        setPresenceEntries(Array.isArray(snapshot?.presence) ? snapshot.presence : []);
      },
      onClose: ({ error, code, reason }) => {
        setConnected(false);
        setConnecting(false);
        setLastErrorCode(readConnectErrorDetailCode(error?.details) ?? error?.code ?? null);
        if (error?.message) {
          setLastError(error.message);
          return;
        }
        if (code !== 1000) {
          setLastError(`连接已关闭（${code}）：${reason || "未提供原因"}`);
        }
      },
      onGap: ({ expected, received }) => {
        setLastError(`事件序号出现跳跃，期望 ${expected}，实际 ${received}。建议刷新页面。`);
        setLastErrorCode(null);
      },
      onEvent: (event) => {
        setEventLog((current) =>
          [{ ts: Date.now(), event: event.event, payload: event.payload }, ...current].slice(
            0,
            120,
          ),
        );

        if (event.event === "presence") {
          const payload = event.payload as { presence?: PresenceEntry[] } | undefined;
          if (Array.isArray(payload?.presence)) {
            setPresenceEntries(payload.presence);
          }
        }

        for (const listener of listenersRef.current) {
          listener(event);
        }
      },
    });

    clientRef.current = nextClient;
    nextClient.start();
  }, [connecting, disconnect, instanceId, password, settings.gatewayUrl, settings.token]);

  const request = useCallback(async <T,>(method: string, params?: unknown) => {
    if (!clientRef.current) {
      throw new Error("网关尚未连接");
    }
    return await clientRef.current.request<T>(method, params);
  }, []);

  const subscribe = useCallback((listener: GatewayEventListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const refreshPresence = useCallback(async () => {
    try {
      const payload = await request<{ presence?: PresenceEntry[] } | PresenceEntry[]>(
        "system-presence",
        {},
      );
      if (Array.isArray(payload)) {
        setPresenceEntries(payload);
        return;
      }

      setPresenceEntries(Array.isArray(payload?.presence) ? payload.presence : []);
    } catch (error) {
      setLastError(getErrorMessage(error));
    }
  }, [request]);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  // 设置加载完成后自动连接一次，避免每次刷新都要手动点连接
  useEffect(() => {
    if (!settingsHydrated || hasAutoConnectedRef.current) {
      return;
    }
    if (!settings.gatewayUrl?.trim()) {
      return;
    }
    hasAutoConnectedRef.current = true;
    connect();
  }, [settingsHydrated, settings.gatewayUrl, connect]);

  const value = useMemo<GatewayContextValue>(
    () => ({
      client,
      connected,
      connecting,
      hello,
      lastError,
      lastErrorCode,
      presenceEntries,
      eventLog,
      connect,
      disconnect,
      request,
      subscribe,
      refreshPresence,
    }),
    [
      client,
      connect,
      connected,
      connecting,
      disconnect,
      eventLog,
      hello,
      lastError,
      lastErrorCode,
      presenceEntries,
      refreshPresence,
      request,
      subscribe,
    ],
  );

  return <GatewayContext.Provider value={value}>{children}</GatewayContext.Provider>;
}

export function useGateway() {
  const context = useContext(GatewayContext);
  if (!context) {
    throw new Error("useGateway must be used within GatewayProvider");
  }

  return context;
}
