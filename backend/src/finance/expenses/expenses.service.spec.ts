import { createFinanceExpensesService } from './expenses.service';

function createPrismaMock() {
  return {
    financeCategory: { findFirst: jest.fn() },
    financeExpense: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
}

describe('createFinanceExpensesService', () => {
  it('creates an expense scoped to the current user', async () => {
    const prisma = createPrismaMock();
    prisma.financeCategory.findFirst.mockResolvedValue({ id: 'cat1', userId: 'user1' });
    prisma.financeExpense.create.mockResolvedValue({ id: 'exp1', userId: 'user1', amount: 25000 });
    const service = createFinanceExpensesService({ prisma } as any);

    await service.create('user1', { amount: 25000, categoryId: 'cat1', merchantName: 'Highlands', sourceType: 'manual' });

    expect(prisma.financeExpense.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user1', amount: 25000, categoryId: 'cat1', merchantName: 'Highlands' }),
      include: { category: true, invoice: true },
    });
  });
});
