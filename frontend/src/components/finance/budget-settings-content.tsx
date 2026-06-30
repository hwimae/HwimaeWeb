import React from "react";

import type { FinanceCategory } from "../../types/finance";
import { formatFinanceAmountInput, formatFinanceMoney } from "./finance-format";

export type BudgetSettingsContentProps = {
  categories: FinanceCategory[];
  drafts: Record<string, number>;
  isSaving: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDraftChange: (categoryId: string, value: string) => void;
};

export function BudgetSettingsContent({
  categories,
  drafts,
  isSaving,
  onSubmit,
  onDraftChange,
}: BudgetSettingsContentProps) {
  return (
    <form className="workspace-card section-stack" onSubmit={onSubmit}>
      <div className="section-stack">
        <h3>Cấu hình hạn mức</h3>
        <p>Nhập ngân sách theo từng danh mục, để trống hoặc nhập 0 nếu muốn bỏ hạn mức.</p>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Danh mục</th>
              <th scope="col">Ngân sách hiện tại</th>
              <th scope="col">Hạn mức mới</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const currentBudget = drafts[category.id] ?? 0;

              return (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{formatFinanceMoney(currentBudget)}</td>
                  <td>
                    <label htmlFor={`budget-${category.id}`}>Hạn mức {category.name}</label>
                    <input
                      id={`budget-${category.id}`}
                      type="text"
                      inputMode="numeric"
                      value={currentBudget === 0 ? "" : formatFinanceAmountInput(currentBudget)}
                      onChange={(event) => onDraftChange(category.id, event.target.value)}
                      placeholder="Ví dụ: 1.000.000"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <button type="submit" disabled={isSaving}>
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}
