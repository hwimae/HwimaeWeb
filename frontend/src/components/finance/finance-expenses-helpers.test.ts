import { describe, expect, it } from "vitest";

import type { FinanceExpenseDraft } from "./finance-expenses-content";
import { buildFinanceExpensePayload } from "./finance-expenses-helpers";

const baseDraft: FinanceExpenseDraft = {
  merchantName: "Highlands",
  description: "Cà phê sáng",
  amount: "1.250.000",
  categoryId: "food",
  spentAt: "2026-07-01T07:30",
};

describe("buildFinanceExpensePayload", () => {
  it("turns formatted money input into a numeric expense payload", () => {
    expect(buildFinanceExpensePayload(baseDraft)).toEqual({
      merchantName: "Highlands",
      description: "Cà phê sáng",
      amount: 1250000,
      categoryId: "food",
      spentAt: "2026-07-01T00:30:00.000Z",
      confirmedByUser: true,
      sourceType: "manual",
    });
  });

  it("returns null when the amount cannot produce a positive number", () => {
    expect(buildFinanceExpensePayload({ ...baseDraft, amount: "" })).toBeNull();
    expect(buildFinanceExpensePayload({ ...baseDraft, amount: "0" })).toBeNull();
  });
});
