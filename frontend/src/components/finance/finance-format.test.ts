import { describe, expect, it } from "vitest";

import { calculatePercentage, formatFinanceDate, formatFinanceMoney } from "./finance-format";

describe("finance format helpers", () => {
  it("formats money in Vietnamese Dong", () => {
    expect(formatFinanceMoney(25000)).toBe("25.000 ₫");
  });

  it("formats ISO date for Vietnamese users", () => {
    expect(formatFinanceDate("2026-06-10T00:00:00.000Z")).toBe("10/06/2026");
  });

  it("calculates budget usage percentage", () => {
    expect(calculatePercentage(25000, 100000)).toBe(25);
    expect(calculatePercentage(25000, 0)).toBe(0);
  });
});
