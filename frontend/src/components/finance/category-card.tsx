import { Card, CardBody } from "@heroui/react";
import React from "react";

import { BudgetUsageChart } from "./budget-usage-chart";
import { calculatePercentage, formatFinanceMoney } from "./finance-format";

type CategoryCardProps = {
  category: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
    spent: number;
    budget: number;
  };
};

export function CategoryCard({ category }: CategoryCardProps) {
  const hasBudget = category.budget > 0;
  const percentage = calculatePercentage(category.spent, category.budget);
  const remaining = Math.max(category.budget - category.spent, 0);
  const categoryIcon = category.icon || category.name.slice(0, 1).toUpperCase();
  const usageLabel = hasBudget ? `${percentage.toFixed(0)}%` : "Chưa đặt ngân sách";
  const statusLabel = !hasBudget ? "Chưa đặt ngân sách" : category.spent > category.budget ? "Vượt hạn mức" : "Đang kiểm soát";

  return (
    <Card as="article" className="section-stack glass-card finance-category-card" shadow="sm">
      <CardBody className="section-stack finance-category-card-body">
        <header className="finance-category-card-header">
          <div className="finance-category-icon" style={{ backgroundColor: category.color ?? undefined }} aria-hidden="true">
            {categoryIcon}
          </div>
          <div>
            <h3>{category.name}</h3>
            <p>Đã chi {formatFinanceMoney(category.spent)}</p>
          </div>
        </header>

        <BudgetUsageChart label={`Mức sử dụng ngân sách ${category.name}`} spent={category.spent} budget={category.budget} size="small" />

        <dl className="finance-category-metrics data-grid">
          <div>
            <dt>Ngân sách</dt>
            <dd>{formatFinanceMoney(category.budget)}</dd>
          </div>
          <div>
            <dt>Còn lại</dt>
            <dd>{formatFinanceMoney(remaining)}</dd>
          </div>
          <div>
            <dt>Mức dùng</dt>
            <dd>{usageLabel}</dd>
          </div>
          <div>
            <dt>Trạng thái</dt>
            <dd>{statusLabel}</dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}
