import type { Prisma } from '@prisma/client';
import type { BackendDeps } from '../../dependencies';
import { notFound, validationError } from '../../errors';
import type { FinanceAiClient, FinanceChatAiResponse } from '../ai-client';
import type { PendingFinanceExpenseInput, SendFinanceChatMessageInput, StartFinanceChatInput } from './chat.schema';

const includeExpenseRelations = { category: true, invoice: true } satisfies Prisma.FinanceExpenseInclude;

export type FinanceExpenseWithRelations = Prisma.FinanceExpenseGetPayload<{ include: typeof includeExpenseRelations }>;

export type FinanceSavedExpense = {
  id: string;
  userId: string;
  invoiceId: string | null;
  categoryId: string | null;
  description: string | null;
  merchantName: string | null;
  amount: number;
  spentAt: string | null;
  confirmedByUser: boolean;
  sourceType: string;
  createdAt: string;
  updatedAt: string;
};

export type SendFinanceChatResponse = FinanceChatAiResponse & {
  savedExpense: FinanceSavedExpense | null;
};

export type FinanceChatServiceDeps = Pick<BackendDeps, 'prisma'> & { financeAiClient: FinanceAiClient };

export type StartFinanceChatResponse = { sessionId: string; initialMessage: string };

export type FinanceChatService = {
  start(userId: string, input: StartFinanceChatInput): Promise<StartFinanceChatResponse>;
  sendMessage(userId: string, sessionId: string, input: SendFinanceChatMessageInput): Promise<SendFinanceChatResponse>;
  history(userId: string, sessionId: string): Promise<unknown[]>;
  close(userId: string, sessionId: string): Promise<void>;
};

