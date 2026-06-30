export const FINANCE_SUBMIT_TIMEOUT_MS = 10_000;

const FINANCE_SUBMIT_TIMEOUT_REASON = "finance-submit-timeout";

export class FinanceSubmitTimeoutError extends Error {
  readonly name = "FinanceSubmitTimeoutError";

  constructor(message = "Finance submit timed out") {
    super(message);
  }
}

export function isFinanceSubmitTimeoutError(error: unknown): boolean {
  return error instanceof FinanceSubmitTimeoutError;
}

export async function runFinanceSubmitWithTimeout<T>(
  controller: AbortController,
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs = FINANCE_SUBMIT_TIMEOUT_MS,
): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    let didTimeout = false;

    const timeoutId = globalThis.setTimeout(() => {
      didTimeout = true;
      controller.abort(FINANCE_SUBMIT_TIMEOUT_REASON);
      reject(new FinanceSubmitTimeoutError());
    }, timeoutMs);

    run(controller.signal)
      .then((result) => {
        globalThis.clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        globalThis.clearTimeout(timeoutId);

        if (didTimeout || controller.signal.reason === FINANCE_SUBMIT_TIMEOUT_REASON) {
          reject(new FinanceSubmitTimeoutError());
          return;
        }

        reject(error);
      });
  });
}
