import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ExpenseChart } from "./expense-chart";

describe("ExpenseChart", () => {
  it("renders the chart title and category labels", () => {
    const html = renderToStaticMarkup(
      <ExpenseChart
        categories={[
          { id: "cat1", name: "Ăn uống", spent: 25000, budget: 100000, color: "#ef4444" },
          { id: "cat2", name: "Đi lại", spent: 75000, budget: 150000, color: "#f97316" },
        ]}
      />,
    );

    expect(html).toContain("Biểu đồ chi tiêu");
    expect(html).toContain("Ăn uống");
    expect(html).toContain("Đi lại");
  });
});
