import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/finance/dashboard",
}));

import { FINANCE_NAV_ITEMS, FinanceNav } from "./finance-nav";

describe("FinanceNav", () => {
  it("renders finance navigation links", () => {
    const html = renderToStaticMarkup(<FinanceNav />);

    expect(html).toContain('aria-label="Điều hướng tài chính"');
    expect(FINANCE_NAV_ITEMS.map((item) => item.href)).toEqual([
      "/finance/dashboard",
      "/finance/chat",
      "/finance/expenses",
      "/finance/budgets",
      "/finance/groups",
    ]);

    expect(html).toContain('href="/finance/dashboard"');
    expect(html).toContain('href="/finance/chat"');
    expect(html).toContain('href="/finance/expenses"');
    expect(html).toContain('href="/finance/budgets"');
    expect(html).toContain('href="/finance/groups"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("workspace-nav-link");
  });

  it("renders the rail variant for finance groups shells", () => {
    const html = renderToStaticMarkup(<FinanceNav variant="rail" />);

    expect(html).toContain("finance-nav-rail");
    expect(html).toContain("workspace-tabs-vertical");
    expect(html).toContain('href="/finance/groups"');
  });
});
