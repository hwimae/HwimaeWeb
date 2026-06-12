import { createFinanceBudgetsService } from './budgets.service';

function createPrismaMock() {
  return {
    financeCategory: { findFirst: jest.fn() },
    financeBudget: { upsert: jest.fn(), findMany: jest.fn(), updateMany: jest.fn(), findFirst: jest.fn(), deleteMany: jest.fn() },
  };
}

describe('createFinanceBudgetsService', () => {
  it('upserts a budget for user category and period', async () => {
    const prisma = createPrismaMock();
    prisma.financeCategory.findFirst.mockResolvedValue({ id: 'cat1', userId: 'user1' });
    prisma.financeBudget.upsert.mockResolvedValue({ id: 'budget1', limitAmount: 1000000 });
    const service = createFinanceBudgetsService({ prisma } as any);

    await service.upsert('user1', { categoryId: 'cat1', period: 'monthly', limitAmount: 1000000, alertThreshold: 0.8 });

    expect(prisma.financeBudget.upsert).toHaveBeenCalledWith({
      where: { userId_categoryId_period: { userId: 'user1', categoryId: 'cat1', period: 'monthly' } },
      update: { limitAmount: 1000000, alertThreshold: 0.8 },
      create: { userId: 'user1', categoryId: 'cat1', period: 'monthly', limitAmount: 1000000, alertThreshold: 0.8 },
      include: { category: true },
    });
  });
});
