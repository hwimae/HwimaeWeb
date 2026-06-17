import { Card, CardBody } from "@heroui/react";
import React from "react";

import { BudgetUsageChart } from "./budget-usage-chart";
import { calculatePercentage, formatFinanceMoney } from "./finance-format";

type CategoryCardProps = {
  category: {
    id: string;
    name: string;
    color?: string | null;
    spent: number;
    budget: number;
  };
};

export function CategoryCard({ category }: CategoryCardProps) {
  const percentage = calculatePercentage(category.spent, category.budget);
  const remaining = Math.max(category.budget - category.spent, 0);

  return (
    <Card as="article" className="section-stack glass-card" shadow="sm">
      <CardBody className="section-stack">
        <header className="section-stack">
          <div>
            <h3>{category.name}</h3>
            <p>Đã chi {formatFinanceMoney(category.spent)}</p>
          </div>
          <p>{percentage.toFixed(0)}% ngân sách</p>
        </header>

        <BudgetUsageChart label={`Mức sử dụng ngân sách ${category.name}`} spent={category.spent} budget={category.budget} size="small" />

        <dl className="data-grid">
          <div>
            <dt>Ngân sách</dt>
            <dd>{formatFinanceMoney(category.budget)}</dd>
          </div>
          <div>
            <dt>Còn lại</dt>
            <dd>{formatFinanceMoney(remaining)}</dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}
