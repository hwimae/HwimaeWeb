import { describe, expect, it } from "vitest";

import { getAssistantMessage } from "./finance-chat-message";
import {
  getFinanceChatRetryAction,
  getFinanceChatStartErrorMessage,
  getFinanceChatStartTimeoutMs,
  markFinanceChatMounted,
  resetFinanceChatStartRequest,
} from "./finance-chat";

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

describe("finance chat startup helpers", () => {
  it("marks chat as mounted again when React dev remounts effects", () => {
    const mountedRef = { current: false };

    const cleanup = markFinanceChatMounted(mountedRef);

    expect(mountedRef.current).toBe(true);
    cleanup();
    expect(mountedRef.current).toBe(false);
  });

  it("resets pending start request when React dev cleanup aborts startup", () => {
    const startRequestRef = { current: true };

    resetFinanceChatStartRequest(startRequestRef);

    expect(startRequestRef.current).toBe(false);
  });

  it("uses a finite timeout for starting a finance chat session", () => {
    expect(getFinanceChatStartTimeoutMs()).toBe(15000);
  });

  it("shows timeout copy when chat startup takes too long", () => {
    expect(getFinanceChatStartErrorMessage(new DOMException("Aborted", "AbortError"), true)).toBe(
      "Khởi tạo chat tài chính quá lâu. Vui lòng thử lại.",
    );
  });

  it("keeps backend error copy when startup fails before timeout", () => {
    expect(getFinanceChatStartErrorMessage(new Error("POST /finance/chat/start failed with status 500"), false)).toBe(
      "POST /finance/chat/start failed with status 500",
    );
  });
});
