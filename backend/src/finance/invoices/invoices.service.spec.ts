import { badGateway, validationError } from '../../errors';
import { createFinanceInvoicesService } from './invoices.service';

function createPrismaMock() {
  return {
    financeInvoice: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

function createFile(): Express.Multer.File {
  const buffer = Buffer.from('Highlands\nTotal: 25,000 VND');

  return {
    fieldname: 'file',
    originalname: 'receipt.txt',
    encoding: '7bit',
    mimetype: 'text/plain',
    size: buffer.length,
    destination: 'uploads/finance',
    filename: 'receipt.txt',
    path: 'uploads/finance/receipt.txt',
    buffer,
    stream: undefined as any,
  };
}

describe('createFinanceInvoicesService', () => {
  it('lists invoices for the current user', async () => {
    const prisma = createPrismaMock();
    prisma.financeInvoice.findMany.mockResolvedValue([{ id: 'invoice1' }]);
    const service = createFinanceInvoicesService({ prisma, financeAiClient: {} as any } as any);

    await expect(service.list('user1')).resolves.toEqual([{ id: 'invoice1' }]);
    expect(prisma.financeInvoice.findMany).toHaveBeenCalledWith({ where: { userId: 'user1' }, orderBy: { createdAt: 'desc' } });
  });

  it('processes upload, stores OCR result, and returns pending expense context', async () => {
    const prisma = createPrismaMock();
    prisma.financeInvoice.create.mockResolvedValue({
      id: 'invoice1',
      userId: 'user1',
      filename: 'receipt.txt',
      filePath: 'uploads\\finance\\receipt.txt',
      status: 'pending',
    });
    prisma.financeInvoice.update.mockResolvedValue({
      id: 'invoice1',
      userId: 'user1',
      filename: 'receipt.txt',
      filePath: 'uploads\\finance\\receipt.txt',
      status: 'processed',
      storeName: 'Highlands',
      totalAmount: 25000,
      purchasedAt: new Date('2026-06-11T09:30:00.000Z'),
      extractedData: { vat: '10%' },
    });

    const financeAiClient = {
      extractInvoiceImage: jest.fn().mockResolvedValue({
        storeName: 'Highlands',
        totalAmount: 25000,
        purchasedAt: '2026-06-11T09:30:00.000Z',
        rawText: 'Highlands\nTotal: 25,000 VND',
        extractedData: { vat: '10%' },
        assistantMessage: 'Đã đọc hóa đơn Highlands.',
      }),
    };

    const service = createFinanceInvoicesService({ prisma, financeAiClient } as any);

    await expect(service.processUpload('user1', createFile())).resolves.toEqual({
      invoice: {
        id: 'invoice1',
        userId: 'user1',
        filename: 'receipt.txt',
        filePath: 'uploads\\finance\\receipt.txt',
        status: 'processed',
        storeName: 'Highlands',
        totalAmount: 25000,
        purchasedAt: new Date('2026-06-11T09:30:00.000Z'),
        extractedData: { vat: '10%' },
      },
      pendingExpense: {
        invoiceId: 'invoice1',
        merchantName: 'Highlands',
        description: 'Highlands\nTotal: 25,000 VND',
        amount: 25000,
        spentAt: '2026-06-11T09:30:00.000Z',
        sourceType: 'image',
      },
    });

    expect(financeAiClient.extractInvoiceImage).toHaveBeenCalledWith(
      expect.objectContaining({
        originalname: 'receipt.txt',
        mimetype: 'text/plain',
        buffer: expect.any(Buffer),
      }),
    );
    expect(prisma.financeInvoice.create).toHaveBeenCalledWith({
      data: {
        userId: 'user1',
        filename: 'receipt.txt',
        filePath: expect.stringContaining('uploads'),
        status: 'pending',
      },
    });
    expect(prisma.financeInvoice.update).toHaveBeenCalledWith({
      where: { id: 'invoice1' },
      data: {
        status: 'processed',
        storeName: 'Highlands',
        purchasedAt: new Date('2026-06-11T09:30:00.000Z'),
        totalAmount: 25000,
        extractedData: { vat: '10%' },
      },
    });
  });

  it('marks invoice as failed and returns no pending expense when AI OCR returns 502', async () => {
    const prisma = createPrismaMock();
    prisma.financeInvoice.create.mockResolvedValue({
      id: 'invoice2',
      userId: 'user1',
      filename: 'receipt.txt',
      filePath: 'uploads\\finance\\receipt.txt',
      status: 'pending',
    });
    prisma.financeInvoice.update.mockResolvedValue({
      id: 'invoice2',
      userId: 'user1',
      filename: 'receipt.txt',
      filePath: 'uploads\\finance\\receipt.txt',
      status: 'failed',
    });

    const financeAiClient = {
      extractInvoiceImage: jest.fn().mockRejectedValue(badGateway('OCR unavailable')),
    };

    const service = createFinanceInvoicesService({ prisma, financeAiClient } as any);

    await expect(service.processUpload('user1', createFile())).resolves.toEqual({
      invoice: {
        id: 'invoice2',
        userId: 'user1',
        filename: 'receipt.txt',
        filePath: 'uploads\\finance\\receipt.txt',
        status: 'failed',
      },
      pendingExpense: null,
    });

    expect(prisma.financeInvoice.update).toHaveBeenCalledWith({
      where: { id: 'invoice2' },
      data: { status: 'failed' },
    });
  });

  it('rethrows non-AI errors and does not mark invoice as failed', async () => {
    const prisma = createPrismaMock();
    prisma.financeInvoice.create.mockResolvedValue({
      id: 'invoice3',
      userId: 'user1',
      filename: 'receipt.txt',
      filePath: 'uploads\\finance\\receipt.txt',
      status: 'pending',
    });

    const unexpectedError = validationError('Invalid finance invoice upload path');
    const financeAiClient = {
      extractInvoiceImage: jest.fn().mockRejectedValue(unexpectedError),
    };

    const service = createFinanceInvoicesService({ prisma, financeAiClient } as any);

    await expect(service.processUpload('user1', createFile())).rejects.toBe(unexpectedError);
    expect(prisma.financeInvoice.update).not.toHaveBeenCalled();
  });
});
