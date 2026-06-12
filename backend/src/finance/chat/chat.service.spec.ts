import { createFinanceChatService } from './chat.service';

function createPrismaMock() {
  return {
    financeChatSession: { create: jest.fn(), findFirst: jest.fn(), updateMany: jest.fn() },
    financeChatMessage: { create: jest.fn(), findMany: jest.fn() },
    financeCategory: { findMany: jest.fn(), findFirst: jest.fn() },
    financeBudget: { findMany: jest.fn() },
    financeExpense: { findMany: jest.fn(), create: jest.fn() },
    financeInvoice: { findFirst: jest.fn() },
  };
}

describe('createFinanceChatService', () => {
  it('start returns sessionId and initialMessage mentioning trợ lý AI', async () => {
    const prisma = createPrismaMock();
    prisma.financeChatSession.create.mockResolvedValue({ id: 'session1', userId: 'user1', sessionTitle: 'Chat' });

    const service = createFinanceChatService({ prisma, financeAiClient: {} } as any);

    await expect(service.start('user1', { sessionTitle: 'Chat' })).resolves.toMatchObject({
      sessionId: 'session1',
      initialMessage: expect.stringContaining('trợ lý AI'),
    });
  });

  it('sendMessage sends categories, budgets, recentExpenses and chatHistory to financeAiClient.chatRespond', async () => {
    const prisma = createPrismaMock();
    prisma.financeChatSession.findFirst.mockResolvedValue({ id: 'session1', userId: 'user1' });
    prisma.financeCategory.findMany.mockResolvedValue([{ id: 'cat1', name: 'Ăn uống' }]);
    prisma.financeBudget.findMany.mockResolvedValue([{ id: 'budget1', categoryId: 'cat1', category: { id: 'cat1', name: 'Ăn uống' } }]);
    prisma.financeExpense.findMany.mockResolvedValue([{ id: 'exp1', amount: 25000, category: { id: 'cat1', name: 'Ăn uống' } }]);
    prisma.financeChatMessage.findMany.mockResolvedValue([
      { id: 'm1', role: 'user', content: 'ăn sáng 25k' },
      { id: 'm2', role: 'assistant', content: 'Bạn muốn mình ghi nhận khoản này không?' },
    ]);

    const financeAiClient = {
      chatRespond: jest.fn().mockResolvedValue({
        assistantMessage: 'Đã phân tích tin nhắn.',
        requiresConfirmation: true,
        askingConfirmation: true,
        interrupted: false,
      }),
    };

    const service = createFinanceChatService({ prisma, financeAiClient } as any);

    await service.sendMessage('user1', 'session1', {
      content: 'ăn sáng 25k',
      messageType: 'text',
      isConfirmationResponse: false,
    });

    expect(financeAiClient.chatRespond).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session1',
        message: 'ăn sáng 25k',
        messageType: 'text',
        isConfirmationResponse: false,
        pendingExpense: null,
        categories: [{ id: 'cat1', name: 'Ăn uống' }],
        budgets: [{ id: 'budget1', categoryId: 'cat1', category: { id: 'cat1', name: 'Ăn uống' } }],
        recentExpenses: [{ id: 'exp1', amount: 25000, category: { id: 'cat1', name: 'Ăn uống' } }],
        chatHistory: [
          { id: 'm1', role: 'user', content: 'ăn sáng 25k' },
          { id: 'm2', role: 'assistant', content: 'Bạn muốn mình ghi nhận khoản này không?' },
        ],
        locale: 'vi-VN',
      }),
    );
  });

  it('confirmed pending expense saves for current user and returns savedExpense', async () => {
    const prisma = createPrismaMock();
    prisma.financeChatSession.findFirst.mockResolvedValue({ id: 'session1', userId: 'user1' });
    prisma.financeCategory.findMany.mockResolvedValue([{ id: 'cat1', name: 'Ăn uống' }]);
    prisma.financeBudget.findMany.mockResolvedValue([]);
    prisma.financeExpense.findMany.mockResolvedValue([]);
    prisma.financeChatMessage.findMany.mockResolvedValue([]);
    prisma.financeCategory.findFirst.mockResolvedValue({ id: 'cat1' });
    prisma.financeExpense.create.mockResolvedValue({
      id: 'expense1',
      userId: 'user1',
      invoiceId: null,
      categoryId: 'cat1',
      description: null,
      merchantName: 'Highlands',
      amount: 25000,
      spentAt: new Date('2026-06-11T10:15:30.000Z'),
      confirmedByUser: true,
      sourceType: 'text',
      createdAt: new Date('2026-06-11T10:16:00.000Z'),
      updatedAt: new Date('2026-06-11T10:16:00.000Z'),
      category: { id: 'cat1', name: 'Ăn uống' },
      invoice: null,
    });

    const financeAiClient = {
      chatRespond: jest.fn().mockResolvedValue({
        assistantMessage: 'Đã lưu chi tiêu Highlands 25.000đ.',
        extractedExpense: {
          merchantName: 'Highlands',
          amount: 25000,
          categoryId: 'cat1',
        },
        requiresConfirmation: false,
        askingConfirmation: false,
        interrupted: false,
      }),
    };

    const service = createFinanceChatService({ prisma, financeAiClient } as any);

    const result = await service.sendMessage('user1', 'session1', {
      content: 'đúng rồi',
      messageType: 'text',
      isConfirmationResponse: true,
      pendingExpense: {
        merchantName: 'Highlands',
        amount: 25000,
        categoryId: 'cat1',
      },
    });

    expect(prisma.financeExpense.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user1',
        amount: 25000,
        merchantName: 'Highlands',
        categoryId: 'cat1',
        sourceType: 'text',
        confirmedByUser: true,
      }),
      include: { category: true, invoice: true },
    });

    expect(prisma.financeChatMessage.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({
        role: 'assistant',
        metadata: expect.objectContaining({
          savedExpense: expect.objectContaining({
            id: 'expense1',
            userId: 'user1',
            invoiceId: null,
            categoryId: 'cat1',
            description: null,
            merchantName: 'Highlands',
            amount: 25000,
            spentAt: '2026-06-11T10:15:30.000Z',
            confirmedByUser: true,
            sourceType: 'text',
            createdAt: '2026-06-11T10:16:00.000Z',
            updatedAt: '2026-06-11T10:16:00.000Z',
          }),
        }),
      }),
    });

    expect(result).toEqual({
      assistantMessage: 'Đã lưu chi tiêu Highlands 25.000đ.',
      extractedExpense: {
        merchantName: 'Highlands',
        amount: 25000,
        categoryId: 'cat1',
      },
      requiresConfirmation: false,
      askingConfirmation: false,
      interrupted: false,
      savedExpense: {
        id: 'expense1',
        userId: 'user1',
        invoiceId: null,
        categoryId: 'cat1',
        description: null,
        merchantName: 'Highlands',
        amount: 25000,
        spentAt: '2026-06-11T10:15:30.000Z',
        confirmedByUser: true,
        sourceType: 'text',
        createdAt: '2026-06-11T10:16:00.000Z',
        updatedAt: '2026-06-11T10:16:00.000Z',
      },
    });
  });

  it('rejects rollover spentAt dates before saving', async () => {
    const prisma = createPrismaMock();
    prisma.financeChatSession.findFirst.mockResolvedValue({ id: 'session1', userId: 'user1' });
    prisma.financeCategory.findMany.mockResolvedValue([]);
    prisma.financeBudget.findMany.mockResolvedValue([]);
    prisma.financeExpense.findMany.mockResolvedValue([]);
    prisma.financeChatMessage.findMany.mockResolvedValue([]);

    const financeAiClient = {
      chatRespond: jest.fn().mockResolvedValue({
        assistantMessage: 'Đã ghi nhận chi tiêu.',
        extractedExpense: {
          merchantName: 'Highlands',
          amount: 25000,
          spentAt: '2026-02-30',
        },
        requiresConfirmation: false,
        askingConfirmation: false,
        interrupted: false,
      }),
    };

    const service = createFinanceChatService({ prisma, financeAiClient } as any);

    await expect(
      service.sendMessage('user1', 'session1', {
        content: 'đúng rồi',
        messageType: 'text',
        isConfirmationResponse: true,
        pendingExpense: {
          merchantName: 'Highlands',
          amount: 25000,
        },
      }),
    ).rejects.toThrow('Invalid expense spentAt');

    expect(prisma.financeExpense.create).not.toHaveBeenCalled();
  });
});
