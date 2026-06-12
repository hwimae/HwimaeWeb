import type { BackendDeps } from '../../dependencies';
import type { FinanceAiClient } from '../ai-client';

export type FinanceAdviceService = { generate(userId: string, period: 'weekly' | 'monthly' | 'yearly'): Promise<unknown> };

export function createFinanceAdviceService(deps: Pick<BackendDeps, 'prisma'> & { financeAiClient: FinanceAiClient }): FinanceAdviceService {
  return {
    async generate(userId, period) {
      const [budgets, expenses] = await Promise.all([
        deps.prisma.financeBudget.findMany({ where: { userId }, include: { category: true } }),
        deps.prisma.financeExpense.findMany({ where: { userId }, include: { category: true }, orderBy: { createdAt: 'desc' }, take: 200 }),
      ]);
      const response = await deps.financeAiClient.generateAdvice({ period, budgets, expenses, locale: 'vi-VN' });
      await deps.prisma.financeAIInteraction.create({
        data: { userId, interactionType: 'financial_advice', inputData: { period, budgets, expenses } as any, aiResponse: response as any },
      });
      return response;
    },
  };
}
