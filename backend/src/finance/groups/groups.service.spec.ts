import type { BackendDeps } from '../../dependencies';
import { HttpError } from '../../errors';
import { createFinanceGroupsService } from './groups.service';

function createPrismaMock() {
  const base = {
    user: { findUnique: jest.fn() },
    financeGroup: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), deleteMany: jest.fn() },
    financeGroupMember: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    financeCategory: { findMany: jest.fn() },
    financeBudget: { findMany: jest.fn(), deleteMany: jest.fn() },
    financeExpense: { findMany: jest.fn(), deleteMany: jest.fn() },
  };

  return {
    $transaction: jest.fn(async (callback: (tx: typeof base) => unknown): Promise<unknown> => callback(base)),
    ...base,
  };
}

let prisma: ReturnType<typeof createPrismaMock>;

function createService() {
  prisma = createPrismaMock();
  return createFinanceGroupsService({ prisma: prisma as unknown as BackendDeps['prisma'] });
}

function expectHttpError(error: unknown, statusCode: number, message: string) {
  expect(error).toBeInstanceOf(HttpError);
  expect((error as HttpError).statusCode).toBe(statusCode);
  expect((error as HttpError).message).toBe(message);
}

describe('createFinanceGroupsService', () => {
  it('creates a group and owner membership in one transaction', async () => {
    const service = createService();
    prisma.financeGroup.create.mockResolvedValue({
      id: 'group1',
      name: 'Gia đình',
      ownerId: 'owner1',
      members: [
        {
          userId: 'owner1',
          role: 'OWNER',
          createdAt: new Date('2026-06-14T00:00:00.000Z'),
          user: { id: 'owner1', name: 'Boo', email: 'boo@example.com' },
        },
      ],
      createdAt: new Date('2026-06-14T00:00:00.000Z'),
      updatedAt: new Date('2026-06-14T00:00:00.000Z'),
    });

    const result = await service.create('owner1', { name: ' Gia đình ' });

    expect(prisma.financeGroup.create).toHaveBeenCalledWith({
      data: {
        name: 'Gia đình',
        ownerId: 'owner1',
        members: { create: { userId: 'owner1', role: 'OWNER' } },
      },
      include: expect.any(Object),
    });
    expect(result.currentUserRole).toBe('OWNER');
    expect(result.members).toHaveLength(1);
  });

  it('adds a registered user as member when caller is owner', async () => {
    const service = createService();
    prisma.financeGroup.findFirst.mockResolvedValue({ id: 'group1', ownerId: 'owner1' });
    prisma.user.findUnique.mockResolvedValue({ id: 'member1', email: 'member@example.com', name: 'An' });
    prisma.financeGroupMember.findUnique.mockResolvedValueOnce(null);
    prisma.financeGroupMember.create.mockResolvedValue({
      userId: 'member1',
      role: 'MEMBER',
      createdAt: new Date('2026-06-14T00:00:00.000Z'),
      user: { id: 'member1', email: 'member@example.com', name: 'An' },
    });

    const result = await service.addMember('owner1', 'group1', { email: 'member@example.com' });

    expect(prisma.financeGroupMember.create).toHaveBeenCalledWith({
      data: { groupId: 'group1', userId: 'member1', role: 'MEMBER' },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    expect(result).toMatchObject({ userId: 'member1', email: 'member@example.com', role: 'MEMBER' });
  });

  it('rejects member management by non-owner', async () => {
    const service = createService();
    prisma.financeGroup.findFirst.mockResolvedValue({ id: 'group1', ownerId: 'owner1' });

    try {
      await service.addMember('member2', 'group1', { email: 'new@example.com' });
      throw new Error('Expected addMember to fail');
    } catch (error) {
      expectHttpError(error, 403, 'Finance group owner access required');
    }
  });

  it('returns member dashboard from the selected member real finance data', async () => {
    const service = createService();
    prisma.financeGroupMember.findUnique.mockResolvedValueOnce({ role: 'MEMBER' });
    prisma.financeGroupMember.findUnique.mockResolvedValueOnce({
      role: 'MEMBER',
      userId: 'member1',
      user: { id: 'member1', name: 'An', email: 'an@example.com' },
    });
    prisma.financeCategory.findMany.mockResolvedValue([{ id: 'cat1', userId: 'member1', name: 'Ăn uống' }]);
    prisma.financeBudget.findMany.mockResolvedValue([
      {
        id: 'budget1',
        userId: 'member1',
        categoryId: 'cat1',
        limitAmount: 1000000,
        period: 'monthly',
        alertThreshold: 0.8,
        category: { id: 'cat1', name: 'Ăn uống' },
      },
    ]);
    prisma.financeExpense.findMany.mockResolvedValue([
      { id: 'expense1', userId: 'member1', amount: { toString: () => '25000' }, category: { id: 'cat1', name: 'Ăn uống' } },
    ]);

    const result = await service.memberDashboard('viewer1', 'group1', 'member1');

    expect(prisma.financeExpense.findMany).toHaveBeenCalledWith({
      where: { userId: 'member1' },
      include: { category: true, invoice: true },
      orderBy: { spentAt: 'desc' },
    });
    expect(result.member).toEqual({ userId: 'member1', name: 'An', email: 'an@example.com' });
    expect(result.summary.totalAmount).toBe(25000);
  });

  it('allows owner to delete a member expense', async () => {
    const service = createService();
    prisma.financeGroup.findFirst.mockResolvedValue({ id: 'group1', ownerId: 'owner1' });
    prisma.financeGroupMember.findUnique.mockResolvedValueOnce({ role: 'MEMBER' });
    prisma.financeExpense.deleteMany.mockResolvedValue({ count: 1 });

    await service.deleteMemberExpense('owner1', 'group1', 'member1', 'expense1');

    expect(prisma.financeExpense.deleteMany).toHaveBeenCalledWith({ where: { id: 'expense1', userId: 'member1' } });
  });

  it('rejects member deleting a budget', async () => {
    const service = createService();
    prisma.financeGroup.findFirst.mockResolvedValue({ id: 'group1', ownerId: 'owner1' });

    try {
      await service.deleteMemberBudget('member2', 'group1', 'member1', 'budget1');
      throw new Error('Expected deleteMemberBudget to fail');
    } catch (error) {
      expectHttpError(error, 403, 'Finance group owner access required');
    }
  });

  it('does not grant owner actions from a mismatched OWNER membership row', async () => {
    const service = createService();
    prisma.financeGroup.findFirst.mockResolvedValue({ id: 'group1', ownerId: 'owner1' });
    prisma.financeGroupMember.findUnique.mockResolvedValue({ role: 'OWNER' });

    try {
      await service.removeGroup('member2', 'group1');
      throw new Error('Expected removeGroup to fail');
    } catch (error) {
      expectHttpError(error, 403, 'Finance group owner access required');
    }
    expect(prisma.financeGroup.deleteMany).not.toHaveBeenCalled();
  });
});
