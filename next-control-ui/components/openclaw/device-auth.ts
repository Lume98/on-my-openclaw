export type DeviceAuthEntry = {
  token: string;
  role: string;
  scopes: string[];
  updatedAtMs: number;
};

type DeviceAuthStore = {
  version: 1;
  deviceId: string;
  tokens: Record<string, DeviceAuthEntry>;
};

const STORAGE_KEY = "openclaw.device.auth.v1";

function readStore(): DeviceAuthStore | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as DeviceAuthStore;
    if (
      parsed?.version !== 1 ||
      typeof parsed.deviceId !== "string" ||
      !parsed.deviceId.trim() ||
      !parsed.tokens ||
      typeof parsed.tokens !== "object"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeStore(store: DeviceAuthStore) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // best-effort
  }
}

function normalizeRole(role: string) {
  return role.trim();
}

function normalizeScopes(scopes?: string[]) {
  if (!Array.isArray(scopes)) {
    return [];
  }

  return [...new Set(scopes.map((scope) => scope.trim()).filter(Boolean))].toSorted();
}

export function loadDeviceAuthToken(params: {
  deviceId: string;
  role: string;
}): DeviceAuthEntry | null {
  const store = readStore();
  if (!store || store.deviceId !== params.deviceId) {
    return null;
  }

  const role = normalizeRole(params.role);
  const entry = store.tokens[role];
  return entry && typeof entry.token === "string" ? entry : null;
}

export function storeDeviceAuthToken(params: {
  deviceId: string;
  role: string;
  token: string;
  scopes?: string[];
}): DeviceAuthEntry {
  const role = normalizeRole(params.role);
  const existing = readStore();
  const entry: DeviceAuthEntry = {
    token: params.token,
    role,
    scopes: normalizeScopes(params.scopes),
    updatedAtMs: Date.now(),
  };

  writeStore({
    version: 1,
    deviceId: params.deviceId,
    tokens:
      existing && existing.deviceId === params.deviceId
        ? { ...existing.tokens, [role]: entry }
        : { [role]: entry },
  });

  return entry;
}

export function clearDeviceAuthToken(params: { deviceId: string; role: string }) {
  const store = readStore();
  if (!store || store.deviceId !== params.deviceId) {
    return;
  }

  const role = normalizeRole(params.role);
  if (!store.tokens[role]) {
    return;
  }

  const nextTokens = { ...store.tokens };
  delete nextTokens[role];

  writeStore({
    version: 1,
    deviceId: store.deviceId,
    tokens: nextTokens,
  });
}
