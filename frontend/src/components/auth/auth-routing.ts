import type { AuthUser } from "@/lib/auth";

export const AUTH_REQUIRED_REDIRECT_REASON = "auth-required" as const;

const PUBLIC_AUTH_PATHS = ["/login", "/register"] as const;
const PUBLIC_PATHS = ["/", ...PUBLIC_AUTH_PATHS] as const;

export function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.some((path) => pathname === path);
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path);
}

export function getLoginRedirectHref(reason?: typeof AUTH_REQUIRED_REDIRECT_REASON): string {
  if (!reason) {
    return "/login";
  }

  return `/login?redirectReason=${reason}`;
}

export function canAccessPath(pathname: string, user: AuthUser | null): boolean {
  if (isPublicPath(pathname)) {
    return true;
  }

  if (!user || user.status !== "APPROVED") {
    return false;
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return user.role === "ADMIN";
  }

  return true;
}

export function shouldRedirectAuthenticatedUserFromAuthPath(
  pathname: string,
  user: AuthUser | null,
): boolean {
  return user?.status === "APPROVED" && isPublicAuthPath(pathname);
}

export function getProtectedFallbackPath(user: AuthUser): "/stories" | "/admin/users" {
  return user.role === "ADMIN" ? "/admin/users" : "/stories";
}
