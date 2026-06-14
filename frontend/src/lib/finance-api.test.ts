import { afterEach, describe, expect, it, vi } from "vitest";

import {
  addFinanceGroupMember,
  createFinanceExpense,
  createFinanceGroup,
  deleteFinanceBudget,
  deleteFinanceGroup,
  deleteFinanceGroupMemberBudget,
  deleteFinanceGroupMemberExpense,
  getFinanceGroupMemberDashboard,
  listFinanceGroupMemberBudgets,
  listFinanceGroupMemberExpenses,
  listFinanceBudgets,
  listFinanceExpenses,
  listFinanceGroups,
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

  it("exports finance group helpers", () => {
    expect(listFinanceGroups).toEqual(expect.any(Function));
    expect(createFinanceGroup).toEqual(expect.any(Function));
    expect(addFinanceGroupMember).toEqual(expect.any(Function));
    expect(getFinanceGroupMemberDashboard).toEqual(expect.any(Function));
    expect(listFinanceGroupMemberExpenses).toEqual(expect.any(Function));
    expect(listFinanceGroupMemberBudgets).toEqual(expect.any(Function));
    expect(deleteFinanceGroup).toEqual(expect.any(Function));
    expect(deleteFinanceGroupMemberExpense).toEqual(expect.any(Function));
    expect(deleteFinanceGroupMemberBudget).toEqual(expect.any(Function));
  });

  it("deletes member expense with group scoped path", async () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => "token-123"),
      },
    });
    const fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await deleteFinanceGroupMemberExpense("group-1", "user-2", "expense-1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/finance/groups/group-1/members/user-2/expenses/expense-1"),
      expect.objectContaining({ method: "DELETE", headers: { Authorization: "Bearer token-123" } }),
    );
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
