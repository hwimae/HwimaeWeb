"use client";

import React, { useEffect, useRef, useState } from "react";

import { StatusMessage } from "../ui/status-message";
import { createFinanceExpense, getFinanceCategories, listFinanceExpenses } from "../../lib/finance-api";
import type { FinanceCategory, FinanceExpense } from "../../types/finance";
import { formatFinanceDate, formatFinanceMoney } from "./finance-format";

type ExpensesState = {
  categories: FinanceCategory[];
  expenses: FinanceExpense[];
  isLoading: boolean;
  error: string | null;
};

type ExpenseDraft = {
  merchantName: string;
  description: string;
  amount: string;
  categoryId: string;
  spentAt: string;
};

const EMPTY_DRAFT: ExpenseDraft = {
  merchantName: "",
  description: "",
  amount: "",
  categoryId: "",
  spentAt: "",
};

function toIsoDateTime(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function FinanceExpenses() {
  const mountedRef = useRef(true);
  const submitAbortRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<ExpensesState>({ categories: [], expenses: [], isLoading: true, error: null });
  const [draft, setDraft] = useState<ExpenseDraft>(EMPTY_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      submitAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const requestOptions = { signal: controller.signal };

    async function loadExpenses() {
      try {
        const [categories, expenses] = await Promise.all([getFinanceCategories(requestOptions), listFinanceExpenses(requestOptions)]);
        if (isMounted) {
          setState({ categories, expenses, isLoading: false, error: null });
        }
      } catch (error) {
        if (isAbortError(error) || !isMounted) return;
        setState({
          categories: [],
          expenses: [],
          isLoading: false,
          error: error instanceof Error ? error.message : "Không thể tải chi tiêu.",
        });
      }
    }

    void loadExpenses();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const categoryMap = state.categories.reduce<Record<string, FinanceCategory>>((acc, category) => {
    acc[category.id] = category;
    return acc;
  }, {});

  const expenses = [...state.expenses].sort((a, b) => new Date(b.spentAt ?? 0).getTime() - new Date(a.spentAt ?? 0).getTime());
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(draft.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setSubmitMessage("Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    submitAbortRef.current?.abort();
    const controller = new AbortController();
    submitAbortRef.current = controller;

    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      const created = await createFinanceExpense(
        {
          merchantName: draft.merchantName.trim() || undefined,
          description: draft.description.trim() || undefined,
          amount,
          categoryId: draft.categoryId || undefined,
          spentAt: toIsoDateTime(draft.spentAt),
          confirmedByUser: true,
          sourceType: "manual",
        },
        { signal: controller.signal },
      );
      if (!mountedRef.current || controller.signal.aborted) return;
      setState((current) => ({ ...current, expenses: [created, ...current.expenses], error: null }));
      setDraft(EMPTY_DRAFT);
      setSubmitMessage("Đã thêm khoản chi mới.");
    } catch (error) {
      if (isAbortError(error) || !mountedRef.current) return;
      setSubmitMessage(error instanceof Error ? error.message : "Không thể thêm khoản chi.");
    } finally {
      if (mountedRef.current && !controller.signal.aborted) {
        setIsSubmitting(false);
      }
      if (submitAbortRef.current === controller) {
        submitAbortRef.current = null;
      }
    }
  }

  return (
    <section className="section-stack">
      <header className="workspace-card section-stack">
        <h2>Danh sách chi tiêu</h2>
        <p>Theo dõi toàn bộ các khoản chi đã ghi nhận trong hệ thống.</p>
        <p>Tổng đã ghi nhận: {formatFinanceMoney(total)}</p>
      </header>

      <form className="workspace-card" onSubmit={handleSubmit}>
        <h3>Thêm khoản chi thủ công</h3>
        <label className="form-field" htmlFor="expense-merchant">
          <span>Nơi chi</span>
          <input id="expense-merchant" value={draft.merchantName} onChange={(event) => setDraft((current) => ({ ...current, merchantName: event.target.value }))} />
        </label>
        <label className="form-field" htmlFor="expense-description">
          <span>Mô tả</span>
          <input id="expense-description" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
        </label>
        <label className="form-field" htmlFor="expense-amount">
          <span>Số tiền</span>
          <input
            id="expense-amount"
            type="number"
            min="1"
            step="1000"
            required
            value={draft.amount}
            onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
          />
        </label>
        <label className="form-field" htmlFor="expense-category">
          <span>Danh mục</span>
          <select id="expense-category" value={draft.categoryId} onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}>
            <option value="">Chưa phân loại</option>
            {state.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field" htmlFor="expense-spent-at">
          <span>Thời gian chi</span>
          <input
            id="expense-spent-at"
            type="datetime-local"
            value={draft.spentAt}
            onChange={(event) => setDraft((current) => ({ ...current, spentAt: event.target.value }))}
          />
        </label>
        {submitMessage ? <StatusMessage tone={submitMessage.startsWith("Đã") ? "success" : "error"}>{submitMessage}</StatusMessage> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang thêm..." : "Thêm khoản chi"}
        </button>
      </form>

      {state.isLoading ? <StatusMessage>Đang tải chi tiêu...</StatusMessage> : null}
      {state.error ? <StatusMessage tone="error">{state.error}</StatusMessage> : null}
      {!state.isLoading && !state.error && expenses.length === 0 ? <StatusMessage>Chưa có khoản chi nào.</StatusMessage> : null}

      {!state.isLoading && !state.error && expenses.length > 0 ? (
        <section className="workspace-card section-stack" aria-label="Bảng chi tiêu">
          <h3>Chi tiết giao dịch</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Nơi chi</th>
                  <th scope="col">Mô tả</th>
                  <th scope="col">Danh mục</th>
                  <th scope="col">Ngày</th>
                  <th scope="col">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => {
                  const category = expense.category ?? (expense.categoryId ? categoryMap[expense.categoryId] : undefined);

                  return (
                    <tr key={expense.id}>
                      <td>{expense.merchantName || "Không rõ"}</td>
                      <td>{expense.description || "-"}</td>
                      <td>{category?.name || "Khác"}</td>
                      <td>{formatFinanceDate(expense.spentAt)}</td>
                      <td>{formatFinanceMoney(expense.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </section>
  );
}
