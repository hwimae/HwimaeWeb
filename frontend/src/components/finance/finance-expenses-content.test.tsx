import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { FinanceCategory } from "../../types/finance";
import { buildFinanceExpenseHighlights } from "./finance-expenses-summary";
import { FinanceExpensesContent, type FinanceExpenseDraft } from "./finance-expenses-content";

const categories: FinanceCategory[] = [
  { id: "food", name: "Ăn uống" },
  { id: "home", name: "Nhà cửa" },
];

const draft: FinanceExpenseDraft = {
  merchantName: "",
  description: "",
  amount: "",
  categoryId: "",
  spentAt: "",
};

describe("FinanceExpensesContent", () => {
  it("renders the redesigned hero, form, AI placeholder, and history table", () => {
    const highlights = buildFinanceExpenseHighlights(
      categories,
      [
        {
          id: "expense-1",
          amount: 850_000,
          merchantName: "Tiền điện",
          description: "Qua ví điện tử",
          spentAt: "2026-06-21T08:00:00.000Z",
          categoryId: "home",
        },
      ],
      new Date("2026-06-23T10:00:00.000Z"),
    );

    const html = renderToStaticMarkup(
      <FinanceExpensesContent
        categories={categories}
        highlights={highlights}
        draft={draft}
        isSubmitting={false}
        submitMessage={null}
        onSubmit={(event) => event.preventDefault()}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain("Tổng chi tiêu tháng này");
    expect(html).toContain("Cao nhất");
    expect(html).toContain("Danh mục chính");
    expect(html).toContain("Thêm khoản chi mới");
    expect(html).toContain("AI Phân tích");
    expect(html).toContain("Khu vực AI phân tích sẽ được bổ sung sau");
    expect(html).toContain("Lịch sử chi tiêu");
    expect(html).toContain("Tiền điện");
    expect(html).toContain("disabled");
  });

  it("renders fallbacks when there are no expenses yet", () => {
    const highlights = buildFinanceExpenseHighlights(categories, [], new Date("2026-06-23T10:00:00.000Z"));

    const html = renderToStaticMarkup(
      <FinanceExpensesContent
        categories={categories}
        highlights={highlights}
        draft={draft}
        isSubmitting={false}
        submitMessage={null}
        onSubmit={(event) => event.preventDefault()}
        onDraftChange={vi.fn()}
      />,
    );

    expect(html).toContain("Chưa có dữ liệu");
    expect(html).toContain("Chưa có khoản chi nào.");
  });
});
