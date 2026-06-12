import type { Prisma } from '@prisma/client';
import type { BackendDeps } from '../../dependencies';
import { notFound } from '../../errors';
import type { UpsertFinanceBudgetInput } from './budgets.schema';

const includeBudgetRelations = { category: true } satisfies Prisma.FinanceBudgetInclude;

export type FinanceBudgetWithCategory = Prisma.FinanceBudgetGetPayload<{ include: typeof includeBudgetRelations }>;

export type FinanceBudgetsService = {
  list(userId: string): Promise<FinanceBudgetWithCategory[]>;
  upsert(userId: string, input: UpsertFinanceBudgetInput): Promise<FinanceBudgetWithCategory>;
  remove(userId: string, id: string): Promise<void>;
};

export function createFinanceBudgetsService(deps: Pick<BackendDeps, 'prisma'>): FinanceBudgetsService {
  async function assertCategoryOwnership(userId: string, categoryId: string): Promise<void> {
    const category = await deps.prisma.financeCategory.findFirst({ where: { id: categoryId, userId }, select: { id: true } });
    if (!category) throw notFound('Finance category not found');
  }

  return {
    async list(userId) {
      return deps.prisma.financeBudget.findMany({ where: { userId }, include: includeBudgetRelations, orderBy: { createdAt: 'desc' } });
    },

    async upsert(userId, input) {
      await assertCategoryOwnership(userId, input.categoryId);
      return deps.prisma.financeBudget.upsert({
        where: { userId_categoryId_period: { userId, categoryId: input.categoryId, period: input.period } },
        update: { limitAmount: input.limitAmount, alertThreshold: input.alertThreshold },
        create: { userId, categoryId: input.categoryId, period: input.period, limitAmount: input.limitAmount, alertThreshold: input.alertThreshold },
        include: includeBudgetRelations,
      });
    },

    async remove(userId, id) {
      const result = await deps.prisma.financeBudget.deleteMany({ where: { id, userId } });
      if (result.count === 0) throw notFound('Finance budget not found');
    },
  };
}
