import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BudgetSettings } from "./budget-settings";

describe("BudgetSettings", () => {
  it("renders budget settings heading", () => {
    const html = renderToStaticMarkup(<BudgetSettings />);

    expect(html).toContain("Ngân sách theo danh mục");
    expect(html).toContain("Thiết lập hạn mức cho từng nhóm chi tiêu cá nhân");
    expect(html).toContain("Đang tải ngân sách");
  });
});
