import { z } from 'zod';

export const financeExpenseSourceSchema = z.enum(['manual', 'text', 'image']);

export const createFinanceExpenseSchema = z.object({
  invoiceId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  description: z.string().trim().max(1000).optional(),
  merchantName: z.string().trim().max(160).optional(),
  amount: z.number().positive(),
  spentAt: z.string().datetime().optional(),
  confirmedByUser: z.boolean().optional(),
  sourceType: financeExpenseSourceSchema.default('manual'),
  sourceMetadata: z.unknown().optional(),
});

export const updateFinanceExpenseSchema = createFinanceExpenseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required' },
);

export type CreateFinanceExpenseInput = z.infer<typeof createFinanceExpenseSchema>;
export type UpdateFinanceExpenseInput = z.infer<typeof updateFinanceExpenseSchema>;
