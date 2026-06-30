"use client";

import React, { useEffect, useState } from "react";

import { StatusMessage } from "../ui/status-message";
import { getFinanceCategories, getFinanceSpendingSummary, listFinanceBudgets, listFinanceExpenses } from "../../lib/finance-api";
import type { FinanceBudget, FinanceCategory, FinanceExpense, SpendingSummary } from "../../types/finance";
import { BudgetInsights } from "./budget-insights";
import { CategoryCard } from "./category-card";
import { buildFinanceCategoryMetrics } from "./finance-dashboard-data";
import { ExpenseChart } from "./expense-chart";
import { formatFinanceMoney } from "./finance-format";
import { RecentTransactions } from "./recent-transaction";

type DashboardState = {
  categories: FinanceCategory[];
  budgets: FinanceBudget[];
  expenses: FinanceExpense[];
  summary: SpendingSummary | null;
  isLoading: boolean;
  error: string | null;
};

type FinanceStatCardProps = {
  label: string;
  value: string;
  detail: string;
  tone: "spending" | "budget" | "remaining";
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function FinanceStatCard({ label, value, detail, tone }: FinanceStatCardProps) {
  return (
    <article className={`finance-stat-card finance-stat-card-${tone}`}>
      <div>
        <p className="finance-stat-label">{label}</p>
        <p className="finance-stat-value">{value}</p>
        <p className="finance-stat-detail">{detail}</p>
      </div>
    </article>
  );
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
  const budgetedCategoryCount = categoriesWithBudget.filter((category) => category.budget > 0).length;

  return (
    <section className="section-stack finance-dashboard">
      {state.isLoading ? <StatusMessage>Đang tải dữ liệu tài chính...</StatusMessage> : null}
      {state.error ? <StatusMessage tone="error">{state.error}</StatusMessage> : null}

      {!state.isLoading && !state.error ? (
        <>
          <section className="finance-stat-grid" aria-label="Tổng quan ngân sách">
            <FinanceStatCard label="Tổng chi tiêu" value={formatFinanceMoney(totalSpent)} detail="Toàn bộ dữ liệu đã ghi nhận" tone="spending" />
            <FinanceStatCard label="Ngân sách" value={formatFinanceMoney(totalBudget)} detail={`${budgetedCategoryCount} danh mục có hạn mức`} tone="budget" />
            <FinanceStatCard label="Còn lại" value={formatFinanceMoney(remaining)} detail="Phần ngân sách chưa sử dụng" tone="remaining" />
          </section>

          <section className="finance-chart-grid" aria-label="Biểu đồ và cảnh báo ngân sách">
            <ExpenseChart categories={categoriesWithBudget} />
            <BudgetInsights categories={categoriesWithBudget} totalSpent={totalSpent} totalBudget={totalBudget} />
          </section>

          <section className="section-stack" aria-label="Danh mục chi tiêu">
            <div className="section-heading-row">
              <div className="section-stack">
                <h2>Danh mục chi tiêu</h2>
              </div>
            </div>
            {categoriesWithBudget.length === 0 ? (
              <StatusMessage>Chưa có danh mục hoặc ngân sách để hiển thị.</StatusMessage>
            ) : (
              <div className="card-grid finance-category-grid">
                {categoriesWithBudget.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            )}
          </section>

          <RecentTransactions expenses={state.expenses} categories={state.categories} />
        </>
      ) : null}
    </section>
  );
}
