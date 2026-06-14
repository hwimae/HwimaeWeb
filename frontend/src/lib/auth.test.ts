import { describe, expect, it } from "vitest";

import { parseAuthResponse, parseAuthUser, parseRegisterResponse } from "./auth";

describe("auth parsers", () => {
  const approvedAdmin = {
    id: "admin1",
    email: "admin@example.com",
    name: "Admin",
    role: "ADMIN",
    status: "APPROVED",
  };

  it("parses login auth response with role and status", () => {
    expect(parseAuthResponse({ user: approvedAdmin, accessToken: "token" })).toEqual({
      user: approvedAdmin,
      accessToken: "token",
    });
  });

  it("parses current auth user", () => {
    expect(parseAuthUser(approvedAdmin)).toEqual(approvedAdmin);
  });

  it("parses register pending response without token", () => {
    expect(
      parseRegisterResponse({
        user: { id: "user1", email: "boo@example.com", name: "Boo", role: "USER", status: "PENDING" },
        message: "Registration pending approval",
      }),
    ).toEqual({
      user: { id: "user1", email: "boo@example.com", name: "Boo", role: "USER", status: "PENDING" },
      message: "Registration pending approval",
    });
  });

  it("rejects invalid role/status values", () => {
    expect(() => parseAuthUser({ ...approvedAdmin, role: "OWNER" })).toThrow("Invalid auth user payload");
    expect(() => parseAuthUser({ ...approvedAdmin, status: "ACTIVE" })).toThrow("Invalid auth user payload");
  });
});
