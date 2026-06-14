import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BudgetUsageChart } from "./budget-usage-chart";

describe("BudgetUsageChart", () => {
  it("renders the label and usage percentage", () => {
    const html = renderToStaticMarkup(<BudgetUsageChart label="Mức sử dụng ngân sách" spent={25000} budget={100000} />);

    expect(html).toContain("Mức sử dụng ngân sách");
    expect(html).toContain("25.0%");
    expect(html).toContain("25.000");
    expect(html).toContain("100.000");
    expect(html).toContain("role=\"img\"");
    expect(html).toContain("Biểu đồ Mức sử dụng ngân sách");
  });

  it("renders a no-budget fallback", () => {
    const html = renderToStaticMarkup(<BudgetUsageChart label="Mức sử dụng ngân sách" spent={25000} budget={0} />);

    expect(html).toContain("Mức sử dụng ngân sách");
    expect(html).toContain("Chưa có ngân sách");
    expect(html).not.toContain("role=\"img\"");
  });
});
