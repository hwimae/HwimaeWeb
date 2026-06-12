import React from "react";

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
  const progress = Math.min(percentage, 100);
  const remaining = Math.max(category.budget - category.spent, 0);

  return (
    <article className="card section-stack">
      <header className="section-stack">
        <div>
          <h3>{category.name}</h3>
          <p>Đã chi {formatFinanceMoney(category.spent)}</p>
        </div>
        <p>{percentage.toFixed(0)}% ngân sách</p>
      </header>

      <div className="section-stack">
        <label htmlFor={`category-progress-${category.id}`}>Mức sử dụng ngân sách</label>
        <progress id={`category-progress-${category.id}`} max={100} value={progress}>
          {progress}
        </progress>
      </div>

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
    </article>
  );
}
