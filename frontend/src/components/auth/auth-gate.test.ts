import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/stories",
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/components/ui/status-message", () => ({
  StatusMessage: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
}));

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  clearAccessToken: vi.fn(),
  getAccessToken: vi.fn(),
  parseAuthUser: (input: unknown) => input,
}));

import {
  canAccessPath,
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

const approvedAdmin = {
  ...approvedUser,
  id: "admin1",
  email: "admin@example.com",
  name: "Admin",
  role: "ADMIN" as const,
};

const pendingUser = {
  ...approvedUser,
  status: "PENDING" as const,
};

describe("auth gate route helpers", () => {
  it("treats only login and register as public auth paths", () => {
    expect(isPublicAuthPath("/login")).toBe(true);
    expect(isPublicAuthPath("/register")).toBe(true);
    expect(isPublicAuthPath("/")).toBe(false);
    expect(isPublicAuthPath("/stories")).toBe(false);
  });

  it("requires guests to authenticate before story routes", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/stories")).toBe(false);
    expect(isPublicPath("/stories/story1")).toBe(false);
    expect(isPublicPath("/movie")).toBe(false);
    expect(isPublicPath("/recommendations")).toBe(false);
    expect(isPublicPath("/modules")).toBe(false);
    expect(canAccessPath("/stories", null)).toBe(false);
  });

  it("requires an approved user for protected routes", () => {
    expect(canAccessPath("/finance/dashboard", null)).toBe(false);
    expect(canAccessPath("/finance/dashboard", approvedUser)).toBe(true);
    expect(canAccessPath("/finance/dashboard", { ...approvedUser, status: "PENDING" })).toBe(false);
  });

  it("requires admin role for admin routes", () => {
    expect(canAccessPath("/admin/users", approvedUser)).toBe(false);
    expect(canAccessPath("/admin/users", approvedAdmin)).toBe(true);
  });

  it("marks only approved users as off-limits for auth pages", () => {
    expect(shouldRedirectAuthenticatedUserFromAuthPath("/login", approvedUser)).toBe(true);
    expect(shouldRedirectAuthenticatedUserFromAuthPath("/register", approvedUser)).toBe(true);
    expect(shouldRedirectAuthenticatedUserFromAuthPath("/login", pendingUser)).toBe(false);
    expect(shouldRedirectAuthenticatedUserFromAuthPath("/", approvedUser)).toBe(false);
  });
});
