import { describe, expect, it } from "vitest";

import {
  calculatePercentage,
  formatFinanceAmountInput,
  formatFinanceDate,
  formatFinanceMoney,
  normalizeFinanceAmountInput,
  parseFinanceAmountInput,
} from "./finance-format";

describe("finance format helpers", () => {
  it("formats money in Vietnamese Dong", () => {
    expect(formatFinanceMoney(25000)).toBe("25.000 ₫");
  });

  it("formats ISO date in the Vietnam timezone used by the finance workspace", () => {
    expect(formatFinanceDate("2026-06-10T00:00:00.000Z")).toBe("10/06/2026");
    expect(formatFinanceDate("2026-06-20T17:30:00.000Z")).toBe("21/06/2026");
  });

  it("calculates budget usage percentage", () => {
    expect(calculatePercentage(25000, 100000)).toBe(25);
    expect(calculatePercentage(25000, 0)).toBe(0);
  });
});

describe("finance amount input helpers", () => {
  it("normalizes non-digit characters before formatting", () => {
    expect(normalizeFinanceAmountInput(" 01a2.300đ ")).toBe("12300");
    expect(normalizeFinanceAmountInput("000")).toBe("0");
    expect(normalizeFinanceAmountInput("abc")).toBe("");
  });

  it("formats grouped money input for typing", () => {
    expect(formatFinanceAmountInput("1")).toBe("1");
    expect(formatFinanceAmountInput("1000")).toBe("1.000");
    expect(formatFinanceAmountInput("1000000")).toBe("1.000.000");
    expect(formatFinanceAmountInput("001250000")).toBe("1.250.000");
  });

  it("parses formatted money input back to a number", () => {
    expect(parseFinanceAmountInput("1.250.000")).toBe(1250000);
    expect(parseFinanceAmountInput("0")).toBe(0);
    expect(parseFinanceAmountInput("")).toBeNull();
  });
});
