import React from "react";

import { StatusMessage } from "../ui/status-message";
import type { FinanceCategory } from "../../types/finance";
import { formatFinanceDate, formatFinanceMoney } from "./finance-format";
import type { FinanceExpenseHighlights } from "./finance-expenses-summary";

export type FinanceExpenseDraft = {
  merchantName: string;
  description: string;
  amount: string;
  categoryId: string;
  spentAt: string;
};

export type FinanceExpensesContentProps = {
  categories: FinanceCategory[];
  highlights: FinanceExpenseHighlights;
  draft: FinanceExpenseDraft;
  isSubmitting: boolean;
  submitMessage: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDraftChange: (patch: Partial<FinanceExpenseDraft>) => void;
};

function renderHeroDetail(label: string, value: string) {
  return (
    <div className="finance-expenses-hero-stat">
      <p className="finance-expenses-hero-stat-label">{label}</p>
      <p className="finance-expenses-hero-stat-value">{value}</p>
    </div>
  );
}

export function FinanceExpensesContent({
  categories,
  highlights,
  draft,
  isSubmitting,
  submitMessage,
  onSubmit,
  onDraftChange,
}: FinanceExpensesContentProps) {
  const highestExpenseLabel = highlights.highestExpense
    ? `${highlights.highestExpense.merchantName || "Không rõ"} (${formatFinanceMoney(highlights.highestExpense.amount)})`
    : "Chưa có dữ liệu";

  const topCategoryLabel = highlights.topCategory
    ? `${highlights.topCategory.label} (${formatFinanceMoney(highlights.topCategory.amount)})`
    : "Chưa có dữ liệu";

  return (
    <section className="section-stack finance-expenses-surface">
      <header className="workspace-card finance-expenses-hero">
        <div className="section-stack finance-expenses-hero-copy">
          <p className="eyebrow">Tài chính · Chi tiêu</p>
          <h2>Tổng chi tiêu tháng này</h2>
          <div className="finance-expenses-hero-total">
            <span>{formatFinanceMoney(highlights.totalAmount)}</span>
          </div>
          <div className="finance-expenses-hero-stats">
            {renderHeroDetail("Cao nhất", highestExpenseLabel)}
            {renderHeroDetail("Danh mục chính", topCategoryLabel)}
          </div>
        </div>
        <div className="finance-expenses-hero-orb" aria-hidden="true" />
      </header>

      <div className="finance-expenses-composer">
        <form className="workspace-card finance-expenses-form" onSubmit={onSubmit}>
          <div className="section-heading-row">
            <div className="section-stack">
              <h3>Thêm khoản chi mới</h3>
              <p>Ghi nhanh giao dịch thủ công và giữ lịch sử chi tiêu của bạn luôn cập nhật.</p>
            </div>
          </div>

          <div className="finance-expenses-form-grid">
            <label className="form-field finance-expenses-field" htmlFor="expense-merchant">
              <span>Nơi chi</span>
              <input id="expense-merchant" value={draft.merchantName} onChange={(event) => onDraftChange({ merchantName: event.target.value })} />
            </label>

            <label className="form-field finance-expenses-field" htmlFor="expense-amount">
              <span>Số tiền (VNĐ)</span>
              <input
                id="expense-amount"
                type="number"
                min="1"
                step="1000"
                required
                value={draft.amount}
                onChange={(event) => onDraftChange({ amount: event.target.value })}
              />
            </label>

            <label className="form-field finance-expenses-field" htmlFor="expense-category">
              <span>Danh mục</span>
              <select id="expense-category" value={draft.categoryId} onChange={(event) => onDraftChange({ categoryId: event.target.value })}>
                <option value="">Chưa phân loại</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field finance-expenses-field" htmlFor="expense-spent-at">
              <span>Thời gian</span>
              <input id="expense-spent-at" type="datetime-local" value={draft.spentAt} onChange={(event) => onDraftChange({ spentAt: event.target.value })} />
            </label>

            <label className="form-field finance-expenses-field finance-expenses-field-full" htmlFor="expense-description">
              <span>Mô tả chi tiết</span>
              <textarea
                id="expense-description"
                rows={3}
                value={draft.description}
                onChange={(event) => onDraftChange({ description: event.target.value })}
              />
            </label>
          </div>

          {submitMessage ? <StatusMessage tone={submitMessage.startsWith("Đã") ? "success" : "error"}>{submitMessage}</StatusMessage> : null}

          <div className="finance-expenses-form-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang thêm..." : "Thêm khoản chi"}
            </button>
          </div>
        </form>

        <aside className="workspace-card finance-expenses-ai-card" aria-label="Khu vực AI phân tích">
          <div className="section-stack">
            <p className="eyebrow">AI Phân tích</p>
            <h3>AI Phân tích</h3>
            <p>Khu vực AI phân tích sẽ được bổ sung sau. Hiện tại card này giữ chỗ để bám layout của workspace Chi tiêu.</p>
          </div>
          <button type="button" className="finance-expenses-secondary-button" disabled aria-disabled="true">
            Xem báo cáo chi tiết
          </button>
        </aside>
      </div>

      <section className="workspace-card finance-expenses-history" aria-label="Lịch sử chi tiêu">
        <div className="section-heading-row finance-expenses-history-header">
          <div className="section-stack">
            <h3>Lịch sử chi tiêu</h3>
          </div>
          <div className="finance-expenses-history-filters" aria-label="Bộ lọc hiển thị demo">
            <button type="button" className="finance-expenses-filter is-active" disabled aria-disabled="true">
              Tất cả
            </button>
            <button type="button" className="finance-expenses-filter" disabled aria-disabled="true">
              Tuần này
            </button>
            <button type="button" className="finance-expenses-filter" disabled aria-disabled="true">
              Tháng này
            </button>
          </div>
        </div>

        {highlights.sortedExpenses.length === 0 ? (
          <StatusMessage>Chưa có khoản chi nào.</StatusMessage>
        ) : (
          <div className="table-wrap finance-expenses-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Ngày</th>
                  <th scope="col">Nơi chi / Mô tả</th>
                  <th scope="col">Danh mục</th>
                  <th scope="col" className="finance-expenses-amount-cell">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {highlights.sortedExpenses.map((expense) => {
                  const category = expense.category ?? (expense.categoryId ? highlights.categoryMap[expense.categoryId] : undefined);

                  return (
                    <tr key={expense.id}>
                      <td>{formatFinanceDate(expense.spentAt)}</td>
                      <td>
                        <div className="finance-expenses-merchant">{expense.merchantName || "Không rõ"}</div>
                        <div className="finance-expenses-description">{expense.description || "-"}</div>
                      </td>
                      <td>
                        <span className="finance-expenses-category-pill">{category?.name || "Khác"}</span>
                      </td>
                      <td className="finance-expenses-amount-cell">{formatFinanceMoney(expense.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
