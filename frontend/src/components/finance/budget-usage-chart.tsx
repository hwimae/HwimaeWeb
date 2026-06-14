"use client";

import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { calculatePercentage, formatFinanceMoney } from "./finance-format";

type BudgetUsageChartProps = {
  label: string;
  spent: number;
  budget: number;
  size?: "default" | "small";
};

type UsageDatum = {
  name: string;
  value: number;
};

export function BudgetUsageChart({ label, spent, budget, size = "default" }: BudgetUsageChartProps) {
  const percentage = calculatePercentage(spent, budget);
  const chartPercentage = Math.min(Math.max(percentage, 0), 100);
  const remainingPercentage = Math.max(100 - chartPercentage, 0);
  const chartData: UsageDatum[] = [
    { name: "Đã sử dụng", value: chartPercentage },
    { name: "Còn lại", value: remainingPercentage },
  ];
  const hasBudget = budget > 0;
  const chartHeight = size === "small" ? 90 : 130;
  const usageLabel = `${label}: ${percentage.toFixed(1)}% ngân sách, đã chi ${formatFinanceMoney(spent)} trên ${formatFinanceMoney(budget)}`;

  return (
    <section className={`budget-usage-chart budget-usage-chart-${size}`}>
      <div>
        <p className="eyebrow">{label}</p>
        {hasBudget ? (
          <p className="budget-usage-chart-summary">
            <strong>{percentage.toFixed(1)}%</strong> ngân sách
          </p>
        ) : (
          <p className="budget-usage-chart-summary">Chưa có ngân sách</p>
        )}
      </div>

      {hasBudget ? (
        <div className="budget-usage-chart-visual" role="img" aria-label={`Biểu đồ ${usageLabel}`}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie data={chartData} dataKey="value" innerRadius="68%" outerRadius="92%" paddingAngle={2} startAngle={90} endAngle={-270} stroke="none">
                <Cell fill="var(--primary)" />
                <Cell fill="var(--surface-muted)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="budget-usage-chart-center" aria-hidden="true">
            {percentage.toFixed(0)}%
          </div>
        </div>
      ) : null}

      <p className="budget-usage-chart-detail">
        Đã chi {formatFinanceMoney(spent)} / {formatFinanceMoney(budget)}
      </p>
    </section>
  );
}
