import type { Prisma } from '@prisma/client';
import type { BackendDeps } from '../../dependencies';
import { notFound } from '../../errors';
import type { CreateFinanceExpenseInput, UpdateFinanceExpenseInput } from './expenses.schema';

const includeExpenseRelations = { category: true, invoice: true } satisfies Prisma.FinanceExpenseInclude;

export type FinanceExpenseWithRelations = Prisma.FinanceExpenseGetPayload<{ include: typeof includeExpenseRelations }>;

export type FinanceExpensesService = {
  list(userId: string): Promise<FinanceExpenseWithRelations[]>;
  create(userId: string, input: CreateFinanceExpenseInput): Promise<FinanceExpenseWithRelations>;
  update(userId: string, id: string, input: UpdateFinanceExpenseInput): Promise<FinanceExpenseWithRelations>;
  remove(userId: string, id: string): Promise<void>;
};

function toExpenseData(
  input: CreateFinanceExpenseInput | UpdateFinanceExpenseInput,
): Prisma.FinanceExpenseUncheckedCreateInput | Prisma.FinanceExpenseUncheckedUpdateInput {
  return {
    ...input,
    spentAt: input.spentAt ? new Date(input.spentAt) : undefined,
    sourceMetadata: input.sourceMetadata as Prisma.InputJsonValue | undefined,
  };
}

export function createFinanceExpensesService(deps: Pick<BackendDeps, 'prisma'>): FinanceExpensesService {
  async function assertCategoryOwnership(userId: string, categoryId?: string): Promise<void> {
    if (!categoryId) return;
    const category = await deps.prisma.financeCategory.findFirst({ where: { id: categoryId, userId }, select: { id: true } });
    if (!category) throw notFound('Finance category not found');
  }

  return {
    async list(userId) {
      return deps.prisma.financeExpense.findMany({
        where: { userId },
        include: includeExpenseRelations,
        orderBy: { spentAt: 'desc' },
      });
    },

    async create(userId, input) {
      await assertCategoryOwnership(userId, input.categoryId);
      return deps.prisma.financeExpense.create({
        data: { ...(toExpenseData(input) as Prisma.FinanceExpenseUncheckedCreateInput), userId },
        include: includeExpenseRelations,
      });
    },

    async update(userId, id, input) {
      await assertCategoryOwnership(userId, input.categoryId);
      const result = await deps.prisma.financeExpense.updateMany({
        where: { id, userId },
        data: toExpenseData(input) as Prisma.FinanceExpenseUncheckedUpdateInput,
      });
      if (result.count === 0) throw notFound('Finance expense not found');
      const expense = await deps.prisma.financeExpense.findFirst({ where: { id, userId }, include: includeExpenseRelations });
      if (!expense) throw notFound('Finance expense not found');
      return expense;
    },

    async remove(userId, id) {
      const result = await deps.prisma.financeExpense.deleteMany({ where: { id, userId } });
      if (result.count === 0) throw notFound('Finance expense not found');
    },
  };
}
