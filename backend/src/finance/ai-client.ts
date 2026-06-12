import { z } from 'zod';
import { badGateway } from '../errors';

const categoryContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});

const expenseExtractionResponseSchema = z.object({
  merchantName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  spentAt: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  categoryName: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).default(0),
  assistantMessage: z.string(),
  requiresConfirmation: z.boolean().default(true),
});

const adviceResponseSchema = z.object({
  advice: z.string(),
  highlights: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});

const chatResponseSchema = z.object({
  assistantMessage: z.string(),
  extractedExpense: expenseExtractionResponseSchema.partial().nullable().optional(),
  budgetWarning: z.string().nullable().optional(),
  advice: z.string().nullable().optional(),
  requiresConfirmation: z.boolean().default(false),
  askingConfirmation: z.boolean().default(false),
  interrupted: z.boolean().default(false),
});

export const invoiceExtractResponseSchema = z.object({
  storeName: z.string().nullable().optional(),
  totalAmount: z.number().nullable().optional(),
  purchasedAt: z.string().nullable().optional(),
  rawText: z.string().nullable().optional(),
  extractedData: z.record(z.string(), z.unknown()).default({}),
  assistantMessage: z.string(),
});

export type FinanceCategoryContext = z.infer<typeof categoryContextSchema>;
export type FinanceExpenseExtractionResponse = z.infer<typeof expenseExtractionResponseSchema>;
export type FinanceAdviceResponse = z.infer<typeof adviceResponseSchema>;
export type FinanceChatAiResponse = z.infer<typeof chatResponseSchema>;
export type FinanceInvoiceExtractResponse = z.infer<typeof invoiceExtractResponseSchema>;

export type ExtractExpenseTextRequest = {
  message: string;
  categories: FinanceCategoryContext[];
  recentExpenses: unknown[];
  locale: 'vi-VN';
};

export type FinanceAiClient = {
  extractExpenseText(input: ExtractExpenseTextRequest): Promise<FinanceExpenseExtractionResponse>;
  extractInvoiceImage(file: Express.Multer.File): Promise<FinanceInvoiceExtractResponse>;
  generateAdvice(input: unknown): Promise<FinanceAdviceResponse>;
  chatRespond(input: unknown): Promise<FinanceChatAiResponse>;
};

function isHttpError(error: unknown): boolean {
  return error instanceof Error && 'statusCode' in error;
}

async function postJson<T>(baseUrl: string, path: string, body: unknown, parser: z.ZodType<T>): Promise<T> {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw badGateway(`AI service request failed: ${path}`);
    }

    const json = (await response.json()) as unknown;
    const parsed = parser.safeParse(json);
    if (!parsed.success) {
      throw badGateway(`AI service returned invalid payload: ${path}`);
    }

    return parsed.data;
  } catch (error) {
    if (isHttpError(error)) {
      throw error;
    }

    throw badGateway(`AI service request failed: ${path}`);
  }
}

async function postMultipart<T>(baseUrl: string, path: string, file: Express.Multer.File, parser: z.ZodType<T>): Promise<T> {
  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    formData.append('file', blob, file.originalname);

    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw badGateway(`AI service request failed: ${path}`);
    }

    const json = (await response.json()) as unknown;
    const parsed = parser.safeParse(json);
    if (!parsed.success) {
      throw badGateway(`AI service returned invalid payload: ${path}`);
    }

    return parsed.data;
  } catch (error) {
    if (isHttpError(error)) {
      throw error;
    }

    throw badGateway(`AI service request failed: ${path}`);
  }
}

export function createFinanceAiClient(baseUrl: string): FinanceAiClient {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  return {
    extractExpenseText(input) {
      return postJson<FinanceExpenseExtractionResponse>(
        normalizedBaseUrl,
        '/expense/extract-text',
        input,
        expenseExtractionResponseSchema as z.ZodType<FinanceExpenseExtractionResponse>,
      );
    },
    extractInvoiceImage(file) {
      return postMultipart<FinanceInvoiceExtractResponse>(
        normalizedBaseUrl,
        '/invoice/extract-image',
        file,
        invoiceExtractResponseSchema as z.ZodType<FinanceInvoiceExtractResponse>,
      );
    },
    generateAdvice(input) {
      return postJson<FinanceAdviceResponse>(
        normalizedBaseUrl,
        '/advice/generate',
        input,
        adviceResponseSchema as z.ZodType<FinanceAdviceResponse>,
      );
    },
    chatRespond(input) {
      return postJson<FinanceChatAiResponse>(
        normalizedBaseUrl,
        '/chat/respond',
        input,
        chatResponseSchema as z.ZodType<FinanceChatAiResponse>,
      );
    },
  };
}
