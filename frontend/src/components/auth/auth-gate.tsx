"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { StatusMessage } from "@/components/ui/status-message";
import { apiGet } from "@/lib/api";
import { clearAccessToken, getAccessToken, parseAuthUser, type AuthUser } from "@/lib/auth";

import { AuthContextProvider } from "./auth-context";
import { AuthSessionExpiredNotice } from "./auth-session-expired-notice";
import {
  AUTH_SESSION_EXPIRED_MESSAGE,
  AUTH_SESSION_EXPIRED_REDIRECT_DELAY_MS,
  AUTH_VALIDATION_UNAVAILABLE_MESSAGE,
  getInitialAuthStatus,
  isSessionInvalidationError,
  shouldRunAuthPageValidation,
  shouldRunBackgroundAuthCheck,
  shouldRunInitialAuthCheck,
  shouldShowBlockingAuthGate,
  type AuthSessionStatus,
} from "./auth-gate-policy";
import {
  AUTH_REQUIRED_REDIRECT_REASON,
  canAccessPath,
  getLoginRedirectHref,
  getProtectedFallbackPath,
  isPublicPath,
  shouldRedirectAuthenticatedUserFromAuthPath,
} from "./auth-routing";

const AUTH_REQUIRED_HREF = getLoginRedirectHref(AUTH_REQUIRED_REDIRECT_REASON);

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const authCheckIdRef = useRef(0);
  const redirectTimerRef = useRef<number | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthSessionStatus>(() => getInitialAuthStatus(Boolean(getAccessToken())));
  const [isRefreshingAuth, setIsRefreshingAuth] = useState(false);
  const [lastValidatedAt, setLastValidatedAt] = useState<number | null>(null);
  const [expiredMessage, setExpiredMessage] = useState<string | null>(null);
  const [isSessionExpiredRedirectPending, setIsSessionExpiredRedirectPending] = useState(false);
  const [blockingErrorMessage, setBlockingErrorMessage] = useState<string | null>(null);

  const clearPendingRedirect = useCallback(() => {
    if (redirectTimerRef.current !== null) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    authCheckIdRef.current += 1;
    clearPendingRedirect();
    clearAccessToken();
    setUser(null);
    setAuthStatus("unauthenticated");
    setIsRefreshingAuth(false);
    setLastValidatedAt(null);
    setExpiredMessage(null);
    setIsSessionExpiredRedirectPending(false);
    setBlockingErrorMessage(null);
    router.replace("/login");
  }, [clearPendingRedirect, router]);

  const handleInvalidSession = useCallback(() => {
    authCheckIdRef.current += 1;
    clearAccessToken();
    setUser(null);
    setAuthStatus("unauthenticated");
    setIsRefreshingAuth(false);
    setLastValidatedAt(null);
    setBlockingErrorMessage(null);
    setExpiredMessage(AUTH_SESSION_EXPIRED_MESSAGE);
    setIsSessionExpiredRedirectPending(true);
    clearPendingRedirect();
    redirectTimerRef.current = window.setTimeout(() => {
      setExpiredMessage(null);
      setIsSessionExpiredRedirectPending(false);
      router.replace(AUTH_REQUIRED_HREF);
    }, AUTH_SESSION_EXPIRED_REDIRECT_DELAY_MS);
  }, [clearPendingRedirect, router]);

  useEffect(() => {
    return () => {
      clearPendingRedirect();
    };
  }, [clearPendingRedirect]);

  useEffect(() => {
    let isMounted = true;
    const token = getAccessToken();
    const isPublicRoute = isPublicPath(pathname);

    if (!token) {
      if (isSessionExpiredRedirectPending) {
        return () => {
          isMounted = false;
        };
      }

      authCheckIdRef.current += 1;
      clearPendingRedirect();
      setUser(null);
      setAuthStatus("unauthenticated");
      setIsRefreshingAuth(false);
      setLastValidatedAt(null);
      setExpiredMessage(null);
      setIsSessionExpiredRedirectPending(false);
      setBlockingErrorMessage(null);
      if (!isPublicRoute) {
        router.replace(AUTH_REQUIRED_HREF);
      }
      return () => {
        isMounted = false;
      };
    }

    if (authStatus === "authenticated" && user) {
      if (shouldRedirectAuthenticatedUserFromAuthPath(pathname, user)) {
        router.replace("/");
        return () => {
          isMounted = false;
        };
      }

      if (!canAccessPath(pathname, user)) {
        router.replace(getProtectedFallbackPath(user));
        return () => {
          isMounted = false;
        };
      }
    }

    const runInitialCheck = shouldRunInitialAuthCheck(authStatus, true);
    const runBlockingCheck = !isPublicRoute && authStatus === "unknown";
    const runAuthPageCheck = shouldRunAuthPageValidation(pathname, authStatus, true);
    const runBackgroundCheck = shouldRunBackgroundAuthCheck({
      pathname,
      authStatus,
      hasToken: true,
      lastValidatedAt,
      now: Date.now(),
    });

    if (!runInitialCheck && !runAuthPageCheck && !runBackgroundCheck) {
      return () => {
        isMounted = false;
      };
    }

    const requestId = ++authCheckIdRef.current;
    const controller = new AbortController();

    if ((runInitialCheck && isPublicRoute) || runAuthPageCheck || runBackgroundCheck) {
      setIsRefreshingAuth(true);
    }

    async function validateCurrentUser() {
      try {
        const currentUser = await apiGet("/auth/me", token ?? undefined, parseAuthUser, { signal: controller.signal });
        if (!isMounted || requestId !== authCheckIdRef.current) return;

        clearPendingRedirect();
        setExpiredMessage(null);
        setIsSessionExpiredRedirectPending(false);
        setBlockingErrorMessage(null);
        setUser(currentUser);
        setAuthStatus("authenticated");
        setLastValidatedAt(Date.now());
        setIsRefreshingAuth(false);

        if (shouldRedirectAuthenticatedUserFromAuthPath(pathname, currentUser)) {
          router.replace("/");
          return;
        }

        if (!canAccessPath(pathname, currentUser)) {
          router.replace(getProtectedFallbackPath(currentUser));
        }
      } catch (error) {
        if (!isMounted || requestId !== authCheckIdRef.current) return;
        if (error instanceof DOMException && error.name === "AbortError") return;

        if (isSessionInvalidationError(error)) {
          handleInvalidSession();
          return;
        }

        setIsRefreshingAuth(false);

        if (runBlockingCheck) {
          setBlockingErrorMessage(AUTH_VALIDATION_UNAVAILABLE_MESSAGE);
          setAuthStatus("unknown");
        }
      }
    }

    void validateCurrentUser();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [authStatus, clearPendingRedirect, handleInvalidSession, isSessionExpiredRedirectPending, lastValidatedAt, pathname, router, user]);

  const isCheckingAuth = shouldShowBlockingAuthGate(pathname, authStatus);
  const shouldHideProtectedChildren = !isPublicPath(pathname) && authStatus !== "authenticated";
  const shouldHideUnauthorizedChildren = authStatus === "authenticated" && !canAccessPath(pathname, user);
  const contextValue = useMemo(
    () => ({ user, isCheckingAuth, isRefreshingAuth, logout }),
    [isCheckingAuth, isRefreshingAuth, logout, user],
  );

  if (expiredMessage) {
    return (
      <AuthContextProvider value={contextValue}>
        <AuthSessionExpiredNotice message={expiredMessage ?? undefined} />
      </AuthContextProvider>
    );
  }

  if (isCheckingAuth || shouldHideProtectedChildren || shouldHideUnauthorizedChildren) {
    return (
      <AuthContextProvider value={contextValue}>
        <main className="page-shell">
          {blockingErrorMessage ? <StatusMessage tone="error">{blockingErrorMessage}</StatusMessage> : <StatusMessage>Đang kiểm tra đăng nhập...</StatusMessage>}
        </main>
      </AuthContextProvider>
    );
  }

  return <AuthContextProvider value={contextValue}>{children}</AuthContextProvider>;
}
