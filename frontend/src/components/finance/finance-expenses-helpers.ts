import type { FinanceExpenseDraft } from "./finance-expenses-content";
import { parseFinanceAmountInput } from "./finance-format";

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function buildFinanceExpensePayload(draft: FinanceExpenseDraft) {
  const amount = parseFinanceAmountInput(draft.amount);
  if (!amount || amount <= 0) {
    return null;
  }

  return {
    merchantName: draft.merchantName.trim() || undefined,
    description: draft.description.trim() || undefined,
    amount,
    categoryId: draft.categoryId || undefined,
    spentAt: toIsoDateTime(draft.spentAt),
    confirmedByUser: true as const,
    sourceType: "manual" as const,
  };
}
