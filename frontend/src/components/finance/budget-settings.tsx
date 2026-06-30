"use client";

import React, { useEffect, useRef, useState } from "react";

import { StatusMessage } from "../ui/status-message";
import { deleteFinanceBudget, getFinanceCategories, listFinanceBudgets, upsertFinanceBudget } from "../../lib/finance-api";
import type { FinanceBudget, FinanceCategory } from "../../types/finance";
import { BudgetSettingsContent } from "./budget-settings-content";
import { buildBudgetSavePlans } from "./budget-settings-data";
import { parseFinanceAmountInput } from "./finance-format";
import {
  FINANCE_SUBMIT_TIMEOUT_MS,
  isFinanceSubmitTimeoutError,
  runFinanceSubmitWithTimeout,
} from "./finance-submit-recovery";

type BudgetDrafts = Record<string, number>;

function toBudgetDrafts(categories: FinanceCategory[], budgets: FinanceBudget[]): BudgetDrafts {
  return categories.reduce<BudgetDrafts>((acc, category) => {
    acc[category.id] = budgets.find((budget) => budget.categoryId === category.id)?.limitAmount ?? 0;
    return acc;
  }, {});
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function BudgetSettings() {
  const mountedRef = useRef(true);
  const saveAbortRef = useRef<AbortController | null>(null);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [budgets, setBudgets] = useState<FinanceBudget[]>([]);
  const [drafts, setDrafts] = useState<BudgetDrafts>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      saveAbortRef.current?.abort();
    };
  }, []);

  async function loadBudgetData(signal?: AbortSignal): Promise<boolean> {
    try {
      const [nextCategories, nextBudgets] = await Promise.all([
        getFinanceCategories({ signal }),
        listFinanceBudgets({ signal }),
      ]);

      if (!mountedRef.current || signal?.aborted) return false;
      setCategories(nextCategories);
      setBudgets(nextBudgets);
      setDrafts(toBudgetDrafts(nextCategories, nextBudgets));
      setError(null);
      return true;
    } catch (error) {
      if (isAbortError(error) || !mountedRef.current || signal?.aborted) return false;
      setError(error instanceof Error ? error.message : "Không thể tải ngân sách.");
      return false;
    } finally {
      if (mountedRef.current && !signal?.aborted) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    void loadBudgetData(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  async function handleSave() {
    saveAbortRef.current?.abort();
    const controller = new AbortController();
    saveAbortRef.current = controller;

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      await runFinanceSubmitWithTimeout(
        controller,
        async (signal) => {
          const requestOptions = { signal };
          const plans = buildBudgetSavePlans(categories, budgets, drafts);

          await Promise.all(
            plans.map((plan) => {
              if (plan.type === "delete") return deleteFinanceBudget(plan.budgetId, requestOptions);
              return upsertFinanceBudget(
                {
                  categoryId: plan.categoryId,
                  period: "monthly",
                  limitAmount: plan.limitAmount,
                  alertThreshold: 0.8,
                },
                requestOptions,
              );
            }),
          );

          await loadBudgetData(signal);
        },
        FINANCE_SUBMIT_TIMEOUT_MS,
      );

      if (!mountedRef.current || controller.signal.aborted) return;
      setMessage("Đã lưu thay đổi ngân sách.");
    } catch (error) {
      if (!mountedRef.current || isAbortError(error) || controller.signal.aborted) return;

      if (isFinanceSubmitTimeoutError(error)) {
        setError("Hệ thống đang chậm, đang tải lại dữ liệu ngân sách...");
        const didReload = await loadBudgetData();
        if (!mountedRef.current) return;

        if (didReload) {
          setMessage("Dữ liệu ngân sách đã được tải lại. Vui lòng thử lưu lại nếu cần.");
          setError(null);
        } else {
          setMessage(null);
          setError("Không thể tải lại dữ liệu ngân sách. Vui lòng thử lại sau.");
        }
        return;
      }

      setError(error instanceof Error ? error.message : "Không thể lưu ngân sách.");
    } finally {
      if (saveAbortRef.current === controller) {
        saveAbortRef.current = null;
        if (mountedRef.current) {
          setIsSaving(false);
        }
      }
    }
  }

  function handleBudgetChange(categoryId: string, value: string) {
    const parsed = parseFinanceAmountInput(value) ?? 0;
    setDrafts((current) => ({ ...current, [categoryId]: parsed }));
  }

  return (
    <section className="section-stack">
      <header className="workspace-card section-stack">
        <h2>Ngân sách theo danh mục</h2>
        <p>Thiết lập hạn mức cho từng nhóm chi tiêu cá nhân.</p>
      </header>

      {isLoading ? <StatusMessage>Đang tải ngân sách...</StatusMessage> : null}
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
      {!isLoading && !error && categories.length === 0 ? <StatusMessage>Chưa có danh mục để cấu hình ngân sách.</StatusMessage> : null}

      {!isLoading && !error && categories.length > 0 ? (
        <BudgetSettingsContent
          categories={categories}
          drafts={drafts}
          isSaving={isSaving}
          onDraftChange={handleBudgetChange}
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        />
      ) : null}
    </section>
  );
}
