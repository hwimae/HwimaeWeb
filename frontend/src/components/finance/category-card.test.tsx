import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CategoryCard } from "./category-card";

describe("CategoryCard", () => {
  it("renders category budget and spending summary", () => {
    const html = renderToStaticMarkup(
      <CategoryCard
        category={{
          id: "cat1",
          name: "Ăn uống",
          color: "#ef4444",
          spent: 25000,
          budget: 100000,
        }}
      />,
    );

    expect(html).toContain("finance-category-card");
    expect(html).toContain("finance-category-icon");
    expect(html).toContain("finance-category-metrics");
    expect(html).toContain("Ăn uống");
    expect(html).toContain("25.000");
    expect(html).toContain("100.000");
    expect(html).toContain("Mức sử dụng ngân sách Ăn uống");
    const progressTag = ["<", "progress"].join("");

    expect(html).toContain("25.0%");
    expect(html).not.toContain(progressTag);
  });

  it("marks spending without a budget as missing a budget instead of under control", () => {
    const html = renderToStaticMarkup(
      <CategoryCard
        category={{
          id: "cat2",
          name: "Giải trí",
          color: "#22c55e",
          spent: 50000,
          budget: 0,
        }}
      />,
    );

    expect(html).toContain("Chưa đặt ngân sách");
    expect(html).not.toContain("Đang kiểm soát");
  });
});
