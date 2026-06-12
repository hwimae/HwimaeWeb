import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FinanceExpenses } from "./finance-expenses";

describe("FinanceExpenses", () => {
  it("renders expenses page shell", () => {
    const html = renderToStaticMarkup(<FinanceExpenses />);

    expect(html).toContain("Danh sách chi tiêu");
    expect(html).toContain("Tổng đã ghi nhận");
    expect(html).toContain("Đang tải chi tiêu");
  });
});
