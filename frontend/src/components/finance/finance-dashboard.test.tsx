import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FinanceDashboard } from "./finance-dashboard";

describe("FinanceDashboard", () => {
  it("renders the finance reference dashboard hero shell while data is loading", () => {
    const html = renderToStaticMarkup(<FinanceDashboard />);

    expect(html).toContain("finance-dashboard");
    expect(html).toContain("finance-dashboard-hero");
    expect(html).toContain("Tổng quan Tài chính");
    expect(html).toContain("Thêm giao dịch");
    expect(html).toContain("dữ liệu đã ghi nhận");
    expect(html).toContain("Đang tải dữ liệu tài chính");
  });
});