export function createFinanceChatService(deps: FinanceChatServiceDeps): FinanceChatService {
  async function assertSession(userId: string, sessionId: string) {
    const session = await deps.prisma.financeChatSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw notFound('Finance chat session not found');
    return session;
  }

  async function assertCategoryOwnership(userId: string, categoryId?: string | null): Promise<void> {
    if (!categoryId) return;
    const category = await deps.prisma.financeCategory.findFirst({ where: { id: categoryId, userId }, select: { id: true } });
    if (!category) throw validationError('Finance category not found');
  }

  async function assertInvoiceOwnership(userId: string, invoiceId?: string | null): Promise<void> {
    if (!invoiceId) return;
    const invoice = await deps.prisma.financeInvoice.findFirst({ where: { id: invoiceId, userId }, select: { id: true } });
    if (!invoice) throw validationError('Finance invoice not found');
  }

  function parseStrictSpentAt(value: string): Date {
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnlyMatch) {
      const [, yearText, monthText, dayText] = dateOnlyMatch;
      const year = Number(yearText);
      const month = Number(monthText);
      const day = Number(dayText);
      const date = new Date(Date.UTC(year, month - 1, day));

      if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() + 1 !== month ||
        date.getUTCDate() !== day
      ) {
        throw validationError('Invalid expense spentAt');
      }

      return date;
    }

    const dateTimeMatch =
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(\.(\d{1,3}))?)?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
    if (!dateTimeMatch) {
      throw validationError('Invalid expense spentAt');
    }

    const [, yearText, monthText, dayText, hourText, minuteText, secondText, , millisecondText, zone, offsetSign, offsetHourText, offsetMinuteText] =
      dateTimeMatch;

    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const second = secondText ? Number(secondText) : 0;
    const millisecond = millisecondText ? Number(millisecondText.padEnd(3, '0')) : 0;
    const offsetHours = offsetHourText ? Number(offsetHourText) : 0;
    const offsetMinutesPart = offsetMinuteText ? Number(offsetMinuteText) : 0;

    if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59 || offsetHours > 23 || offsetMinutesPart > 59) {
      throw validationError('Invalid expense spentAt');
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw validationError('Invalid expense spentAt');
    }

    const offsetMinutes =
      zone === 'Z' ? 0 : (offsetSign === '-' ? -1 : 1) * (offsetHours * 60 + offsetMinutesPart);
    const localTime = new Date(date.getTime() + offsetMinutes * 60_000);

    if (
      localTime.getUTCFullYear() !== year ||
      localTime.getUTCMonth() + 1 !== month ||
      localTime.getUTCDate() !== day ||
      localTime.getUTCHours() !== hour ||
      localTime.getUTCMinutes() !== minute ||
      localTime.getUTCSeconds() !== second ||
      localTime.getUTCMilliseconds() !== millisecond
    ) {
      throw validationError('Invalid expense spentAt');
    }

    return date;
  }

  function toExpenseCreateData(userId: string, pending: PendingFinanceExpenseInput): Prisma.FinanceExpenseUncheckedCreateInput {
    if (typeof pending.amount !== 'number' || pending.amount <= 0) {
      throw validationError('Invalid expense amount');
    }

    const spentAt = pending.spentAt ? parseStrictSpentAt(pending.spentAt) : undefined;

    return {
      userId,
      invoiceId: pending.invoiceId ?? undefined,
      categoryId: pending.categoryId ?? undefined,
      description: pending.description ?? undefined,
      merchantName: pending.merchantName ?? undefined,
      amount: pending.amount,
      spentAt,
      confirmedByUser: true,
      sourceType: 'text',
      sourceMetadata: { confirmedFromChat: true } as Prisma.InputJsonValue,
    };
  }

  function toSavedExpenseResponse(expense: FinanceExpenseWithRelations): FinanceSavedExpense {
    return {
      id: expense.id,
      userId: expense.userId,
      invoiceId: expense.invoiceId,
      categoryId: expense.categoryId,
      description: expense.description,
      merchantName: expense.merchantName,
      amount: Number(expense.amount),
      spentAt: expense.spentAt?.toISOString() ?? null,
      confirmedByUser: expense.confirmedByUser,
      sourceType: expense.sourceType,
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
    };
  }

  async function saveIfConfirmed(userId: string, input: SendFinanceChatMessageInput, aiResponse: FinanceChatAiResponse): Promise<FinanceSavedExpense | null> {
    if (!input.isConfirmationResponse || aiResponse.requiresConfirmation || !aiResponse.extractedExpense) {
      return null;
    }

    const pendingExpense = {
      ...(input.pendingExpense ?? {}),
      ...aiResponse.extractedExpense,
    } as PendingFinanceExpenseInput;

    await assertCategoryOwnership(userId, pendingExpense.categoryId ?? null);
    await assertInvoiceOwnership(userId, pendingExpense.invoiceId ?? null);

    const expense = await deps.prisma.financeExpense.create({
      data: toExpenseCreateData(userId, pendingExpense),
      include: includeExpenseRelations,
    });

    return toSavedExpenseResponse(expense);
  }

  return {
    async start(userId, input) {
      const session = await deps.prisma.financeChatSession.create({
        data: { userId, sessionTitle: input.sessionTitle ?? 'Finance Chat Session' },
      });

      return {
        sessionId: session.id,
        initialMessage: 'Xin chào! Tôi là trợ lý AI quản lý chi tiêu. Bạn có thể nhập chi tiêu hoặc tải ảnh hóa đơn.',
      };
    },

    async sendMessage(userId, sessionId, input) {
      await assertSession(userId, sessionId);

      await deps.prisma.financeChatMessage.create({ data: { sessionId, role: 'user', content: input.content } });

      const [categories, budgets, recentExpenses, chatHistory] = await Promise.all([
        deps.prisma.financeCategory.findMany({ where: { userId }, orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }] }),
        deps.prisma.financeBudget.findMany({ where: { userId }, include: { category: true }, orderBy: { createdAt: 'desc' } }),
        deps.prisma.financeExpense.findMany({ where: { userId }, include: includeExpenseRelations, orderBy: { createdAt: 'desc' }, take: 20 }),
        deps.prisma.financeChatMessage.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' }, take: 30 }),
      ]);

      const aiResponse = await deps.financeAiClient.chatRespond({
        sessionId,
        message: input.content,
        messageType: input.messageType,
        isConfirmationResponse: input.isConfirmationResponse,
        pendingExpense: input.pendingExpense ?? null,
        categories,
        budgets,
        recentExpenses,
        chatHistory,
        locale: 'vi-VN',
      });

      const savedExpense = await saveIfConfirmed(userId, input, aiResponse);
      const response: SendFinanceChatResponse = { ...aiResponse, savedExpense };

      await deps.prisma.financeChatMessage.create({
        data: {
          sessionId,
          role: 'assistant',
          content: aiResponse.assistantMessage,
          metadata: response as Prisma.InputJsonValue,
        },
      });

      return response;
    },

    async history(userId, sessionId) {
      await assertSession(userId, sessionId);
      return deps.prisma.financeChatMessage.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } });
    },

    async close(userId, sessionId) {
      const result = await deps.prisma.financeChatSession.updateMany({ where: { id: sessionId, userId }, data: { status: 'completed' } });
      if (result.count === 0) throw notFound('Finance chat session not found');
    },
  };
}
