import { ApiError } from "../../lib/api";

import { isPublicPath } from "./auth-routing";

export type AuthSessionStatus = "unknown" | "authenticated" | "unauthenticated";

export const AUTH_REVALIDATE_COOLDOWN_MS = 5_000;
export const AUTH_SESSION_EXPIRED_REDIRECT_DELAY_MS = 800;
export const AUTH_SESSION_EXPIRED_MESSAGE = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
export const AUTH_VALIDATION_UNAVAILABLE_MESSAGE = "Không thể kiểm tra đăng nhập lúc này. Vui lòng thử lại.";

export function getInitialAuthStatus(hasToken: boolean): AuthSessionStatus {
  return hasToken ? "unknown" : "unauthenticated";
}

export function shouldRunInitialAuthCheck(authStatus: AuthSessionStatus, hasToken: boolean): boolean {
  return authStatus === "unknown" && hasToken;
}

export function shouldShowBlockingAuthGate(pathname: string, authStatus: AuthSessionStatus): boolean {
  return !isPublicPath(pathname) && authStatus === "unknown";
}

export function shouldRunAuthPageValidation(
  pathname: string,
  authStatus: AuthSessionStatus,
  hasToken: boolean,
): boolean {
  return (pathname === "/login" || pathname === "/register") && authStatus !== "authenticated" && hasToken;
}

export function shouldRunBackgroundAuthCheck(input: {
  pathname: string;
  authStatus: AuthSessionStatus;
  hasToken: boolean;
  lastValidatedAt: number | null;
  now: number;
}): boolean {
  const { pathname, authStatus, hasToken, lastValidatedAt, now } = input;

  if (isPublicPath(pathname) || authStatus !== "authenticated" || !hasToken) {
    return false;
  }

  if (lastValidatedAt === null) {
    return true;
  }

  return now - lastValidatedAt >= AUTH_REVALIDATE_COOLDOWN_MS;
}

export function isSessionInvalidationError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}
