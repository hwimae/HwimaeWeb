import { describe, expect, it } from "vitest";

import {
  AUTH_REQUIRED_REDIRECT_REASON,
  canAccessPath,
  getLoginRedirectHref,
  getProtectedFallbackPath,
  isPublicAuthPath,
  isPublicPath,
  shouldRedirectAuthenticatedUserFromAuthPath,
} from "./auth-routing";

const approvedUser = {
  id: "user1",
  email: "boo@example.com",
  name: "Boo",
  role: "USER" as const,
  status: "APPROVED" as const,
};

const pendingUser = {
  ...approvedUser,
  status: "PENDING" as const,
};

const approvedAdmin = {
  ...approvedUser,
  id: "admin1",
  email: "admin@example.com",
  name: "Admin",
  role: "ADMIN" as const,
};

describe("auth routing", () => {
  it("treats only home and auth pages as public", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/register")).toBe(true);
    expect(isPublicPath("/stories")).toBe(false);
    expect(isPublicPath("/stories/story-1")).toBe(false);
    expect(isPublicPath("/movie")).toBe(false);
    expect(isPublicPath("/recommendations")).toBe(false);
  });

  it("builds the auth-required login redirect href", () => {
    expect(getLoginRedirectHref()).toBe("/login");
    expect(getLoginRedirectHref(AUTH_REQUIRED_REDIRECT_REASON)).toBe(
      "/login?redirectReason=auth-required",
    );
  });

  it("marks only approved signed-in users for auth-page redirect", () => {
    expect(isPublicAuthPath("/login")).toBe(true);
    expect(shouldRedirectAuthenticatedUserFromAuthPath("/login", approvedUser)).toBe(true);
    expect(shouldRedirectAuthenticatedUserFromAuthPath("/register", approvedUser)).toBe(true);
    expect(shouldRedirectAuthenticatedUserFromAuthPath("/login", pendingUser)).toBe(false);
    expect(shouldRedirectAuthenticatedUserFromAuthPath("/", approvedUser)).toBe(false);
  });

  it("keeps admin routing protected and resolves fallback paths by role", () => {
    expect(canAccessPath("/admin/users", null)).toBe(false);
    expect(canAccessPath("/admin/users", approvedUser)).toBe(false);
    expect(getProtectedFallbackPath(approvedUser)).toBe("/stories");
    expect(getProtectedFallbackPath(approvedAdmin)).toBe("/admin/users");
  });
});
