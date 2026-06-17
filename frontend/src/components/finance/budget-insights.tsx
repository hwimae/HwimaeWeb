import React from "react";

import type { FinanceCategoryMetric } from "./finance-dashboard-data";
import { calculatePercentage, formatFinanceMoney } from "./finance-format";

type BudgetInsightsProps = {
  categories: FinanceCategoryMetric[];
  totalSpent: number;
  totalBudget: number;
};

type BudgetAlert = {
  category: FinanceCategoryMetric;
  percentage: number;
  variant: "exceeded" | "near-limit";
};

function findBudgetAlert(categories: FinanceCategoryMetric[]): BudgetAlert | null {
  const budgetedCategories = categories.filter((category) => category.budget > 0);
  const categoriesByUsage = budgetedCategories
    .map((category) => ({
      category,
      percentage: calculatePercentage(category.spent, category.budget),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const exceeded = categoriesByUsage.find((item) => item.category.spent > item.category.budget);
  if (exceeded) {
    return { ...exceeded, variant: "exceeded" };
  }

  const nearLimit = categoriesByUsage.find((item) => item.percentage >= 80);
  if (nearLimit) {
    return { ...nearLimit, variant: "near-limit" };
  }

  return null;
}

export function BudgetInsights({ categories, totalSpent, totalBudget }: BudgetInsightsProps) {
  const usagePercentage = calculatePercentage(totalSpent, totalBudget);
  const alert = findBudgetAlert(categories);

  return (
    <article className="workspace-card section-stack">
      <header className="section-stack">
        <h2>Cảnh báo ngân sách</h2>
        <p>Theo dõi tổng mức sử dụng và các danh mục cần chú ý.</p>
      </header>

      <section className="finance-insight-card" aria-label="Tổng mức sử dụng ngân sách">
        <p className="eyebrow">Tổng mức sử dụng</p>
        {totalBudget <= 0 ? (
          <p>Chưa có ngân sách tổng để theo dõi.</p>
        ) : (
          <div className="section-stack">
            <p className="finance-insight-value">{usagePercentage.toFixed(1)}% tổng ngân sách</p>
            <p>
              Đã chi {formatFinanceMoney(totalSpent)} / {formatFinanceMoney(totalBudget)}.
            </p>
          </div>
        )}
      </section>

      <section className="finance-insight-card" aria-label="Danh mục cần chú ý">
        <p className="eyebrow">Danh mục cần chú ý</p>
        {alert ? (
          <div className="section-stack">
            <p className="finance-insight-value">{alert.variant === "exceeded" ? "Vượt ngân sách" : "Gần vượt ngân sách"}</p>
            <p>
              {alert.category.name} đã dùng {alert.percentage.toFixed(0)}% ngân sách: {formatFinanceMoney(alert.category.spent)} / {formatFinanceMoney(alert.category.budget)}.
            </p>
          </div>
        ) : (
          <p>Các danh mục vẫn trong ngưỡng an toàn.</p>
        )}
      </section>
    </article>
  );
}
