"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { FinanceCategoryMetric } from "./finance-dashboard-data";
import { formatFinanceMoney } from "./finance-format";

type ExpenseChartProps = {
  categories: FinanceCategoryMetric[];
};

type FinanceChartDatum = {
  name: string;
  spent: number;
  budget: number;
};

function formatAxisMoney(value: number | string): string {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) return String(value);

  return formatFinanceMoney(numericValue);
}

export function formatTooltipValue(value: unknown, name: unknown): [string, string] {
  const label = name === "spent" ? "Đã chi" : name === "budget" ? "Ngân sách" : typeof name === "string" ? name : "Giá trị";
  if (typeof value === "number" || typeof value === "string") {
    return [formatAxisMoney(value), label];
  }

  return [formatFinanceMoney(0), label];
}

export function ExpenseChart({ categories }: ExpenseChartProps) {
  const chartData: FinanceChartDatum[] = categories.map((category) => ({
    name: category.name,
    spent: category.spent,
    budget: category.budget,
  }));

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
          <div className="finance-chart-wrap" aria-label="Biểu đồ cột chi tiêu theo danh mục">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickFormatter={formatAxisMoney} tickLine={false} width={88} />
                <Tooltip formatter={formatTooltipValue} />
                <Legend />
                <Bar dataKey="spent" name="Đã chi" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="budget" name="Ngân sách" fill="#bae6fd" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="table-wrap finance-chart-data">
            <table>
              <caption>Dữ liệu biểu đồ chi tiêu</caption>
              <thead>
                <tr>
                  <th scope="col">Danh mục</th>
                  <th scope="col">Đã chi</th>
                  <th scope="col">Ngân sách</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <th scope="row">{category.name}</th>
                    <td>{formatFinanceMoney(category.spent)}</td>
                    <td>{formatFinanceMoney(category.budget)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </article>
  );
}
