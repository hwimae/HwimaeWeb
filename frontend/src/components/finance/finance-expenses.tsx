"use client";

import React, { useEffect, useRef, useState } from "react";

import { StatusMessage } from "../ui/status-message";
import { createFinanceExpense, getFinanceCategories, listFinanceExpenses } from "../../lib/finance-api";
import type { FinanceCategory, FinanceExpense } from "../../types/finance";
import { FinanceExpensesContent, type FinanceExpenseDraft } from "./finance-expenses-content";
import { buildFinanceExpenseHighlights } from "./finance-expenses-summary";

type ExpensesState = {
  categories: FinanceCategory[];
  expenses: FinanceExpense[];
  isLoading: boolean;
  error: string | null;
};

const EMPTY_DRAFT: FinanceExpenseDraft = {
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
  const [draft, setDraft] = useState<FinanceExpenseDraft>(EMPTY_DRAFT);
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

  if (state.isLoading) {
    return (
      <section className="section-stack finance-expenses-loading">
        <StatusMessage>Đang tải chi tiêu...</StatusMessage>
      </section>
    );
  }

  const highlights = buildFinanceExpenseHighlights(state.categories, state.expenses);

  return (
    <section className="section-stack finance-expenses-page">
      {state.error ? <StatusMessage tone="error">{state.error}</StatusMessage> : null}
      <FinanceExpensesContent
        categories={state.categories}
        highlights={highlights}
        draft={draft}
        isSubmitting={isSubmitting}
        submitMessage={submitMessage}
        onSubmit={handleSubmit}
        onDraftChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
      />
    </section>
  );
}
