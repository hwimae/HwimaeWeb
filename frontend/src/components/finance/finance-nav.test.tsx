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
    expect(FINANCE_NAV_ITEMS).toEqual([
      { href: "/finance/dashboard", label: "Dashboard" },
      { href: "/finance/chat", label: "AI" },
      { href: "/finance/expenses", label: "Chi tiêu" },
      { href: "/finance/budgets", label: "Ngân sách" },
    ]);

    FINANCE_NAV_ITEMS.forEach((item) => {
      expect(html).toContain(`href="${item.href}"`);
      expect(html).toContain(item.label);
    });
    expect(html).toContain('aria-current="page" href="/finance/dashboard"');
  });
});
