import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BudgetInsights } from "./budget-insights";

const baseCategory = {
  description: null,
  icon: null,
  displayOrder: 0,
};

describe("BudgetInsights", () => {
  it("renders the highest exceeded budget category", () => {
    const html = renderToStaticMarkup(
      <BudgetInsights
        totalSpent={180000}
        totalBudget={150000}
        categories={[
          { ...baseCategory, id: "cat1", name: "Ăn uống", spent: 120000, budget: 100000, color: "#ef4444" },
          { ...baseCategory, id: "cat2", name: "Đi lại", spent: 60000, budget: 50000, color: "#f97316" },
        ]}
      />,
    );

    expect(html).toContain("finance-alert-list");
    expect(html).toContain("finance-budget-alert");
    expect(html).toContain("is-exceeded");
    expect(html).toContain("Vượt ngân sách");
    expect(html).toContain("Ăn uống");
  });

  it("renders a near-limit warning when no category exceeds budget", () => {
    const html = renderToStaticMarkup(
      <BudgetInsights
        totalSpent={80000}
        totalBudget={100000}
        categories={[{ ...baseCategory, id: "cat1", name: "Đi lại", spent: 80000, budget: 100000, color: "#f97316" }]}
      />,
    );

    expect(html).toContain("Gần vượt ngân sách");
    expect(html).toContain("Đi lại");
  });

  it("renders a safe state when all budgeted categories are below threshold", () => {
    const html = renderToStaticMarkup(
      <BudgetInsights
        totalSpent={40000}
        totalBudget={100000}
        categories={[{ ...baseCategory, id: "cat1", name: "Giải trí", spent: 40000, budget: 100000, color: "#22c55e" }]}
      />,
    );

    expect(html).toContain("Các danh mục vẫn trong ngưỡng an toàn");
  });

  it("renders a no-total-budget state", () => {
    const html = renderToStaticMarkup(
      <BudgetInsights
        totalSpent={40000}
        totalBudget={0}
        categories={[{ ...baseCategory, id: "cat1", name: "Khác", spent: 40000, budget: 0, color: "#334155" }]}
      />,
    );

    expect(html).toContain("Chưa có ngân sách tổng để theo dõi");
  });
});
