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
import type { ThemeMode, UiSettings } from "@/components/types";

const settingsStorageKey = "openclaw.next-control.settings.v1";
const legacyTokenSessionKey = "openclaw.control.token.v1";
const tokenSessionKeyPrefix = "openclaw.control.token.v1:";
const fallbackGatewayUrl = "ws://localhost:8789";

type PersistedUiSettings = Omit<UiSettings, "token"> & { token?: never };

type SettingsContextValue = {
  settings: UiSettings;
  password: string;
  resolvedTheme: "light" | "dark";
  pendingGatewayUrl: string | null;
  /** 本地设置是否已从 storage 加载完成 */
  settingsHydrated: boolean;
  applySettings: (patch: Partial<UiSettings>) => void;
  setPassword: (next: string) => void;
  setTheme: (next: ThemeMode) => void;
  confirmPendingGatewayUrlChange: () => void;
  cancelPendingGatewayUrlChange: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function getSessionStorage(): Storage | null {
  if (typeof window !== "undefined" && window.sessionStorage) {
    return window.sessionStorage;
  }

  return null;
}

function normalizeGatewayTokenScope(gatewayUrl: string) {
  const trimmed = gatewayUrl.trim();
  if (!trimmed) {
    return "default";
  }

  try {
    const base =
      typeof location !== "undefined"
        ? `${location.protocol}//${location.host}${location.pathname || "/"}`
        : undefined;
    const parsed = base ? new URL(trimmed, base) : new URL(trimmed);
    const pathname =
      parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "") || parsed.pathname;
    return `${parsed.protocol}//${parsed.host}${pathname}`;
  } catch {
    return trimmed;
  }
}

function tokenSessionKeyForGateway(gatewayUrl: string) {
  return `${tokenSessionKeyPrefix}${normalizeGatewayTokenScope(gatewayUrl)}`;
}

function loadSessionToken(gatewayUrl: string) {
  try {
    const storage = getSessionStorage();
    if (!storage) {
      return "";
    }

    storage.removeItem(legacyTokenSessionKey);
    return (storage.getItem(tokenSessionKeyForGateway(gatewayUrl)) ?? "").trim();
  } catch {
    return "";
  }
}

function persistSessionToken(gatewayUrl: string, token: string) {
  try {
    const storage = getSessionStorage();
    if (!storage) {
      return;
    }

    storage.removeItem(legacyTokenSessionKey);
    const key = tokenSessionKeyForGateway(gatewayUrl);
    const normalized = token.trim();
    if (normalized) {
      storage.setItem(key, normalized);
      return;
    }

    storage.removeItem(key);
  } catch {
    // best-effort
  }
}

