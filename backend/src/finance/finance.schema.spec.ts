import { financeIdParamSchema, financePaginationQuerySchema } from './finance.schema';

describe('finance common schemas', () => {
  it('parses a cuid-like id param as string', () => {
    expect(financeIdParamSchema.parse({ id: 'abc123' })).toEqual({ id: 'abc123' });
  });

  it('defaults pagination query', () => {
    expect(financePaginationQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
  });

  it('coerces pagination query strings', () => {
    expect(financePaginationQuerySchema.parse({ page: '2', limit: '50' })).toEqual({ page: 2, limit: 50 });
  });
});
