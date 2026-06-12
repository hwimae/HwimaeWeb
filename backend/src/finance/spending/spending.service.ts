import { Prisma } from '@prisma/client';
import type { BackendDeps } from '../../dependencies';

type ExpenseForSummary = { amount: number | Prisma.Decimal | { toString(): string }; category: { id: string; name: string } | null };

export type SpendingSummary = {
  totalAmount: number;
  categories: Array<{ categoryId: string | null; categoryName: string; amount: number }>;
};

function toDecimal(amount: ExpenseForSummary['amount']): Prisma.Decimal {
  return new Prisma.Decimal(amount.toString());
}

export function summarizeExpenses(expenses: ExpenseForSummary[]): SpendingSummary {
  const totals = new Map<string, { categoryId: string | null; categoryName: string; amount: Prisma.Decimal }>();
  let totalAmount = new Prisma.Decimal(0);

  for (const expense of expenses) {
    const amount = toDecimal(expense.amount);
    totalAmount = totalAmount.add(amount);
    const categoryId = expense.category?.id ?? null;
    const key = categoryId ?? 'uncategorized';
    const current = totals.get(key) ?? { categoryId, categoryName: expense.category?.name ?? 'Chưa phân loại', amount: new Prisma.Decimal(0) };
    current.amount = current.amount.add(amount);
    totals.set(key, current);
  }

  return {
    totalAmount: totalAmount.toNumber(),
    categories: [...totals.values()]
      .map((category) => ({ ...category, amount: category.amount.toNumber() }))
      .sort((a, b) => b.amount - a.amount),
  };
}

export type FinanceSpendingService = {
  summary(userId: string): Promise<SpendingSummary>;
};

export function createFinanceSpendingService(deps: Pick<BackendDeps, 'prisma'>): FinanceSpendingService {
  return {
    async summary(userId) {
      const expenses = await deps.prisma.financeExpense.findMany({ where: { userId }, include: { category: true } });
      return summarizeExpenses(expenses);
    },
  };
}
