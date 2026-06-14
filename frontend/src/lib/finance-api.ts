import { API_URL, ApiError, apiGet, apiPost } from "./api";
import { getAccessToken } from "./auth";
import {
  parseFinanceBudget,
  parseFinanceBudgets,
  parseFinanceCategories,
  parseFinanceChatMessageResponse,
  parseFinanceChatStartResponse,
  parseFinanceExpense,
  parseFinanceExpenses,
  parseFinanceGroupDetail,
  parseFinanceGroupMember,
  parseFinanceGroupMemberDashboard,
  parseFinanceGroups,
  parseFinanceInvoiceProcessResponse,
  parseSpendingSummary,
  type FinanceBudget,
  type FinanceCategory,
  type FinanceChatMessageResponse,
  type FinanceChatStartResponse,
  type FinanceExpense,
  type FinanceGroupDetail,
  type FinanceGroupMember,
  type FinanceGroupMemberDashboard,
  type FinanceGroupSummary,
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

async function readFinanceErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const json = (await response.json()) as unknown;
    if (json && typeof json === "object" && typeof (json as { message?: unknown }).message === "string") {
      return (json as { message: string }).message;
    }
  } catch {
    return fallback;
  }

  return fallback;
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

export async function listFinanceGroups(options: FinanceRequestOptions = {}): Promise<FinanceGroupSummary[]> {
  return apiGet("/finance/groups", requireToken(), parseFinanceGroups, options);
}

export async function createFinanceGroup(body: unknown, options: FinanceRequestOptions = {}): Promise<FinanceGroupDetail> {
  return apiPost("/finance/groups", body, requireToken(), parseFinanceGroupDetail, options);
}

export async function getFinanceGroup(groupId: string, options: FinanceRequestOptions = {}): Promise<FinanceGroupDetail> {
  return apiGet(`/finance/groups/${groupId}`, requireToken(), parseFinanceGroupDetail, options);
}

export async function addFinanceGroupMember(groupId: string, body: unknown, options: FinanceRequestOptions = {}): Promise<FinanceGroupMember> {
  return apiPost(`/finance/groups/${groupId}/members`, body, requireToken(), parseFinanceGroupMember, options);
}

export async function listFinanceGroupMemberExpenses(groupId: string, memberUserId: string, options: FinanceRequestOptions = {}): Promise<FinanceExpense[]> {
  return apiGet(`/finance/groups/${groupId}/members/${memberUserId}/expenses`, requireToken(), parseFinanceExpenses, options);
}

export async function listFinanceGroupMemberBudgets(groupId: string, memberUserId: string, options: FinanceRequestOptions = {}): Promise<FinanceBudget[]> {
  return apiGet(`/finance/groups/${groupId}/members/${memberUserId}/budgets`, requireToken(), parseFinanceBudgets, options);
}

async function deleteFinanceResource(path: string, options: FinanceRequestOptions = {}): Promise<void> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${requireToken()}`,
    },
    signal: options.signal,
  });

  if (!response.ok) {
    const fallback = `DELETE ${path} failed with status ${response.status}`;
    throw new ApiError("DELETE", path, response.status, await readFinanceErrorMessage(response, fallback));
  }
}

export async function deleteFinanceGroupMember(groupId: string, memberUserId: string, options: FinanceRequestOptions = {}): Promise<void> {
  return deleteFinanceResource(`/finance/groups/${groupId}/members/${memberUserId}`, options);
}

export async function deleteFinanceGroup(groupId: string, options: FinanceRequestOptions = {}): Promise<void> {
  return deleteFinanceResource(`/finance/groups/${groupId}`, options);
}

export async function getFinanceGroupMemberDashboard(groupId: string, memberUserId: string, options: FinanceRequestOptions = {}): Promise<FinanceGroupMemberDashboard> {
  return apiGet(`/finance/groups/${groupId}/members/${memberUserId}/dashboard`, requireToken(), parseFinanceGroupMemberDashboard, options);
}

export async function deleteFinanceGroupMemberExpense(groupId: string, memberUserId: string, expenseId: string, options: FinanceRequestOptions = {}): Promise<void> {
  return deleteFinanceResource(`/finance/groups/${groupId}/members/${memberUserId}/expenses/${expenseId}`, options);
}

export async function deleteFinanceGroupMemberBudget(groupId: string, memberUserId: string, budgetId: string, options: FinanceRequestOptions = {}): Promise<void> {
  return deleteFinanceResource(`/finance/groups/${groupId}/members/${memberUserId}/budgets/${budgetId}`, options);
}

export async function startFinanceChat(input: { sessionTitle?: string } = {}, options: FinanceRequestOptions = {}): Promise<FinanceChatStartResponse> {
  return apiPost("/finance/chat/start", input, requireToken(), parseFinanceChatStartResponse, options);
}

export type SendFinanceChatMessageOptions = {
  messageType?: "text" | "image";
  isConfirmationResponse?: boolean;
  pendingExpense?: unknown;
  signal?: AbortSignal;
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
    { signal: options.signal },
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
