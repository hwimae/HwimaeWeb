import { describe, expect, it } from "vitest";

import {
  parseFinanceBudget,
  parseFinanceBudgets,
  parseFinanceCategory,
  parseFinanceChatMessageResponse,
  parseFinanceChatStartResponse,
  parseFinanceExpenses,
  parseFinanceInvoiceProcessResponse,
  parseSpendingSummary,
} from "./finance";

describe("finance parsers", () => {
  it("parses finance category", () => {
    expect(parseFinanceCategory({ id: "cat1", name: "Ăn uống" })).toEqual({ id: "cat1", name: "Ăn uống" });
  });

  it("rejects finance category with invalid optional fields", () => {
    expect(() => parseFinanceCategory({ id: "cat1", name: "Ăn uống", displayOrder: "1" })).toThrow(
      "Invalid finance category",
    );
  });

  it("parses spending summary", () => {
    expect(parseSpendingSummary({ totalAmount: 25000, categories: [] })).toEqual({ totalAmount: 25000, categories: [] });
  });

  it("parses spending summary decimal strings", () => {
    expect(parseSpendingSummary({ totalAmount: "25000", categories: [{ categoryId: "cat1", categoryName: "Ăn uống", amount: "25000" }] })).toEqual({
      totalAmount: 25000,
      categories: [{ categoryId: "cat1", categoryName: "Ăn uống", amount: 25000 }],
    });
  });

  it("rejects spending summary with invalid category totals", () => {
    expect(() =>
      parseSpendingSummary({
        totalAmount: 25000,
        categories: [{ categoryId: {}, categoryName: 2, amount: "100" }],
      }),
    ).toThrow("Invalid spending summary");
  });

  it("parses finance chat start response", () => {
    expect(parseFinanceChatStartResponse({ sessionId: "session-1", initialMessage: "Xin chào" })).toEqual({
      sessionId: "session-1",
      initialMessage: "Xin chào",
    });
  });

  it("parses finance budget", () => {
    expect(
      parseFinanceBudget({
        id: "budget-1",
        categoryId: "cat1",
        limitAmount: 1000000,
        period: "monthly",
        alertThreshold: 0.8,
        category: { id: "cat1", name: "Ăn uống" },
      }),
    ).toEqual({
      id: "budget-1",
      categoryId: "cat1",
      limitAmount: 1000000,
      period: "monthly",
      alertThreshold: 0.8,
      category: { id: "cat1", name: "Ăn uống" },
    });
  });

  it("parses finance budgets list", () => {
    expect(
      parseFinanceBudgets([
        { id: "budget-1", categoryId: "cat1", limitAmount: 1000000, period: "monthly", alertThreshold: 0.8 },
      ]),
    ).toEqual([
      { id: "budget-1", categoryId: "cat1", limitAmount: 1000000, period: "monthly", alertThreshold: 0.8 },
    ]);
  });

  it("parses finance expenses list", () => {
    expect(
      parseFinanceExpenses([
        { id: "exp-1", amount: 25000, merchantName: "Highlands", spentAt: "2026-06-10T00:00:00.000Z" },
      ]),
    ).toEqual([
      { id: "exp-1", amount: 25000, merchantName: "Highlands", spentAt: "2026-06-10T00:00:00.000Z" },
    ]);
  });

  it("rejects rollover spentAt dates", () => {
    expect(() => parseFinanceExpenses([{ id: "exp-1", amount: 25000, spentAt: "2026-02-30T00:00:00.000Z" }])).toThrow(
      "Invalid finance expense",
    );
  });

  it("rejects finance expense with invalid spentAt", () => {
    expect(() => parseFinanceExpenses([{ id: "exp-1", amount: 25000, spentAt: "khong-hop-le" }])).toThrow(
      "Invalid finance expense",
    );
  });

  it("parses invoice process response", () => {
    expect(
      parseFinanceInvoiceProcessResponse({
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
    ).toEqual({
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

  it("parses finance chat message response", () => {
    expect(
      parseFinanceChatMessageResponse({
        assistantMessage: "Mình đã ghi nhận tin nhắn.",
        requiresConfirmation: true,
        askingConfirmation: false,
        interrupted: false,
      }),
    ).toEqual({
      assistantMessage: "Mình đã ghi nhận tin nhắn.",
      extractedExpense: null,
      savedExpense: null,
      budgetWarning: null,
      advice: null,
      requiresConfirmation: true,
      askingConfirmation: false,
      interrupted: false,
    });
  });

  it("parses saved expense from finance chat response", () => {
    expect(
      parseFinanceChatMessageResponse({
        assistantMessage: "Đã lưu khoản chi.",
        extractedExpense: null,
        savedExpense: { id: "expense1", amount: 25000 },
        requiresConfirmation: false,
        askingConfirmation: false,
        interrupted: false,
      }),
    ).toMatchObject({
      savedExpense: { id: "expense1", amount: 25000 },
    });
  });
});
