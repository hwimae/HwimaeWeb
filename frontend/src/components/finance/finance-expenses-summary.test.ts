import { describe, expect, it } from "vitest";

import type { FinanceCategory, FinanceExpense } from "../../types/finance";
import { buildFinanceExpenseHighlights } from "./finance-expenses-summary";

const categories: FinanceCategory[] = [
  { id: "food", name: "Ăn uống" },
  { id: "home", name: "Nhà cửa" },
];

const expenses: FinanceExpense[] = [
  {
    id: "expense-1",
    amount: 120_000,
    merchantName: "Circle K",
    spentAt: "2026-06-20T08:00:00.000Z",
    categoryId: "food",
  },
  {
    id: "expense-2",
    amount: 850_000,
    merchantName: "Tiền điện",
    spentAt: "2026-06-21T08:00:00.000Z",
    categoryId: "home",
  },
  {
    id: "expense-3",
    amount: 45_000,
    merchantName: "GrabBike",
    spentAt: "2026-06-22T08:00:00.000Z",
    categoryId: "food",
  },
  {
    id: "expense-4",
    amount: 2_000_000,
    merchantName: "Thuê nhà tháng trước",
    spentAt: "2026-05-30T08:00:00.000Z",
    categoryId: "home",
  },
];

describe("buildFinanceExpenseHighlights", () => {
  it("returns month-scoped total amount, newest-first sorting, highest expense, and top category", () => {
    const result = buildFinanceExpenseHighlights(categories, expenses, new Date("2026-06-23T10:00:00.000Z"));

    expect(result.totalAmount).toBe(1_015_000);
    expect(result.sortedExpenses.map((expense) => expense.id)).toEqual(["expense-3", "expense-2", "expense-1", "expense-4"]);
    expect(result.highestExpense?.id).toBe("expense-2");
    expect(result.topCategory).toEqual({ label: "Nhà cửa", amount: 850_000 });
    expect(result.categoryMap.food.name).toBe("Ăn uống");
  });

  it("returns null highlights and zero total for an empty expense list", () => {
    const result = buildFinanceExpenseHighlights(categories, [], new Date("2026-06-23T10:00:00.000Z"));

    expect(result.totalAmount).toBe(0);
    expect(result.sortedExpenses).toEqual([]);
    expect(result.highestExpense).toBeNull();
    expect(result.topCategory).toBeNull();
  });

  it("falls back to 'Khác' when an expense has no matching category", () => {
    const result = buildFinanceExpenseHighlights(
      [],
      [
        {
          id: "expense-x",
          amount: 300_000,
          merchantName: "Không rõ",
          spentAt: "2026-06-23T08:00:00.000Z",
          categoryId: "unknown",
        },
      ],
      new Date("2026-06-23T10:00:00.000Z"),
    );

    expect(result.topCategory).toEqual({ label: "Khác", amount: 300_000 });
  });
});
