import { API_URL, apiGet, apiPost } from "./api";
import { getAccessToken } from "./auth";
import {
  parseFinanceBudget,
  parseFinanceBudgets,
  parseFinanceCategories,
  parseFinanceChatMessageResponse,
  parseFinanceChatStartResponse,
  parseFinanceExpense,
  parseFinanceExpenses,
  parseFinanceInvoiceProcessResponse,
  parseSpendingSummary,
  type FinanceBudget,
  type FinanceCategory,
  type FinanceChatMessageResponse,
  type FinanceChatStartResponse,
  type FinanceExpense,
  type FinanceInvoiceProcessResponse,
  type SpendingSummary,
} from "../types/finance";

type FinanceRequestOptions = {
  signal?: AbortSignal;
};

function requireToken(): string {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn cần đăng nhập để sử dụng tính năng tài chính.");
  }

  return token;
}

export async function getFinanceCategories(options: FinanceRequestOptions = {}): Promise<FinanceCategory[]> {
  return apiGet("/finance/categories", requireToken(), parseFinanceCategories, options);
}

export async function getFinanceSpendingSummary(options: FinanceRequestOptions = {}): Promise<SpendingSummary> {
  return apiGet("/finance/spending/summary", requireToken(), parseSpendingSummary, options);
}

export async function listFinanceExpenses(options: FinanceRequestOptions = {}): Promise<FinanceExpense[]> {
  return apiGet("/finance/expenses", requireToken(), parseFinanceExpenses, options);
}

export async function createFinanceExpense(body: unknown, options: FinanceRequestOptions = {}): Promise<FinanceExpense> {
  return apiPost("/finance/expenses", body, requireToken(), parseFinanceExpense, options);
}

export async function listFinanceBudgets(options: FinanceRequestOptions = {}): Promise<FinanceBudget[]> {
  return apiGet("/finance/budgets", requireToken(), parseFinanceBudgets, options);
}

export async function upsertFinanceBudget(body: unknown, options: FinanceRequestOptions = {}): Promise<FinanceBudget> {
  return apiPost("/finance/budgets", body, requireToken(), parseFinanceBudget, options);
}

export async function deleteFinanceBudget(budgetId: string, options: FinanceRequestOptions = {}): Promise<void> {
  const response = await fetch(`${API_URL}/finance/budgets/${budgetId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${requireToken()}`,
    },
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`DELETE /finance/budgets/${budgetId} failed with status ${response.status}`);
  }
}

export async function startFinanceChat(input: { sessionTitle?: string } = {}, options: FinanceRequestOptions = {}): Promise<FinanceChatStartResponse> {
  return apiPost("/finance/chat/start", input, requireToken(), parseFinanceChatStartResponse, options);
}

export type SendFinanceChatMessageOptions = {
  messageType?: "text" | "image";
  isConfirmationResponse?: boolean;
  pendingExpense?: unknown;
};

export async function sendFinanceChatMessage(
  sessionId: string,
  content: string,
  options: SendFinanceChatMessageOptions = {},
): Promise<FinanceChatMessageResponse> {
  return apiPost(
    `/finance/chat/${sessionId}/message`,
    {
      content,
      messageType: options.messageType ?? "text",
      isConfirmationResponse: options.isConfirmationResponse ?? false,
      pendingExpense: options.pendingExpense,
    },
    requireToken(),
    parseFinanceChatMessageResponse,
  );
}

export async function uploadFinanceInvoice(file: File): Promise<FinanceInvoiceProcessResponse> {
  const token = requireToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/finance/invoices/process`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`POST /finance/invoices/process failed with status ${response.status}`);
  }

  const json = (await response.json()) as unknown;
  return parseFinanceInvoiceProcessResponse(json);
}
