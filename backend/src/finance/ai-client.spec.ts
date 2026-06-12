import { createFinanceAiClient } from './ai-client';

describe('createFinanceAiClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('extracts invoice image with structured response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        storeName: 'Highlands',
        totalAmount: 25000,
        purchasedAt: '2026-06-11T09:30:00.000Z',
        rawText: 'Highlands\nTotal: 25,000 VND',
        extractedData: { vat: '10%' },
        assistantMessage: 'Đã đọc hóa đơn.',
      }),
    } as any);

    const client = createFinanceAiClient('http://localhost:8000');
    const file = {
      originalname: 'receipt.txt',
      mimetype: 'text/plain',
      buffer: Buffer.from('Highlands\nTotal: 25,000 VND'),
    } as Express.Multer.File;

    await expect(client.extractInvoiceImage(file)).resolves.toMatchObject({ totalAmount: 25000 });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/invoice/extract-image',
      expect.objectContaining({ method: 'POST' }),
    );

    const [, requestInit] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(requestInit.body).toBeInstanceOf(FormData);
    const formData = requestInit.body as FormData;
    expect(formData.has('file')).toBe(true);

    const uploadedFile = formData.get('file');
    expect(uploadedFile).toBeTruthy();
    expect(uploadedFile).toEqual(
      expect.objectContaining({
        name: 'receipt.txt',
        type: 'text/plain',
      }),
    );
  });

  it('extracts expense text with structured response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        merchantName: 'Highlands',
        amount: 25000,
        categoryId: 'cat1',
        categoryName: 'Ăn uống',
        confidence: 0.9,
        assistantMessage: 'Xác nhận chi tiêu Highlands 25.000đ?',
        requiresConfirmation: true,
      }),
    } as any);

    const client = createFinanceAiClient('http://localhost:8000/');
    await expect(
      client.extractExpenseText({ message: 'cà phê 25k', categories: [], recentExpenses: [], locale: 'vi-VN' }),
    ).resolves.toMatchObject({ amount: 25000 });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/expense/extract-text',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('generates financial advice with highlights and warnings defaults', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ advice: 'Giảm chi tiêu ăn uống tháng này.' }),
    } as any);

    const client = createFinanceAiClient('http://localhost:8000');

    await expect(client.generateAdvice({ period: 'monthly' })).resolves.toEqual({
      advice: 'Giảm chi tiêu ăn uống tháng này.',
      highlights: [],
      warnings: [],
    });
  });

  it('returns chat responses with boolean defaults', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ assistantMessage: 'Mình đã nhận tin nhắn.' }),
    } as any);

    const client = createFinanceAiClient('http://localhost:8000');

    await expect(client.chatRespond({ message: 'hello' })).resolves.toEqual({
      assistantMessage: 'Mình đã nhận tin nhắn.',
      requiresConfirmation: false,
      askingConfirmation: false,
      interrupted: false,
    });
  });
});
