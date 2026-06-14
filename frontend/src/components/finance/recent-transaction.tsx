import { Card, CardBody } from "@heroui/react";
import React from "react";

import type { FinanceCategory, FinanceExpense } from "../../types/finance";
import { formatFinanceDate, formatFinanceMoney } from "./finance-format";

type RecentTransactionsProps = {
  expenses: FinanceExpense[];
  categories: FinanceCategory[];
};

export function RecentTransactions({ expenses, categories }: RecentTransactionsProps) {
  const categoryMap = categories.reduce<Record<string, FinanceCategory>>((acc, category) => {
    acc[category.id] = category;
    return acc;
  }, {});

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.spentAt ?? 0).getTime() - new Date(a.spentAt ?? 0).getTime())
    .slice(0, 10);

  return (
    <Card as="article" className="section-stack" shadow="sm">
      <CardBody className="section-stack">
        <header className="section-stack">
          <h2>Giao dịch gần đây</h2>
          <p>10 khoản chi mới nhất đã được ghi nhận.</p>
        </header>

        {recentExpenses.length === 0 ? (
          <p>Chưa có giao dịch nào.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Nơi chi</th>
                  <th scope="col">Danh mục</th>
                  <th scope="col">Ngày</th>
                  <th scope="col">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((expense) => {
                  const category = expense.category ?? (expense.categoryId ? categoryMap[expense.categoryId] : undefined);

                  return (
                    <tr key={expense.id}>
                      <td>{expense.merchantName || expense.description || "Không rõ"}</td>
                      <td>{category?.name || "Khác"}</td>
                      <td>{formatFinanceDate(expense.spentAt)}</td>
                      <td>{formatFinanceMoney(expense.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
