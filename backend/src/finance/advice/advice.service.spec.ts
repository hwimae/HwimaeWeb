import { createFinanceAdviceService } from './advice.service';

function createPrismaMock() {
  return {
    financeBudget: { findMany: jest.fn() },
    financeExpense: { findMany: jest.fn() },
    financeAIInteraction: { create: jest.fn() },
  };
}

describe('createFinanceAdviceService', () => {
  it('generates advice from budgets and expenses and stores the interaction', async () => {
    const prisma = createPrismaMock();
    prisma.financeBudget.findMany.mockResolvedValue([{ id: 'budget1' }]);
    prisma.financeExpense.findMany.mockResolvedValue([{ id: 'expense1' }]);
    const financeAiClient = { generateAdvice: jest.fn().mockResolvedValue({ advice: 'Tiết kiệm hơn', highlights: ['Ăn uống tăng'], warnings: [] }) };
    const service = createFinanceAdviceService({ prisma, financeAiClient } as any);

    await expect(service.generate('user1', 'monthly')).resolves.toEqual({ advice: 'Tiết kiệm hơn', highlights: ['Ăn uống tăng'], warnings: [] });

    expect(financeAiClient.generateAdvice).toHaveBeenCalledWith({
      period: 'monthly',
      budgets: [{ id: 'budget1' }],
      expenses: [{ id: 'expense1' }],
      locale: 'vi-VN',
    });
    expect(prisma.financeAIInteraction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user1', interactionType: 'financial_advice' }),
    });
  });
});
