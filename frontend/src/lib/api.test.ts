import { afterEach, describe, expect, it, vi } from "vitest";

import { apiPost, ApiError } from "./api";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("apiPost", () => {
  it("throws ApiError with backend message when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue({ message: "Account pending approval" }),
      }),
    );

    await expect(apiPost("/auth/login", { email: "boo@example.com", password: "password123" })).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      message: "Account pending approval",
    });
  });

  it("falls back to method/path/status when backend message is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error("invalid json")),
      }),
    );

    await expect(apiPost("/broken", {})).rejects.toEqual(
      new ApiError("POST", "/broken", 500, "POST /broken failed with status 500"),
    );
  });
});
