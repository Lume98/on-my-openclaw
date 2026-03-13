type StoredIdentity = {
  version: 1;
  deviceId: string;
  publicKey: string;
  privateKey: string;
  createdAtMs: number;
};

export type DeviceIdentity = {
  deviceId: string;
  publicKey: string;
  privateKey: string;
};

const STORAGE_KEY = "openclaw-device-identity-v1";
const ED25519_ALGORITHM = { name: "Ed25519" };

function ensureSubtleCrypto() {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("当前环境不支持设备身份签名");
  }

  return crypto.subtle;
}

function arrayBufferToBytes(buffer: ArrayBuffer) {
  return new Uint8Array(buffer);
}

function toArrayBuffer(bytes: Uint8Array) {
  const copied = new Uint8Array(bytes.byteLength);
  copied.set(bytes);
  return copied.buffer;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64UrlToBytes(input: string) {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    out[index] = binary.charCodeAt(index);
  }

  return out;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function fingerprintPublicKey(publicKeyBytes: Uint8Array) {
  const subtle = ensureSubtleCrypto();
  const hash = await subtle.digest("SHA-256", toArrayBuffer(publicKeyBytes));
  return bytesToHex(arrayBufferToBytes(hash));
}

async function generateIdentity(): Promise<DeviceIdentity> {
  const subtle = ensureSubtleCrypto();
  const keyPair = await subtle.generateKey(ED25519_ALGORITHM, true, ["sign", "verify"]);
  if (!("privateKey" in keyPair) || !("publicKey" in keyPair)) {
    throw new Error("生成设备身份失败");
  }

  const publicKeyBytes = arrayBufferToBytes(await subtle.exportKey("raw", keyPair.publicKey));
  const privateKeyBytes = arrayBufferToBytes(await subtle.exportKey("pkcs8", keyPair.privateKey));
  const deviceId = await fingerprintPublicKey(publicKeyBytes);

  return {
    deviceId,
    publicKey: bytesToBase64Url(publicKeyBytes),
    privateKey: bytesToBase64Url(privateKeyBytes),
  };
}

export async function loadOrCreateDeviceIdentity(): Promise<DeviceIdentity> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredIdentity;
      if (
        parsed?.version === 1 &&
        typeof parsed.deviceId === "string" &&
        typeof parsed.publicKey === "string" &&
        typeof parsed.privateKey === "string"
      ) {
        const derivedId = await fingerprintPublicKey(base64UrlToBytes(parsed.publicKey));
        if (derivedId !== parsed.deviceId) {
          const updated: StoredIdentity = { ...parsed, deviceId: derivedId };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return {
            deviceId: derivedId,
            publicKey: parsed.publicKey,
            privateKey: parsed.privateKey,
          };
        }

        return {
          deviceId: parsed.deviceId,
          publicKey: parsed.publicKey,
          privateKey: parsed.privateKey,
        };
      }
    }
  } catch {
    // fall through to regenerate
  }

  const identity = await generateIdentity();
  const stored: StoredIdentity = {
    version: 1,
    deviceId: identity.deviceId,
    publicKey: identity.publicKey,
    privateKey: identity.privateKey,
    createdAtMs: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  return identity;
}

export async function signDevicePayload(privateKeyBase64Url: string, payload: string) {
  const subtle = ensureSubtleCrypto();
  const key = await subtle.importKey(
    "pkcs8",
    toArrayBuffer(base64UrlToBytes(privateKeyBase64Url)),
    ED25519_ALGORITHM,
    false,
    ["sign"],
  );
  const signature = await subtle.sign(
    ED25519_ALGORITHM,
    key,
    toArrayBuffer(new TextEncoder().encode(payload)),
  );
  return bytesToBase64Url(arrayBufferToBytes(signature));
}
