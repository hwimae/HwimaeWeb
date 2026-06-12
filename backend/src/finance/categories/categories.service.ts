import type { FinanceCategory } from '@prisma/client';
import type { BackendDeps } from '../../dependencies';
import { conflict, notFound } from '../../errors';
import type { CreateFinanceCategoryInput, UpdateFinanceCategoryInput } from './categories.schema';

const DEFAULT_CATEGORIES = [
  { name: 'Ăn uống', description: 'Nhà hàng, cà phê, đồ ăn, siêu thị thực phẩm', icon: '🍜', color: '#ef4444' },
  { name: 'Đi lại', description: 'Grab, taxi, xăng xe, vé xe, bảo dưỡng', icon: '🚕', color: '#f97316' },
  { name: 'Nhà ở', description: 'Thuê nhà, điện, nước, internet', icon: '🏠', color: '#eab308' },
  { name: 'Mua sắm cá nhân', description: 'Quần áo, mỹ phẩm, thiết bị cá nhân', icon: '🛍️', color: '#22c55e' },
  { name: 'Giải trí & du lịch', description: 'Phim, game, khách sạn, vé máy bay', icon: '🎬', color: '#06b6d4' },
  { name: 'Giáo dục & học tập', description: 'Sách, khóa học, học phí', icon: '📚', color: '#3b82f6' },
  { name: 'Sức khỏe & thể thao', description: 'Thuốc, bệnh viện, gym, yoga', icon: '💊', color: '#8b5cf6' },
  { name: 'Gia đình & quà tặng', description: 'Quà tặng, lễ tết, sinh nhật', icon: '🎁', color: '#ec4899' },
  { name: 'Đầu tư & tiết kiệm', description: 'Gửi tiết kiệm, đầu tư, ngân hàng', icon: '💰', color: '#14b8a6' },
  { name: 'Khác', description: 'Chi phí chưa thuộc nhóm nào', icon: '📌', color: '#64748b' },
] as const;

const DEFAULT_CATEGORY_NAMES = new Set(DEFAULT_CATEGORIES.map((category) => category.name));

export type FinanceCategoriesService = {
  ensureDefaults(userId: string): Promise<void>;
  list(userId: string): Promise<FinanceCategory[]>;
  create(userId: string, input: CreateFinanceCategoryInput): Promise<FinanceCategory>;
  update(userId: string, id: string, input: UpdateFinanceCategoryInput): Promise<FinanceCategory>;
  remove(userId: string, id: string): Promise<void>;
};

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002');
}

export function createFinanceCategoriesService(deps: Pick<BackendDeps, 'prisma'>): FinanceCategoriesService {
  return {
    async ensureDefaults(userId) {
      const existingDefaults = await deps.prisma.financeCategory.findMany({
        where: { userId, name: { in: [...DEFAULT_CATEGORY_NAMES] } },
        select: { name: true },
      });
      const existingNames = new Set(existingDefaults.map((category) => category.name));

      for (const [index, category] of DEFAULT_CATEGORIES.entries()) {
        if (existingNames.has(category.name)) continue;

        try {
          await deps.prisma.financeCategory.create({
            data: { ...category, userId, displayOrder: index, isSystemCategory: true },
          });
        } catch (error) {
          if (!isUniqueConstraintError(error)) {
            throw error;
          }
        }
      }
    },

    async list(userId) {
      await this.ensureDefaults(userId);
      return deps.prisma.financeCategory.findMany({
        where: { userId },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      });
    },

    async create(userId, input) {
      await this.ensureDefaults(userId);
      try {
        return await deps.prisma.financeCategory.create({ data: { ...input, userId, isSystemCategory: false } });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw conflict('Finance category already exists');
        }
        throw error;
      }
    },

    async update(userId, id, input) {
      let result: { count: number };
      try {
        result = await deps.prisma.financeCategory.updateMany({ where: { id, userId }, data: input });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw conflict('Finance category already exists');
        }
        throw error;
      }
      if (result.count === 0) throw notFound('Finance category not found');
      const category = await deps.prisma.financeCategory.findFirst({ where: { id, userId } });
      if (!category) throw notFound('Finance category not found');
      return category;
    },

    async remove(userId, id) {
      const result = await deps.prisma.financeCategory.deleteMany({ where: { id, userId } });
      if (result.count === 0) throw notFound('Finance category not found');
    },
  };
}
