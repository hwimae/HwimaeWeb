import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockedPathname = "/finance/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => mockedPathname,
}));

let mockedUser: unknown = null;
const mockedLogout = vi.fn();

vi.mock("@/components/auth/auth-context", () => ({
  useAuth: () => ({ user: mockedUser, isCheckingAuth: false, logout: mockedLogout }),
}));

import { GlobalHeader } from "./global-header";

describe("GlobalHeader", () => {
  beforeEach(() => {
    mockedPathname = "/finance/dashboard";
    mockedUser = null;
    mockedLogout.mockClear();
  });

  it("hiển thị thương hiệu và các mục điều hướng chính", () => {
    const html = renderToStaticMarkup(<GlobalHeader />);

    expect(html).toContain("StoryRec");
    expect(html).toContain('href="/finance/dashboard"');
    expect(html).not.toContain('href="/finance"');
    expect(html).toContain('href="/stories"');
    expect(html).toContain('href="/movie"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/login"');
    expect(html).toContain('href="/register"');
    expect(html).toContain("Login");
    expect(html).toContain("Register");
    expect(html).not.toContain("Logout");
    expect(html).not.toContain('href="/admin/users"');
  });

  it("đánh dấu tab tài chính active trên các trang con finance", () => {
    mockedPathname = "/finance/groups";

    const html = renderToStaticMarkup(<GlobalHeader />);

    expect(html).toContain('href="/finance/dashboard"');
    expect(html).toContain('aria-current="page"');
  });

  it("hiển thị logout khi user đã đăng nhập", () => {
    mockedPathname = "/finance/dashboard";
    mockedUser = {
      id: "user1",
      email: "user@example.com",
      name: "User",
      role: "USER",
      status: "APPROVED",
    };

    const html = renderToStaticMarkup(<GlobalHeader />);

    expect(html).toContain("Logout");
    expect(html).not.toContain('href="/login"');
    expect(html).not.toContain('href="/register"');
  });

  it("hiển thị link admin cho admin đã duyệt", () => {
    mockedPathname = "/finance/dashboard";
    mockedUser = {
      id: "admin1",
      email: "admin@example.com",
      name: "Admin",
      role: "ADMIN",
      status: "APPROVED",
    };

    const html = renderToStaticMarkup(<GlobalHeader />);

    expect(html).toContain('href="/admin/users"');
    expect(html).toContain("Admin");
    expect(html).toContain("Logout");
  });
});
