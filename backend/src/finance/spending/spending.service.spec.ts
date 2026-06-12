import { summarizeExpenses } from './spending.service';

describe('summarizeExpenses', () => {
  it('groups expense totals by category name', () => {
    expect(
      summarizeExpenses([
        { amount: 25000, category: { id: 'food', name: 'Ăn uống' } },
        { amount: 75000, category: { id: 'transport', name: 'Đi lại' } },
        { amount: 50000, category: { id: 'food', name: 'Ăn uống' } },
      ]),
    ).toEqual({
      totalAmount: 150000,
      categories: [
        { categoryId: 'food', categoryName: 'Ăn uống', amount: 75000 },
        { categoryId: 'transport', categoryName: 'Đi lại', amount: 75000 },
      ],
    });
  });

  it('keeps decimal totals precise while aggregating', () => {
    expect(
      summarizeExpenses([
        { amount: 0.1, category: { id: 'food', name: 'Ăn uống' } },
        { amount: 0.2, category: { id: 'food', name: 'Ăn uống' } },
      ]),
    ).toEqual({
      totalAmount: 0.3,
      categories: [{ categoryId: 'food', categoryName: 'Ăn uống', amount: 0.3 }],
    });
  });
});
