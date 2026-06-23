import type { FinanceCategory, FinanceExpense } from "../../types/finance";

export type FinanceExpenseHighlights = {
  totalAmount: number;
  sortedExpenses: FinanceExpense[];
  highestExpense: FinanceExpense | null;
  topCategory: { label: string; amount: number } | null;
  categoryMap: Record<string, FinanceCategory>;
};

const MONTH_KEY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
});

function getCategoryLabel(expense: FinanceExpense, categoryMap: Record<string, FinanceCategory>): string {
  return expense.category?.name ?? (expense.categoryId ? categoryMap[expense.categoryId]?.name : undefined) ?? "Khác";
}

function getMonthKey(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = MONTH_KEY_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return year && month ? `${year}-${month}` : null;
}

export function buildFinanceExpenseHighlights(
  categories: FinanceCategory[],
  expenses: FinanceExpense[],
  referenceDate: Date = new Date(),
): FinanceExpenseHighlights {
  const categoryMap = categories.reduce<Record<string, FinanceCategory>>((acc, category) => {
    acc[category.id] = category;
    return acc;
  }, {});

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.spentAt ?? 0).getTime() - new Date(a.spentAt ?? 0).getTime());
  const currentMonthKey = getMonthKey(referenceDate);
  const currentMonthExpenses = currentMonthKey
    ? sortedExpenses.filter((expense) => getMonthKey(expense.spentAt) === currentMonthKey)
    : [];
  const totalAmount = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const highestExpense = currentMonthExpenses.reduce<FinanceExpense | null>((current, expense) => {
    if (!current || expense.amount > current.amount) return expense;
    return current;
  }, null);

  const categoryTotals = currentMonthExpenses.reduce<Record<string, number>>((acc, expense) => {
    const label = getCategoryLabel(expense, categoryMap);
    acc[label] = (acc[label] ?? 0) + expense.amount;
    return acc;
  }, {});

  const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  return {
    totalAmount,
    sortedExpenses,
    highestExpense,
    topCategory: topCategoryEntry ? { label: topCategoryEntry[0], amount: topCategoryEntry[1] } : null,
    categoryMap,
  };
}
