"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { StatusMessage } from "@/components/ui/status-message";
import { apiGet } from "@/lib/api";
import { clearAccessToken, getAccessToken, parseAuthUser, type AuthUser } from "@/lib/auth";
import { AuthContextProvider } from "./auth-context";

const PUBLIC_AUTH_PATHS = ["/login", "/register"] as const;
const PUBLIC_CONTENT_PATHS = ["/modules", "/movie", "/recommendations", "/stories"] as const;

export function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.some((path) => pathname === path);
}

export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    isPublicAuthPath(pathname) ||
    PUBLIC_CONTENT_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  );
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

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const authCheckIdRef = useRef(0);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(!isPublicPath(pathname));

  const logout = useCallback(() => {
    authCheckIdRef.current += 1;
    clearAccessToken();
    setUser(null);
    setIsCheckingAuth(false);
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const checkId = authCheckIdRef.current;
      const isPublicRoute = isPublicPath(pathname);
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        setIsCheckingAuth(false);
        if (!isPublicRoute) {
          router.replace("/login");
        }
        return;
      }

      setIsCheckingAuth(true);
      try {
        const currentUser = await apiGet("/auth/me", token, parseAuthUser);
        if (!isMounted || checkId !== authCheckIdRef.current) return;

        if (!canAccessPath(pathname, currentUser)) {
          setUser(currentUser);
          setIsCheckingAuth(false);
          router.replace(currentUser.role === "ADMIN" ? "/admin/users" : "/stories");
          return;
        }

        setUser(currentUser);
        setIsCheckingAuth(false);
      } catch {
        if (!isMounted || checkId !== authCheckIdRef.current) return;

        clearAccessToken();
        setUser(null);
        setIsCheckingAuth(false);
        if (!isPublicRoute) {
          router.replace("/login");
        }
      }
    }

    void checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  const contextValue = useMemo(() => ({ user, isCheckingAuth, logout }), [user, isCheckingAuth, logout]);

  if (!isPublicPath(pathname) && (isCheckingAuth || !canAccessPath(pathname, user))) {
    return (
      <AuthContextProvider value={contextValue}>
        <main className="page-shell">
          <StatusMessage>Đang kiểm tra đăng nhập...</StatusMessage>
        </main>
      </AuthContextProvider>
    );
  }

  return <AuthContextProvider value={contextValue}>{children}</AuthContextProvider>;
}
