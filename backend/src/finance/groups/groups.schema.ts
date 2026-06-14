import { z } from 'zod';

export const financeGroupIdParamSchema = z.object({ groupId: z.string().min(1) });
export const financeGroupMemberParamSchema = z.object({ groupId: z.string().min(1), memberUserId: z.string().min(1) });
export const financeGroupMemberExpenseParamSchema = financeGroupMemberParamSchema.extend({ expenseId: z.string().min(1) });
export const financeGroupMemberBudgetParamSchema = financeGroupMemberParamSchema.extend({ budgetId: z.string().min(1) });

export const createFinanceGroupSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const addFinanceGroupMemberSchema = z.object({
  email: z.string().trim().email().max(320),
});

export type FinanceGroupIdParam = z.infer<typeof financeGroupIdParamSchema>;
export type FinanceGroupMemberParam = z.infer<typeof financeGroupMemberParamSchema>;
export type FinanceGroupMemberExpenseParam = z.infer<typeof financeGroupMemberExpenseParamSchema>;
export type FinanceGroupMemberBudgetParam = z.infer<typeof financeGroupMemberBudgetParamSchema>;
export type CreateFinanceGroupInput = z.infer<typeof createFinanceGroupSchema>;
export type AddFinanceGroupMemberInput = z.infer<typeof addFinanceGroupMemberSchema>;
