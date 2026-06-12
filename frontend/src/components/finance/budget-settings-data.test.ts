import { describe, expect, it } from "vitest";

import { buildBudgetSavePlans } from "./budget-settings-data";

describe("buildBudgetSavePlans", () => {
  it("plans delete when an existing budget is reset to zero", () => {
    expect(
      buildBudgetSavePlans(
        [{ id: "cat1", name: "Ăn uống" }],
        [{ id: "budget1", categoryId: "cat1", limitAmount: 1000000, period: "monthly", alertThreshold: 0.8 }],
        { cat1: 0 },
      ),
    ).toEqual([{ type: "delete", budgetId: "budget1" }]);
  });
});
