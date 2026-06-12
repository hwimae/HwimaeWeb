import type { FinanceBudget, FinanceCategory } from "../../types/finance";

export type BudgetSavePlan =
  | { type: "create"; categoryId: string; limitAmount: number }
  | { type: "update"; budgetId: string; categoryId: string; limitAmount: number }
  | { type: "delete"; budgetId: string };

export function buildBudgetSavePlans(
  categories: FinanceCategory[],
  budgets: FinanceBudget[],
  drafts: Record<string, number>,
): BudgetSavePlan[] {
  const plans: BudgetSavePlan[] = [];

  for (const category of categories) {
    const limitAmount = drafts[category.id] ?? 0;
    const existingBudget = budgets.find((budget) => budget.categoryId === category.id);

    if (existingBudget && limitAmount <= 0) {
      plans.push({ type: "delete", budgetId: existingBudget.id });
      continue;
    }

    if (existingBudget && existingBudget.limitAmount !== limitAmount) {
      plans.push({ type: "update", budgetId: existingBudget.id, categoryId: existingBudget.categoryId, limitAmount });
      continue;
    }

    if (!existingBudget && limitAmount > 0) {
      plans.push({ type: "create", categoryId: category.id, limitAmount });
    }
  }

  return plans;
}
