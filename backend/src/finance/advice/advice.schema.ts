import { z } from 'zod';

export const financeAdvicePeriodSchema = z.enum(['weekly', 'monthly', 'yearly']);

export const financeAdviceRequestSchema = z.object({
  period: financeAdvicePeriodSchema.default('monthly'),
});

export type FinanceAdviceRequest = z.infer<typeof financeAdviceRequestSchema>;
