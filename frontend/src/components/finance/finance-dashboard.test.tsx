import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FinanceDashboard } from "./finance-dashboard";

describe("FinanceDashboard", () => {
  it("renders loading state without the removed finance hero copy", () => {
    const html = renderToStaticMarkup(<FinanceDashboard />);

    expect(html).toContain("finance-dashboard");
    expect(html).not.toContain("finance-dashboard-hero");
    expect(html).not.toContain("Tổng quan Tài chính");
    expect(html).not.toContain("Thêm giao dịch");
    expect(html).not.toContain("Mức sử dụng");
    expect(html).toContain("Đang tải dữ liệu tài chính");
  });
});
