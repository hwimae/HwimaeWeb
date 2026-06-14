import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import { Providers } from "./providers";

describe("Providers", () => {
  it("renders children inside the shared provider boundary", () => {
    const html = renderToStaticMarkup(
      <Providers>
        <span>Xin chào boo</span>
      </Providers>,
    );

    expect(html).toContain("Xin chào boo");
  });
});
