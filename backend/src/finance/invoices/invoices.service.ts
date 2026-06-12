import { readFile, realpath } from 'fs/promises';
import path from 'path';
import type { Prisma } from '@prisma/client';
import type { BackendDeps } from '../../dependencies';
import { HttpError, validationError } from '../../errors';
import type { FinanceInvoiceExtractResponse } from '../ai-client';
import { FINANCE_INVOICE_UPLOAD_DIR, FINANCE_INVOICE_UPLOAD_ROOT } from './invoices.storage';

export type FinanceInvoicesService = {
  list(userId: string): Promise<unknown[]>;
  processUpload(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ invoice: unknown; pendingExpense: Record<string, unknown> | null }>;
};

export function createFinanceInvoicesService(
  deps: Pick<BackendDeps, 'prisma' | 'financeAiClient'>,
): FinanceInvoicesService {
  function parsePurchasedAt(value?: string | null): Date | undefined {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  function toPendingExpense(invoiceId: string, result: FinanceInvoiceExtractResponse) {
    if (typeof result.totalAmount !== 'number') {
      return null;
    }

    return {
      invoiceId,
      merchantName: result.storeName ?? null,
      description: result.rawText ?? result.assistantMessage,
      amount: result.totalAmount,
      spentAt: result.purchasedAt ?? null,
      sourceType: 'image',
    };
  }

  function isPathWithinRoot(candidatePath: string, rootPath: string): boolean {
    const normalizedCandidate = process.platform === 'win32' ? candidatePath.toLowerCase() : candidatePath;
    const normalizedRoot = process.platform === 'win32' ? rootPath.toLowerCase() : rootPath;
    const relative = path.relative(normalizedRoot, normalizedCandidate);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  }

  async function resolveUploadRootPath(): Promise<string> {
    try {
      return await realpath(FINANCE_INVOICE_UPLOAD_ROOT);
    } catch {
      return FINANCE_INVOICE_UPLOAD_ROOT;
    }
  }

  async function resolveSafeStoredFilePath(file: Express.Multer.File): Promise<string> {
    const uploadRootPath = await resolveUploadRootPath();

    if (!file.path) {
      const fallbackPath = path.resolve(uploadRootPath, file.filename || file.originalname);
      if (!isPathWithinRoot(fallbackPath, uploadRootPath)) {
        throw validationError('Invalid finance invoice upload path');
      }

      return path.normalize(fallbackPath);
    }

    const resolvedPath = path.resolve(file.path);
    if (!isPathWithinRoot(resolvedPath, uploadRootPath)) {
      throw validationError('Invalid finance invoice upload path');
    }

    let canonicalPath = resolvedPath;
    try {
      canonicalPath = await realpath(resolvedPath);
    } catch {
      canonicalPath = resolvedPath;
    }

    if (!isPathWithinRoot(canonicalPath, uploadRootPath)) {
      throw validationError('Invalid finance invoice upload path');
    }

    return path.normalize(canonicalPath);
  }

  async function ensureFileBuffer(file: Express.Multer.File): Promise<Express.Multer.File> {
    if (file.buffer?.length) {
      return file;
    }

    const safePath = await resolveSafeStoredFilePath(file);
    const buffer = await readFile(safePath);
    return { ...file, path: safePath, buffer };
  }

  function isAiOcrFailure(error: unknown): error is HttpError {
    return error instanceof HttpError && error.statusCode === 502;
  }

  return {
    async list(userId) {
      return deps.prisma.financeInvoice.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    },

    async processUpload(userId, file) {
      const storedFilePath = await resolveSafeStoredFilePath(file);
      const invoice = await deps.prisma.financeInvoice.create({
        data: {
          userId,
          filename: file.originalname,
          filePath: storedFilePath,
          status: 'pending',
        },
      });

      const uploadFile = await ensureFileBuffer({ ...file, path: storedFilePath });

      let extraction: FinanceInvoiceExtractResponse;
      try {
        extraction = await deps.financeAiClient.extractInvoiceImage(uploadFile);
      } catch (error) {
        if (!isAiOcrFailure(error)) {
          throw error;
        }

        const failedInvoice = await deps.prisma.financeInvoice.update({
          where: { id: invoice.id },
          data: { status: 'failed' },
        });

        return {
          invoice: failedInvoice,
          pendingExpense: null,
        };
      }

      const purchasedAt = parsePurchasedAt(extraction.purchasedAt);
      const updatedInvoice = await deps.prisma.financeInvoice.update({
        where: { id: invoice.id },
        data: {
          status: typeof extraction.totalAmount === 'number' ? 'processed' : 'pending',
          storeName: extraction.storeName ?? undefined,
          purchasedAt,
          totalAmount: extraction.totalAmount ?? undefined,
          extractedData: extraction.extractedData as Prisma.InputJsonValue,
        },
      });

      return {
        invoice: updatedInvoice,
        pendingExpense: toPendingExpense(invoice.id, extraction),
      };
    },
  };
}
