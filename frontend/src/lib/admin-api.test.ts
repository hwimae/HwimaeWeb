import { describe, expect, it } from "vitest";

import { parseAdminUser, parseAdminUsers } from "./admin-api";

const adminUser = {
  id: "user1",
  email: "boo@example.com",
  name: "Boo",
  role: "USER",
  status: "PENDING",
  createdAt: "2026-06-13T01:00:00.000Z",
  updatedAt: "2026-06-13T01:00:00.000Z",
};

describe("admin API parsers", () => {
  it("parses admin user payload", () => {
    expect(parseAdminUser(adminUser)).toEqual(adminUser);
  });

  it("parses admin users list", () => {
    expect(parseAdminUsers([adminUser])).toEqual([adminUser]);
  });

  it("rejects passwordHash leaks", () => {
    expect(() => parseAdminUser({ ...adminUser, passwordHash: "secret" })).toThrow("Invalid admin user payload");
  });
});
