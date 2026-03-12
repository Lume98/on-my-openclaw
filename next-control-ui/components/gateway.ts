import {
  ConnectErrorDetailCodes,
  readConnectErrorDetailCode,
} from "@/components/connect-error-details";
import {
  clearDeviceAuthToken,
  loadDeviceAuthToken,
  storeDeviceAuthToken,
} from "@/components/device-auth";
import { loadOrCreateDeviceIdentity, signDevicePayload } from "@/components/device-identity";
import type { GatewayErrorInfo, GatewayEventFrame, GatewayHelloOk } from "@/components/types";

type GatewayResponseFrame = {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: GatewayErrorInfo;
};

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

export type GatewayBrowserClientOptions = {
  url: string;
  token?: string;
  password?: string;
  clientName?: string;
  clientVersion?: string;
  platform?: string;
  mode?: string;
  instanceId?: string;
  onHello?: (hello: GatewayHelloOk) => void;
  onEvent?: (event: GatewayEventFrame) => void;
  onClose?: (info: { code: number; reason: string; error?: GatewayErrorInfo }) => void;
  onGap?: (info: { expected: number; received: number }) => void;
};

export class GatewayRequestError extends Error {
  readonly gatewayCode: string;
  readonly details?: unknown;

  constructor(error: GatewayErrorInfo) {
    super(error.message);
    this.name = "GatewayRequestError";
    this.gatewayCode = error.code;
    this.details = error.details;
  }
}

function buildDeviceAuthPayload(params: {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAtMs: number;
  token?: string | null;
  nonce: string;
}) {
  return [
    "v2",
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    params.scopes.join(","),
    String(params.signedAtMs),
    params.token ?? "",
    params.nonce,
  ].join("|");
}

function resolveGatewayErrorDetailCode(error: { details?: unknown } | null | undefined) {
  return readConnectErrorDetailCode(error?.details);
}

function isNonRecoverableAuthError(error: GatewayErrorInfo | undefined) {
  const code = resolveGatewayErrorDetailCode(error);
  return (
    code === ConnectErrorDetailCodes.AUTH_TOKEN_MISSING ||
    code === ConnectErrorDetailCodes.AUTH_PASSWORD_MISSING ||
    code === ConnectErrorDetailCodes.AUTH_PASSWORD_MISMATCH ||
    code === ConnectErrorDetailCodes.AUTH_RATE_LIMITED
  );
}

