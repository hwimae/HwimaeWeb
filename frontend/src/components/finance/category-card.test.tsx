import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CategoryCard } from "./category-card";

describe("CategoryCard", () => {
  it("renders a horizontal progress summary instead of the donut usage card", () => {
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

    expect(html).toContain("finance-category-progress");
    expect(html).toContain("25%");
    expect(html).toContain("Đã chi");
    expect(html).toContain("Ngân sách");
    expect(html).toContain("<progress");
    expect(html).not.toContain("Mức sử dụng ngân sách Ăn uống");
    expect(html).not.toContain("finance-category-metrics");
  });

  it("shows an empty progress state when the category has no budget", () => {
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

    expect(html).toContain("0%");
    expect(html).toContain("Chưa có ngân sách");
    expect(html).toContain("<progress");
    expect(html).not.toContain("Đang kiểm soát");
  });

  it("keeps the real overspend percentage visible when a category exceeds budget", () => {
    const html = renderToStaticMarkup(
      <CategoryCard
        category={{
          id: "cat3",
          name: "Nhà ở",
          color: "#3b82f6",
          spent: 160000,
          budget: 100000,
        }}
      />,
    );

    expect(html).toContain("160%");
    expect(html).toContain("Vượt hạn mức");
    expect(html).toContain("<progress");
  });
});
