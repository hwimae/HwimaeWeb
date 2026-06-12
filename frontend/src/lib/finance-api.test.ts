import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createFinanceExpense,
  deleteFinanceBudget,
  listFinanceBudgets,
  listFinanceExpenses,
  uploadFinanceInvoice,
  upsertFinanceBudget,
} from "./finance-api";

describe("finance API wrapper", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports expense and budget helpers used by finance UI", () => {
    expect(listFinanceExpenses).toEqual(expect.any(Function));
    expect(createFinanceExpense).toEqual(expect.any(Function));
    expect(listFinanceBudgets).toEqual(expect.any(Function));
    expect(upsertFinanceBudget).toEqual(expect.any(Function));
    expect(deleteFinanceBudget).toEqual(expect.any(Function));
    expect(uploadFinanceInvoice).toEqual(expect.any(Function));
  });

  it("parses invoice upload response before returning", async () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => "token-123"),
      },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          invoice: {
            id: "invoice-1",
            userId: "user-1",
            filename: "receipt.png",
            filePath: "/uploads/receipt.png",
            storeName: "Highlands",
            purchasedAt: "2026-06-11T08:30:00.000Z",
            totalAmount: "45000",
            extractedData: { rawText: "45.000" },
            status: "processed",
            createdAt: "2026-06-11T08:30:00.000Z",
            updatedAt: "2026-06-11T08:31:00.000Z",
          },
          pendingExpense: {
            invoiceId: "invoice-1",
            merchantName: "Highlands",
            description: "45.000",
            amount: 45000,
            spentAt: "2026-06-11T08:30:00.000Z",
            sourceType: "image",
          },
        }),
      })),
    );

    const response = await uploadFinanceInvoice(new File(["receipt"], "receipt.png", { type: "image/png" }));

    expect(response).toEqual({
      invoice: {
        id: "invoice-1",
        userId: "user-1",
        filename: "receipt.png",
        filePath: "/uploads/receipt.png",
        storeName: "Highlands",
        purchasedAt: "2026-06-11T08:30:00.000Z",
        totalAmount: 45000,
        extractedData: { rawText: "45.000" },
        status: "processed",
        createdAt: "2026-06-11T08:30:00.000Z",
        updatedAt: "2026-06-11T08:31:00.000Z",
      },
      pendingExpense: {
        invoiceId: "invoice-1",
        merchantName: "Highlands",
        description: "45.000",
        amount: 45000,
        spentAt: "2026-06-11T08:30:00.000Z",
        sourceType: "image",
      },
    });
  });
});
