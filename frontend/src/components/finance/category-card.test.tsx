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

    expect(html).toContain("Ăn uống");
    expect(html).toContain("25.000");
    expect(html).toContain("100.000");
    expect(html).toContain("Mức sử dụng ngân sách Ăn uống");
    const progressTag = ["<", "progress"].join("");

    expect(html).toContain("25.0%");
    expect(html).not.toContain(progressTag);
  });
});
