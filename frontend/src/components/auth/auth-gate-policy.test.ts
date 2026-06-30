import { describe, expect, it } from "vitest";

import { ApiError } from "../../lib/api";

import {
  AUTH_REVALIDATE_COOLDOWN_MS,
  getInitialAuthStatus,
  isSessionInvalidationError,
  shouldRunAuthPageValidation,
  shouldRunBackgroundAuthCheck,
  shouldRunInitialAuthCheck,
  shouldShowBlockingAuthGate,
} from "./auth-gate-policy";

describe("auth gate policy", () => {
  it("bootstraps auth status to unknown whenever a token already exists", () => {
    expect(getInitialAuthStatus(true)).toBe("unknown");
    expect(getInitialAuthStatus(false)).toBe("unauthenticated");
    expect(shouldRunInitialAuthCheck("unknown", true)).toBe(true);
    expect(shouldRunInitialAuthCheck("unauthenticated", true)).toBe(false);
  });

  it("shows the blocking gate only while a protected route is still unknown", () => {
    expect(shouldShowBlockingAuthGate("/finance/dashboard", "unknown")).toBe(true);
    expect(shouldShowBlockingAuthGate("/finance/dashboard", "authenticated")).toBe(false);
    expect(shouldShowBlockingAuthGate("/", "unknown")).toBe(false);
  });

  it("skips background auth checks inside the cooldown window", () => {
    const now = 10_000;

    expect(
      shouldRunBackgroundAuthCheck({
        pathname: "/finance/expenses",
        authStatus: "authenticated",
        hasToken: true,
        lastValidatedAt: now - (AUTH_REVALIDATE_COOLDOWN_MS - 1),
        now,
      }),
    ).toBe(false);

    expect(
      shouldRunBackgroundAuthCheck({
        pathname: "/finance/expenses",
        authStatus: "authenticated",
        hasToken: true,
        lastValidatedAt: now - AUTH_REVALIDATE_COOLDOWN_MS,
        now,
      }),
    ).toBe(true);
  });

  it("starts a non-blocking auth-page validation when login/register already has a token", () => {
    expect(shouldRunAuthPageValidation("/login", "unauthenticated", true)).toBe(true);
    expect(shouldRunAuthPageValidation("/register", "unknown", true)).toBe(true);
    expect(shouldRunAuthPageValidation("/login", "authenticated", true)).toBe(false);
    expect(shouldRunAuthPageValidation("/", "unauthenticated", true)).toBe(false);
    expect(shouldRunAuthPageValidation("/login", "unauthenticated", false)).toBe(false);
  });

  it("never starts background checks for public routes, missing tokens, or non-authenticated sessions", () => {
    expect(
      shouldRunBackgroundAuthCheck({
        pathname: "/login",
        authStatus: "authenticated",
        hasToken: true,
        lastValidatedAt: 1,
        now: 10_000,
      }),
    ).toBe(false);

    expect(
      shouldRunBackgroundAuthCheck({
        pathname: "/finance/dashboard",
        authStatus: "unauthenticated",
        hasToken: true,
        lastValidatedAt: 1,
        now: 10_000,
      }),
    ).toBe(false);

    expect(
      shouldRunBackgroundAuthCheck({
        pathname: "/finance/dashboard",
        authStatus: "authenticated",
        hasToken: false,
        lastValidatedAt: 1,
        now: 10_000,
      }),
    ).toBe(false);
  });

  it("treats only 401/403 API errors as session invalidation", () => {
    expect(isSessionInvalidationError(new ApiError("GET", "/auth/me", 401, "Unauthorized"))).toBe(true);
    expect(isSessionInvalidationError(new ApiError("GET", "/auth/me", 403, "Forbidden"))).toBe(true);
    expect(isSessionInvalidationError(new ApiError("GET", "/auth/me", 500, "Server error"))).toBe(false);
    expect(isSessionInvalidationError(new Error("Network down"))).toBe(false);
  });
});
