import { FINANCE_INVOICE_MAX_FILE_SIZE_BYTES, isAllowedFinanceInvoiceFile } from './invoices.router';

describe('finance invoice upload configuration', () => {
  it('allows common image files for OCR', () => {
    expect(isAllowedFinanceInvoiceFile({ mimetype: 'image/png' } as Express.Multer.File)).toBe(true);
    expect(isAllowedFinanceInvoiceFile({ mimetype: 'image/jpeg' } as Express.Multer.File)).toBe(true);
    expect(isAllowedFinanceInvoiceFile({ mimetype: 'image/webp' } as Express.Multer.File)).toBe(true);
  });

  it('rejects non-image files', () => {
    expect(isAllowedFinanceInvoiceFile({ mimetype: 'application/pdf' } as Express.Multer.File)).toBe(false);
    expect(isAllowedFinanceInvoiceFile({ mimetype: 'text/plain' } as Express.Multer.File)).toBe(false);
  });

  it('limits uploads to five megabytes', () => {
    expect(FINANCE_INVOICE_MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });
});
