"use client";

import React, { useEffect, useState } from "react";

import { StatusMessage } from "../ui/status-message";
import { getFinanceCategories, getFinanceSpendingSummary, listFinanceBudgets, listFinanceExpenses } from "../../lib/finance-api";
import type { FinanceBudget, FinanceCategory, FinanceExpense, SpendingSummary } from "../../types/finance";
import { BudgetInsights } from "./budget-insights";
import { BudgetUsageChart } from "./budget-usage-chart";
import { CategoryCard } from "./category-card";
import { buildFinanceCategoryMetrics } from "./finance-dashboard-data";
import { ExpenseChart } from "./expense-chart";
import { calculatePercentage, formatFinanceMoney } from "./finance-format";
import { RecentTransactions } from "./recent-transaction";

type DashboardState = {
  categories: FinanceCategory[];
  budgets: FinanceBudget[];
  expenses: FinanceExpense[];
  summary: SpendingSummary | null;
  isLoading: boolean;
  error: string | null;
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function FinanceDashboard() {
  const [state, setState] = useState<DashboardState>({
    categories: [],
    budgets: [],
    expenses: [],
    summary: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const requestOptions = { signal: controller.signal };

    async function loadDashboard() {
      try {
        const [categories, budgets, summary, expenses] = await Promise.all([
          getFinanceCategories(requestOptions),
          listFinanceBudgets(requestOptions),
          getFinanceSpendingSummary(requestOptions),
          listFinanceExpenses(requestOptions),
        ]);

        if (isMounted) {
          setState({ categories, budgets, expenses, summary, isLoading: false, error: null });
        }
      } catch (error) {
        if (isAbortError(error) || !isMounted) return;
        setState({
          categories: [],
          budgets: [],
          expenses: [],
          summary: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Không thể tải dashboard tài chính.",
        });
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const categoriesWithBudget = buildFinanceCategoryMetrics(state.categories, state.budgets, state.summary);
  const totalSpent = state.summary?.totalAmount ?? 0;
  const totalBudget = categoriesWithBudget.reduce((sum, category) => sum + category.budget, 0);
  const remaining = Math.max(totalBudget - totalSpent, 0);
  const usagePercentage = calculatePercentage(totalSpent, totalBudget);

  return (
    <section className="section-stack">
      <header className="card section-stack">
        <h2>Dashboard tài chính</h2>
        <p>Theo dõi tổng quan chi tiêu, ngân sách và các danh mục đang sử dụng.</p>
      </header>

      {state.isLoading ? <StatusMessage>Đang tải dữ liệu tài chính...</StatusMessage> : null}
      {state.error ? <StatusMessage tone="error">{state.error}</StatusMessage> : null}

      {!state.isLoading && !state.error ? (
        <>
          <section className="card section-stack" aria-label="Tổng quan ngân sách">
            <h3>Tổng quan</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Chỉ số</th>
                    <th scope="col">Giá trị</th>
                  </tr>
                </thead>
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
            <BudgetUsageChart label="Mức sử dụng tổng ngân sách" spent={totalSpent} budget={totalBudget} />
          </section>

          <section className="section-stack" aria-label="Danh mục chi tiêu">
            <h3>Theo danh mục</h3>
            {categoriesWithBudget.length === 0 ? (
              <StatusMessage>Chưa có danh mục hoặc ngân sách để hiển thị.</StatusMessage>
            ) : (
              <div className="card-grid">
                {categoriesWithBudget.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            )}
          </section>

          <section className="finance-chart-grid" aria-label="Biểu đồ và cảnh báo ngân sách">
            <ExpenseChart categories={categoriesWithBudget} />
            <BudgetInsights categories={categoriesWithBudget} totalSpent={totalSpent} totalBudget={totalBudget} />
          </section>
          <RecentTransactions expenses={state.expenses} categories={state.categories} />
        </>
      ) : null}
    </section>
  );
}
