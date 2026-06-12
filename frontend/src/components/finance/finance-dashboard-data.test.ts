import { describe, expect, it } from "vitest";

import { buildFinanceCategoryMetrics } from "./finance-dashboard-data";

describe("buildFinanceCategoryMetrics", () => {
  it("combines category spending with real budget limits", () => {
    expect(
      buildFinanceCategoryMetrics(
        [{ id: "cat1", name: "Ăn uống", color: "#ef4444" }],
        [{ id: "budget1", categoryId: "cat1", limitAmount: 1000000, period: "monthly", alertThreshold: 0.8 }],
        { totalAmount: 25000, categories: [{ categoryId: "cat1", categoryName: "Ăn uống", amount: 25000 }] },
      ),
    ).toEqual([{ id: "cat1", name: "Ăn uống", color: "#ef4444", spent: 25000, budget: 1000000 }]);
  });
});
