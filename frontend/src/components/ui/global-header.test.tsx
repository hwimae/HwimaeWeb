import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/finance/dashboard",
}));

import { GlobalHeader } from "./global-header";

describe("GlobalHeader", () => {
  it("luôn hiển thị 3 mục điều hướng chính", () => {
    const html = renderToStaticMarkup(<GlobalHeader />);

    expect(html).toContain('href="/finance"');
    expect(html).toContain('href="/stories"');
    expect(html).toContain('href="/movie"');
    expect(html).toContain('aria-current="page" href="/finance"');
  });
});
