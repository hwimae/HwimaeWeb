import { z } from 'zod';

export const financeIdParamSchema = z.object({ id: z.string().min(1) });
export const financeSessionIdParamSchema = z.object({ sessionId: z.string().min(1) });

export const financePaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type FinanceIdParam = z.infer<typeof financeIdParamSchema>;
export type FinanceSessionIdParam = z.infer<typeof financeSessionIdParamSchema>;
export type FinancePaginationQuery = z.infer<typeof financePaginationQuerySchema>;