function inferDefaultGatewayUrl() {
  if (typeof window === "undefined") {
    return fallbackGatewayUrl;
  }

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}`;
}

function buildDefaultSettings(gatewayUrl: string): UiSettings {
  return {
    gatewayUrl,
    token: "",
    sessionKey: "main",
    lastActiveSessionKey: "main",
    theme: "system",
    chatFocusMode: false,
    chatShowThinking: true,
    splitRatio: 0.6,
    navCollapsed: false,
    navGroupsCollapsed: {},
    locale: "zh-CN",
  };
}

function getInitialSettings(): UiSettings {
  return buildDefaultSettings(fallbackGatewayUrl);
}

function getDefaultSettings(): UiSettings {
  return buildDefaultSettings(inferDefaultGatewayUrl());
}

function loadPersistedSettings(): UiSettings {
  if (typeof window === "undefined") {
    return getDefaultSettings();
  }

  try {
    const raw = window.localStorage.getItem(settingsStorageKey);
    if (!raw) {
      return getDefaultSettings();
    }

    const parsed = JSON.parse(raw) as Partial<UiSettings>;
    const gatewayUrl =
      typeof parsed.gatewayUrl === "string" && parsed.gatewayUrl.trim()
        ? parsed.gatewayUrl.trim()
        : inferDefaultGatewayUrl();
    return {
      ...getDefaultSettings(),
      ...parsed,
      gatewayUrl,
      token: loadSessionToken(gatewayUrl),
      sessionKey:
        typeof parsed.sessionKey === "string" && parsed.sessionKey.trim()
          ? parsed.sessionKey.trim()
          : "main",
      lastActiveSessionKey:
        typeof parsed.lastActiveSessionKey === "string" && parsed.lastActiveSessionKey.trim()
          ? parsed.lastActiveSessionKey.trim()
          : "main",
      navGroupsCollapsed:
        parsed.navGroupsCollapsed && typeof parsed.navGroupsCollapsed === "object"
          ? parsed.navGroupsCollapsed
          : {},
    };
  } catch {
    return getDefaultSettings();
  }
}

function resolveThemeMode(theme: ThemeMode) {
  if (typeof window === "undefined") {
    return "dark";
  }

  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return theme;
}

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<UiSettings>(getInitialSettings);
  const [password, setPassword] = useState("");
  const [pendingGatewayUrl, setPendingGatewayUrl] = useState<string | null>(null);
  const [pendingGatewayToken, setPendingGatewayToken] = useState<string | null>(null);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("dark");
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const resolvedTheme = settings.theme === "system" ? systemTheme : settings.theme;
  const initializedFromUrlRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setSettings(loadPersistedSettings());
    setSystemTheme(resolveThemeMode("system"));
    setSettingsHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!settingsHydrated) {
      return;
    }

    const persisted: PersistedUiSettings = {
      gatewayUrl: settings.gatewayUrl,
      sessionKey: settings.sessionKey,
      lastActiveSessionKey: settings.lastActiveSessionKey,
      theme: settings.theme,
      chatFocusMode: settings.chatFocusMode,
      chatShowThinking: settings.chatShowThinking,
      splitRatio: settings.splitRatio,
      navCollapsed: settings.navCollapsed,
      navGroupsCollapsed: settings.navGroupsCollapsed,
      ...(settings.locale ? { locale: settings.locale } : {}),
    };
    persistSessionToken(settings.gatewayUrl, settings.token);
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(persisted));
  }, [settings, settingsHydrated]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.lang = settings.locale ?? "zh-CN";
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme, settings.locale]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!settingsHydrated || initializedFromUrlRef.current || typeof window === "undefined") {
      return;
    }

    initializedFromUrlRef.current = true;
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
    const gatewayUrlRaw = params.get("gatewayUrl") ?? hashParams.get("gatewayUrl");
    const nextGatewayUrl = gatewayUrlRaw?.trim() ?? "";
    const gatewayUrlChanged = Boolean(nextGatewayUrl && nextGatewayUrl !== settings.gatewayUrl);
    const tokenRaw = hashParams.get("token");
    const passwordRaw = params.get("password") ?? hashParams.get("password");
    const sessionRaw = params.get("session") ?? hashParams.get("session");
    let shouldCleanUrl = false;

    if (params.has("token")) {
      params.delete("token");
      shouldCleanUrl = true;
    }

    if (tokenRaw != null) {
      const token = tokenRaw.trim();
      if (token && gatewayUrlChanged) {
        setPendingGatewayToken(token);
      } else if (token && token !== settings.token) {
        setSettings((current) => ({ ...current, token }));
      }
      hashParams.delete("token");
      shouldCleanUrl = true;
    }

    if (passwordRaw != null) {
      params.delete("password");
      hashParams.delete("password");
      shouldCleanUrl = true;
    }

    if (sessionRaw != null) {
      const session = sessionRaw.trim();
      if (session) {
        setSettings((current) => ({
          ...current,
          sessionKey: session,
          lastActiveSessionKey: session,
        }));
      }
    }

    if (gatewayUrlRaw != null) {
      if (gatewayUrlChanged) {
        setPendingGatewayUrl(nextGatewayUrl);
        if (!tokenRaw?.trim()) {
          setPendingGatewayToken(null);
        }
      } else {
        setPendingGatewayUrl(null);
        setPendingGatewayToken(null);
      }
      params.delete("gatewayUrl");
      hashParams.delete("gatewayUrl");
      shouldCleanUrl = true;
    }

    if (!shouldCleanUrl) {
      return;
    }

    url.search = params.toString();
    const nextHash = hashParams.toString();
    url.hash = nextHash ? `#${nextHash}` : "";
    window.history.replaceState({}, "", url.toString());
  }, [settings.gatewayUrl, settings.token, settingsHydrated]);

  const applySettings = useCallback((patch: Partial<UiSettings>) => {
    setSettings((current) => {
      const nextGatewayUrl =
        typeof patch.gatewayUrl === "string" ? patch.gatewayUrl.trim() : current.gatewayUrl;
      const gatewayChanged = nextGatewayUrl !== current.gatewayUrl;
      const nextToken =
        typeof patch.token === "string"
          ? patch.token
          : gatewayChanged
            ? loadSessionToken(nextGatewayUrl)
            : current.token;
      const nextSessionKey =
        typeof patch.sessionKey === "string" && patch.sessionKey.trim()
          ? patch.sessionKey.trim()
          : current.sessionKey;
      const nextLastActiveSessionKey =
        typeof patch.lastActiveSessionKey === "string" && patch.lastActiveSessionKey.trim()
          ? patch.lastActiveSessionKey.trim()
          : nextSessionKey;

      return {
        ...current,
        ...patch,
        gatewayUrl: nextGatewayUrl,
        token: nextToken,
        sessionKey: nextSessionKey,
        lastActiveSessionKey: nextLastActiveSessionKey,
      };
    });
  }, []);

  const setTheme = useCallback(
    (theme: ThemeMode) => {
      applySettings({ theme });
    },
    [applySettings],
  );

  const confirmPendingGatewayUrlChange = useCallback(() => {
    if (!pendingGatewayUrl) {
      return;
    }

    setSettings((current) => ({
      ...current,
      gatewayUrl: pendingGatewayUrl,
      token: pendingGatewayToken ?? loadSessionToken(pendingGatewayUrl),
    }));
    setPendingGatewayUrl(null);
    setPendingGatewayToken(null);
  }, [pendingGatewayToken, pendingGatewayUrl]);

  const cancelPendingGatewayUrlChange = useCallback(() => {
    setPendingGatewayUrl(null);
    setPendingGatewayToken(null);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      password,
      resolvedTheme,
      pendingGatewayUrl,
      settingsHydrated,
      applySettings,
      setPassword,
      setTheme,
      confirmPendingGatewayUrlChange,
      cancelPendingGatewayUrlChange,
    }),
    [
      applySettings,
      cancelPendingGatewayUrlChange,
      confirmPendingGatewayUrlChange,
      password,
      pendingGatewayUrl,
      resolvedTheme,
      setTheme,
      settings,
      settingsHydrated,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }

  return context;
}
