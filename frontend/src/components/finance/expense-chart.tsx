import React from "react";

import type { FinanceCategoryMetric } from "./finance-dashboard-data";
import { calculatePercentage, formatFinanceMoney } from "./finance-format";

type ExpenseChartProps = {
  categories: FinanceCategoryMetric[];
};

export function ExpenseChart({ categories }: ExpenseChartProps) {
  return (
    <article className="card section-stack">
      <header className="section-stack">
        <h2>Biểu đồ chi tiêu</h2>
        <p>So sánh chi tiêu hiện tại với ngân sách của từng danh mục.</p>
      </header>

      {categories.length === 0 ? (
        <p>Chưa có dữ liệu để hiển thị.</p>
      ) : (
        <div className="section-stack">
          {categories.map((category) => {
            const percentage = calculatePercentage(category.spent, category.budget);
            const progress = Math.min(percentage, 100);

            return (
              <section key={category.id} className="section-stack">
                <div>
                  <h3>{category.name}</h3>
                  <p>
                    {formatFinanceMoney(category.spent)} / {formatFinanceMoney(category.budget)}
                  </p>
                </div>
                <progress max={100} value={progress} aria-label={`Tiến độ chi tiêu ${category.name}`}>
                  {progress}
                </progress>
                <p>{percentage.toFixed(0)}% ngân sách</p>
              </section>
            );
          })}
        </div>
      )}
    </article>
  );
}
