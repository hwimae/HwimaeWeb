import { describe, expect, it } from "vitest";

import { getAssistantMessage } from "./finance-chat-message";
import { getFinanceChatRetryAction } from "./finance-chat";

describe("getAssistantMessage", () => {
  it("reads assistantMessage from finance chat API response", () => {
    expect(getAssistantMessage({ assistantMessage: "Mình đã nhận tin nhắn." })).toBe("Mình đã nhận tin nhắn.");
  });
});

describe("getFinanceChatRetryAction", () => {
  it("reloads session only when sessionId is missing", () => {
    expect(getFinanceChatRetryAction(null)).toBe("load-session");
    expect(getFinanceChatRetryAction("session-1")).toBe("retry-send");
  });
});
