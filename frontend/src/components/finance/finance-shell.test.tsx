import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/finance/dashboard",
}));

import { FinanceShell } from "./finance-shell";

describe("FinanceShell", () => {
  it("renders the finance workspace intro and nav surface", () => {
    const html = renderToStaticMarkup(
      <FinanceShell>
        <section><p>Nội dung dashboard</p></section>
      </FinanceShell>,
    );

    expect(html).toContain("Tài chính cá nhân");
    expect(html).toContain("Điều hướng tài chính");
    expect(html).toContain("Khu tài chính");
    expect(html).toContain("Nội dung dashboard");
  });
});
