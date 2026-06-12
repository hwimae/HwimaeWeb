import type { FinanceBudget, FinanceCategory, SpendingSummary } from "../../types/finance";

export type FinanceCategoryMetric = FinanceCategory & {
  color: string;
  spent: number;
  budget: number;
};

export function buildFinanceCategoryMetrics(
  categories: FinanceCategory[],
  budgets: FinanceBudget[],
  summary: SpendingSummary | null,
): FinanceCategoryMetric[] {
  return categories.map((category) => {
    const spent = summary?.categories.find((item) => item.categoryId === category.id)?.amount ?? 0;
    const budget = budgets.find((item) => item.categoryId === category.id)?.limitAmount ?? 0;

    return {
      ...category,
      color: category.color ?? "#334155",
      spent,
      budget,
    };
  });
}
