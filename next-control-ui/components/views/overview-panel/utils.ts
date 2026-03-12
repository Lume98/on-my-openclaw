import { ConnectErrorDetailCodes } from "@/components/connect-error-details";

const authRequiredCodes = new Set<string>([
  ConnectErrorDetailCodes.AUTH_REQUIRED,
  ConnectErrorDetailCodes.AUTH_TOKEN_MISSING,
  ConnectErrorDetailCodes.AUTH_PASSWORD_MISSING,
  ConnectErrorDetailCodes.AUTH_TOKEN_NOT_CONFIGURED,
  ConnectErrorDetailCodes.AUTH_PASSWORD_NOT_CONFIGURED,
]);

const authFailureCodes = new Set<string>([
  ...authRequiredCodes,
  ConnectErrorDetailCodes.AUTH_UNAUTHORIZED,
  ConnectErrorDetailCodes.AUTH_TOKEN_MISMATCH,
  ConnectErrorDetailCodes.AUTH_PASSWORD_MISMATCH,
  ConnectErrorDetailCodes.AUTH_DEVICE_TOKEN_MISMATCH,
  ConnectErrorDetailCodes.AUTH_RATE_LIMITED,
  ConnectErrorDetailCodes.AUTH_TAILSCALE_IDENTITY_MISSING,
  ConnectErrorDetailCodes.AUTH_TAILSCALE_PROXY_MISSING,
  ConnectErrorDetailCodes.AUTH_TAILSCALE_WHOIS_FAILED,
  ConnectErrorDetailCodes.AUTH_TAILSCALE_IDENTITY_MISMATCH,
]);

export { authRequiredCodes, authFailureCodes };

export function shouldShowPairingHint(
  connected: boolean,
  lastError: string | null,
  lastErrorCode: string | null,
) {
  if (connected || !lastError) {
    return false;
  }

  return (
    lastErrorCode === ConnectErrorDetailCodes.PAIRING_REQUIRED ||
    lastError.toLowerCase().includes("pairing required")
  );
}
