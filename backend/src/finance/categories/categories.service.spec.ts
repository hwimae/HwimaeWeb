import { createFinanceCategoriesService } from './categories.service';

const DEFAULT_CATEGORY_COUNT = 10;

function createPrismaMock() {
  return {
    financeCategory: {
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };
}

describe('createFinanceCategoriesService', () => {
  it('lists only categories for the current user ordered for display', async () => {
    const prisma = createPrismaMock();
    prisma.financeCategory.findMany
      .mockResolvedValueOnce([{ name: 'Ăn uống' }, { name: 'Đi lại' }, { name: 'Nhà ở' }, { name: 'Mua sắm cá nhân' }, { name: 'Giải trí & du lịch' }, { name: 'Giáo dục & học tập' }, { name: 'Sức khỏe & thể thao' }, { name: 'Gia đình & quà tặng' }, { name: 'Đầu tư & tiết kiệm' }, { name: 'Khác' }])
      .mockResolvedValueOnce([{ id: 'cat1', userId: 'user1', name: 'Ăn uống' }]);
    const service = createFinanceCategoriesService({ prisma } as any);

    await expect(service.list('user1')).resolves.toEqual([{ id: 'cat1', userId: 'user1', name: 'Ăn uống' }]);
    expect(prisma.financeCategory.findMany).toHaveBeenLastCalledWith({
      where: { userId: 'user1' },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  });

  it('initializes missing default Vietnamese categories', async () => {
    const prisma = createPrismaMock();
    prisma.financeCategory.findMany.mockResolvedValue([{ name: 'Ăn uống' }]);
    prisma.financeCategory.create.mockResolvedValue({});
    const service = createFinanceCategoriesService({ prisma } as any);

    await service.ensureDefaults('user1');

    expect(prisma.financeCategory.create).toHaveBeenCalledTimes(DEFAULT_CATEGORY_COUNT - 1);
    expect(prisma.financeCategory.create).not.toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user1', name: 'Ăn uống', isSystemCategory: true }),
    });
    expect(prisma.financeCategory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user1', name: 'Đi lại', isSystemCategory: true }),
    });
  });

  it('ignores duplicate errors while seeding defaults concurrently', async () => {
    const prisma = createPrismaMock();
    prisma.financeCategory.findMany.mockResolvedValue([]);
    prisma.financeCategory.create.mockRejectedValueOnce({ code: 'P2002' }).mockResolvedValue({});
    const service = createFinanceCategoriesService({ prisma } as any);

    await expect(service.ensureDefaults('user1')).resolves.toBeUndefined();
    expect(prisma.financeCategory.create).toHaveBeenCalledTimes(DEFAULT_CATEGORY_COUNT);
  });

  it('seeds defaults before the first create', async () => {
    const prisma = createPrismaMock();
    prisma.financeCategory.findMany.mockResolvedValue([]);
    prisma.financeCategory.create.mockResolvedValue({ id: 'cat1' });
    const service = createFinanceCategoriesService({ prisma } as any);

    await service.create('user1', { name: 'Lương', displayOrder: 99 });

    expect(prisma.financeCategory.create).toHaveBeenCalledTimes(DEFAULT_CATEGORY_COUNT + 1);
    expect(prisma.financeCategory.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user1', name: 'Ăn uống', isSystemCategory: true }),
      }),
    );
    expect(prisma.financeCategory.create).toHaveBeenNthCalledWith(
      DEFAULT_CATEGORY_COUNT + 1,
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user1', name: 'Lương', isSystemCategory: false }),
      }),
    );
  });

  it('maps duplicate names on create to a conflict error', async () => {
    const prisma = createPrismaMock();
    prisma.financeCategory.findMany.mockResolvedValue([{ name: 'Ăn uống' }, { name: 'Đi lại' }, { name: 'Nhà ở' }, { name: 'Mua sắm cá nhân' }, { name: 'Giải trí & du lịch' }, { name: 'Giáo dục & học tập' }, { name: 'Sức khỏe & thể thao' }, { name: 'Gia đình & quà tặng' }, { name: 'Đầu tư & tiết kiệm' }, { name: 'Khác' }]);
    prisma.financeCategory.create.mockRejectedValue({ code: 'P2002' });
    const service = createFinanceCategoriesService({ prisma } as any);

    await expect(service.create('user1', { name: 'Ăn uống' })).rejects.toThrow('Finance category already exists');
  });

  it('maps duplicate names on update to a conflict error', async () => {
    const prisma = createPrismaMock();
    prisma.financeCategory.updateMany.mockRejectedValue({ code: 'P2002' });
    const service = createFinanceCategoriesService({ prisma } as any);

    await expect(service.update('user1', 'cat1', { name: 'Ăn uống' })).rejects.toThrow('Finance category already exists');
  });
});
