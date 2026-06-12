import type { FinanceChatMessageResponse } from "../../types/finance";
import { formatFinanceMoney } from "./finance-format";

type AssistantMessageResponse = Pick<FinanceChatMessageResponse, "assistantMessage">;

type PendingExpenseSummary = NonNullable<FinanceChatMessageResponse["extractedExpense"]>;

export function getAssistantMessage(response: AssistantMessageResponse): string {
  return response.assistantMessage;
}

export function buildPendingExpenseSummary(expense: PendingExpenseSummary): string {
  const merchant = expense.merchantName ?? "Không rõ nơi chi";
  const amount = typeof expense.amount === "number" ? formatFinanceMoney(expense.amount) : "chưa rõ số tiền";
  const category = expense.categoryName ? ` thuộc nhóm ${expense.categoryName}` : "";

  return `${merchant}: ${amount}${category}`;
}
