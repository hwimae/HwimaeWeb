import { z } from 'zod';

export const financeBudgetPeriodSchema = z.enum(['weekly', 'monthly', 'yearly']);

export const upsertFinanceBudgetSchema = z.object({
  categoryId: z.string().min(1),
  period: financeBudgetPeriodSchema.default('monthly'),
  limitAmount: z.number().positive(),
  alertThreshold: z.number().min(0).max(1).default(0.8),
});

export type UpsertFinanceBudgetInput = z.infer<typeof upsertFinanceBudgetSchema>;