export class GatewayBrowserClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, PendingRequest>();
  private closed = false;
  private connectNonce: string | null = null;
  private connectSent = false;
  private connectTimer: number | null = null;
  private backoffMs = 800;
  private lastSeq: number | null = null;
  private pendingConnectError: GatewayErrorInfo | undefined;

  constructor(private readonly options: GatewayBrowserClientOptions) {}

  start() {
    this.closed = false;
    this.open();
  }

  stop() {
    this.closed = true;
    if (this.connectTimer !== null) {
      window.clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.pendingConnectError = undefined;
    this.flushPending(new Error("gateway client stopped"));
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async request<T = unknown>(method: string, params?: unknown): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("gateway not connected");
    }

    const id = crypto.randomUUID();
    const frame = { type: "req", id, method, params };
    const promise = new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: (value) => resolve(value as T), reject });
    });
    this.ws.send(JSON.stringify(frame));
    return await promise;
  }

  private open() {
    if (this.closed) {
      return;
    }

    this.ws = new WebSocket(this.options.url);
    this.ws.addEventListener("open", () => this.queueConnect());
    this.ws.addEventListener("message", (event) => this.handleMessage(String(event.data ?? "")));
    this.ws.addEventListener("close", (event) => {
      const reason = String(event.reason ?? "");
      const error = this.pendingConnectError;
      this.pendingConnectError = undefined;
      this.flushPending(new Error(`gateway closed (${event.code}): ${reason}`));
      this.ws = null;
      this.options.onClose?.({ code: event.code, reason, error });

      if (!this.closed && !isNonRecoverableAuthError(error)) {
        const delay = this.backoffMs;
        this.backoffMs = Math.min(Math.round(this.backoffMs * 1.8), 15_000);
        window.setTimeout(() => this.open(), delay);
      }
    });
    this.ws.addEventListener("error", () => {
      // 让 close 事件统一处理
    });
  }

  private queueConnect() {
    this.connectNonce = null;
    this.connectSent = false;
    if (this.connectTimer !== null) {
      window.clearTimeout(this.connectTimer);
    }
    this.connectTimer = window.setTimeout(() => {
      void this.sendConnect();
    }, 750);
  }

  private async sendConnect() {
    if (this.connectSent) {
      return;
    }

    this.connectSent = true;
    if (this.connectTimer !== null) {
      window.clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }

    const scopes = ["operator.admin", "operator.approvals", "operator.pairing"];
    const role = "operator";
    const isSecureContext = typeof crypto !== "undefined" && Boolean(crypto.subtle);
    let deviceIdentity: Awaited<ReturnType<typeof loadOrCreateDeviceIdentity>> | null = null;
    let canFallbackToShared = false;
    const explicitGatewayToken = this.options.token?.trim() || undefined;
    let authToken = explicitGatewayToken;
    let deviceToken: string | undefined;

    if (isSecureContext) {
      deviceIdentity = await loadOrCreateDeviceIdentity();
      const storedToken = loadDeviceAuthToken({
        deviceId: deviceIdentity.deviceId,
        role,
      })?.token;
      deviceToken = !(explicitGatewayToken || this.options.password?.trim())
        ? (storedToken ?? undefined)
        : undefined;
      canFallbackToShared = Boolean(deviceToken && explicitGatewayToken);
    }

    authToken = explicitGatewayToken ?? deviceToken;
    const auth =
      authToken || this.options.password
        ? {
            token: authToken,
            password: this.options.password,
          }
        : undefined;

    let device:
      | {
          id: string;
          publicKey: string;
          signature: string;
          signedAt: number;
          nonce: string;
        }
      | undefined;

    if (isSecureContext && deviceIdentity) {
      const signedAtMs = Date.now();
      const nonce = this.connectNonce ?? "";
      const payload = buildDeviceAuthPayload({
        deviceId: deviceIdentity.deviceId,
        clientId: this.options.clientName ?? "openclaw-control-ui",
        clientMode: this.options.mode ?? "webchat",
        role,
        scopes,
        signedAtMs,
        token: authToken ?? null,
        nonce,
      });
      const signature = await signDevicePayload(deviceIdentity.privateKey, payload);
      device = {
        id: deviceIdentity.deviceId,
        publicKey: deviceIdentity.publicKey,
        signature,
        signedAt: signedAtMs,
        nonce,
      };
    }

    try {
      const hello = await this.request<GatewayHelloOk>("connect", {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: this.options.clientName ?? "openclaw-control-ui",
          version: this.options.clientVersion ?? "next-control-ui",
          platform: this.options.platform ?? navigator.platform ?? "web",
          mode: this.options.mode ?? "webchat",
          instanceId: this.options.instanceId,
        },
        role,
        scopes,
        device,
        caps: ["tool-events"],
        auth,
        userAgent: navigator.userAgent,
        locale: navigator.language,
      });
      this.backoffMs = 800;
      if (hello?.auth?.deviceToken && deviceIdentity) {
        storeDeviceAuthToken({
          deviceId: deviceIdentity.deviceId,
          role: hello.auth.role ?? role,
          token: hello.auth.deviceToken,
          scopes: hello.auth.scopes ?? [],
        });
      }
      this.options.onHello?.(hello);
    } catch (error) {
      if (error instanceof GatewayRequestError) {
        this.pendingConnectError = {
          code: error.gatewayCode,
          message: error.message,
          details: error.details,
        };
      } else {
        this.pendingConnectError = undefined;
      }
      if (canFallbackToShared && deviceIdentity) {
        clearDeviceAuthToken({ deviceId: deviceIdentity.deviceId, role });
      }
      this.ws?.close(4008, "connect failed");
    }
  }

  private handleMessage(raw: string) {
    let frame: unknown;
    try {
      frame = JSON.parse(raw);
    } catch {
      return;
    }

    const parsed = frame as { type?: unknown };
    if (parsed.type === "event") {
      const event = frame as GatewayEventFrame;
      if (event.event === "connect.challenge") {
        const payload = event.payload as { nonce?: unknown } | undefined;
        const nonce = payload && typeof payload.nonce === "string" ? payload.nonce : null;
        if (nonce) {
          this.connectNonce = nonce;
          void this.sendConnect();
        }
        return;
      }
      const nextSeq = typeof event.seq === "number" ? event.seq : null;
      if (nextSeq !== null) {
        if (this.lastSeq !== null && nextSeq > this.lastSeq + 1) {
          this.options.onGap?.({ expected: this.lastSeq + 1, received: nextSeq });
        }
        this.lastSeq = nextSeq;
      }
      this.options.onEvent?.(event);
      return;
    }

    if (parsed.type === "res") {
      const response = frame as GatewayResponseFrame;
      const pending = this.pending.get(response.id);
      if (!pending) {
        return;
      }

      this.pending.delete(response.id);
      if (response.ok) {
        pending.resolve(response.payload);
      } else {
        pending.reject(
          new GatewayRequestError({
            code: response.error?.code ?? "UNAVAILABLE",
            message: response.error?.message ?? "request failed",
            details: response.error?.details,
          }),
        );
      }
    }
  }

  private flushPending(error: Error) {
    for (const [, pending] of this.pending) {
      pending.reject(error);
    }
    this.pending.clear();
  }
}
