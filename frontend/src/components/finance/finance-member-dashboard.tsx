"use client";

import React from "react";

import type { FinanceGroupMemberDashboard } from "../../types/finance";
import { BudgetInsights } from "./budget-insights";
import { BudgetUsageChart } from "./budget-usage-chart";
import { buildFinanceCategoryMetrics } from "./finance-dashboard-data";
import { calculatePercentage, formatFinanceMoney } from "./finance-format";
import { RecentTransactions } from "./recent-transaction";

type FinanceMemberDashboardProps = {
  dashboard: FinanceGroupMemberDashboard;
  canDelete: boolean;
  onDeleteExpense: (expenseId: string) => void;
  onDeleteBudget: (budgetId: string) => void;
};

export function FinanceMemberDashboard({ dashboard, canDelete, onDeleteExpense, onDeleteBudget }: FinanceMemberDashboardProps) {
  const categoriesWithBudget = buildFinanceCategoryMetrics(dashboard.categories, dashboard.budgets, dashboard.summary);
  const totalSpent = dashboard.summary.totalAmount;
  const totalBudget = categoriesWithBudget.reduce((sum, category) => sum + category.budget, 0);
  const remaining = Math.max(totalBudget - totalSpent, 0);
  const usagePercentage = calculatePercentage(totalSpent, totalBudget);

  return (
    <section className="section-stack" aria-label={`Nội dung Finance của ${dashboard.member.name}`}>
      <header className="workspace-card section-stack">
        <h2>Đang xem nội dung Finance của {dashboard.member.name}</h2>
        <p>Dữ liệu này dùng chung nguồn với dashboard Finance cá nhân của {dashboard.member.name}.</p>
      </header>
      <section className="workspace-card section-stack" aria-label="Tổng quan thành viên">
        <h3>Tổng quan</h3>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th scope="row">Tổng chi tiêu</th>
                <td>{formatFinanceMoney(totalSpent)}</td>
              </tr>
              <tr>
                <th scope="row">Tổng ngân sách</th>
                <td>{formatFinanceMoney(totalBudget)}</td>
              </tr>
              <tr>
                <th scope="row">Còn lại</th>
                <td>{formatFinanceMoney(remaining)}</td>
              </tr>
              <tr>
                <th scope="row">Mức sử dụng</th>
                <td>{usagePercentage.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <BudgetUsageChart label="Mức sử dụng ngân sách của thành viên" spent={totalSpent} budget={totalBudget} />
      </section>
      <BudgetInsights categories={categoriesWithBudget} totalSpent={totalSpent} totalBudget={totalBudget} />
      <RecentTransactions expenses={dashboard.expenses} categories={dashboard.categories} />
      {canDelete ? (
        <section className="workspace-card section-stack" aria-label="Quản trị dữ liệu thành viên">
          <h3>Quản trị dữ liệu</h3>
          {dashboard.expenses.map((expense) => (
            <button key={expense.id} type="button" onClick={() => onDeleteExpense(expense.id)}>
              Xóa khoản chi {expense.merchantName || expense.id}
            </button>
          ))}
          {dashboard.budgets.map((budget) => (
            <button key={budget.id} type="button" onClick={() => onDeleteBudget(budget.id)}>
              Xóa ngân sách {budget.category?.name || budget.id}
            </button>
          ))}
        </section>
      ) : null}
    </section>
  );
}
