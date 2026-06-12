import { z } from 'zod';

export const startFinanceChatSchema = z.object({ sessionTitle: z.string().trim().max(160).optional() });

export const pendingFinanceExpenseSchema = z.object({
  merchantName: z.string().trim().min(1).nullable().optional(),
  description: z.string().trim().min(1).nullable().optional(),
  amount: z.number().positive().nullable().optional(),
  spentAt: z.string().trim().min(1).nullable().optional(),
  categoryId: z.string().trim().min(1).nullable().optional(),
  categoryName: z.string().trim().min(1).nullable().optional(),
  invoiceId: z.string().trim().min(1).nullable().optional(),
});

export const sendFinanceChatMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
  messageType: z.enum(['text', 'image']).default('text'),
  isConfirmationResponse: z.boolean().default(false),
  pendingExpense: pendingFinanceExpenseSchema.nullable().optional(),
});

export type PendingFinanceExpenseInput = z.infer<typeof pendingFinanceExpenseSchema>;
export type StartFinanceChatInput = z.infer<typeof startFinanceChatSchema>;
export type SendFinanceChatMessageInput = z.infer<typeof sendFinanceChatMessageSchema>;
