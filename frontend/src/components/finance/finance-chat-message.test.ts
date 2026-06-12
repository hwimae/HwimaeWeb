import { describe, expect, it } from "vitest";

import { buildPendingExpenseSummary, getAssistantMessage } from "./finance-chat-message";

describe("finance chat message helpers", () => {
  it("reads assistantMessage from finance chat API response", () => {
    expect(getAssistantMessage({ assistantMessage: "Mình đã nhận tin nhắn." })).toBe("Mình đã nhận tin nhắn.");
  });

  it("builds pending expense summary", () => {
    expect(
      buildPendingExpenseSummary({
        merchantName: "Highlands",
        amount: 25000,
        categoryName: "Ăn uống",
      }),
    ).toContain("Highlands");
  });
});
