import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FINANCE_SUBMIT_TIMEOUT_MS,
  FinanceSubmitTimeoutError,
  isFinanceSubmitTimeoutError,
  runFinanceSubmitWithTimeout,
} from "./finance-submit-recovery";

describe("runFinanceSubmitWithTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("exports the default timeout for finance submit recovery", () => {
    expect(FINANCE_SUBMIT_TIMEOUT_MS).toBe(10_000);
  });

  it("resolves successful requests without changing the payload", async () => {
    const controller = new AbortController();

    await expect(runFinanceSubmitWithTimeout(controller, async () => ({ ok: true }), 50)).resolves.toEqual({ ok: true });
  });

  it("aborts and throws a typed timeout error when the request hangs", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();

    const promise = runFinanceSubmitWithTimeout(controller, () => new Promise(() => undefined), 25);
    const rejection = expect(promise).rejects.toBeInstanceOf(FinanceSubmitTimeoutError);

    await vi.advanceTimersByTimeAsync(25);

    await rejection;
    expect(controller.signal.aborted).toBe(true);
  });

  it("keeps manual aborts distinct from real timeouts", async () => {
    const controller = new AbortController();

    const promise = runFinanceSubmitWithTimeout(
      controller,
      (signal) =>
        new Promise((_, reject) => {
          signal.addEventListener(
            "abort",
            () => {
              reject(new DOMException("Aborted", "AbortError"));
            },
            { once: true },
          );
        }),
      50,
    );
    const rejection = expect(promise).rejects.toMatchObject({ name: "AbortError" });

    controller.abort();

    await rejection;
  });

  it("recognizes the timeout error via the type guard", () => {
    expect(isFinanceSubmitTimeoutError(new FinanceSubmitTimeoutError())).toBe(true);
    expect(isFinanceSubmitTimeoutError(new Error("other"))).toBe(false);
  });
});
