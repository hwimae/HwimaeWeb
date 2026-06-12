"use client";

import React, { useEffect, useRef, useState } from "react";

import { StatusMessage } from "../ui/status-message";
import { deleteFinanceBudget, getFinanceCategories, listFinanceBudgets, upsertFinanceBudget } from "../../lib/finance-api";
import type { FinanceBudget, FinanceCategory } from "../../types/finance";
import { buildBudgetSavePlans } from "./budget-settings-data";
import { formatFinanceMoney } from "./finance-format";

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
    return () => {
      mountedRef.current = false;
      saveAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const requestOptions = { signal: controller.signal };

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        const [nextCategories, nextBudgets] = await Promise.all([getFinanceCategories(requestOptions), listFinanceBudgets(requestOptions)]);
        if (!isMounted) return;

        setCategories(nextCategories);
        setBudgets(nextBudgets);
        setDrafts(toBudgetDrafts(nextCategories, nextBudgets));
      } catch (error) {
        if (isAbortError(error) || !isMounted) return;
        setError(error instanceof Error ? error.message : "Không thể tải ngân sách.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  async function handleSave() {
    saveAbortRef.current?.abort();
    const controller = new AbortController();
    saveAbortRef.current = controller;
    const requestOptions = { signal: controller.signal };

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const plans = buildBudgetSavePlans(categories, budgets, drafts);
      await Promise.all(
        plans.map((plan) => {
          if (plan.type === "delete") return deleteFinanceBudget(plan.budgetId, requestOptions);
          if (plan.type === "update") {
            return upsertFinanceBudget({ categoryId: plan.categoryId, period: "monthly", limitAmount: plan.limitAmount, alertThreshold: 0.8 }, requestOptions);
          }
          return upsertFinanceBudget({ categoryId: plan.categoryId, period: "monthly", limitAmount: plan.limitAmount, alertThreshold: 0.8 }, requestOptions);
        }),
      );
      const [nextCategories, nextBudgets] = await Promise.all([getFinanceCategories(requestOptions), listFinanceBudgets(requestOptions)]);
      if (!mountedRef.current || controller.signal.aborted) return;
      setCategories(nextCategories);
      setBudgets(nextBudgets);
      setDrafts(toBudgetDrafts(nextCategories, nextBudgets));
      setMessage("Đã lưu thay đổi ngân sách.");
    } catch (error) {
      if (isAbortError(error) || !mountedRef.current) return;
      setError(error instanceof Error ? error.message : "Không thể lưu ngân sách.");
    } finally {
      if (mountedRef.current && !controller.signal.aborted) {
        setIsSaving(false);
      }
      if (saveAbortRef.current === controller) {
        saveAbortRef.current = null;
      }
    }
  }

  function handleBudgetChange(categoryId: string, value: string) {
    const normalized = value.replace(/[^\d]/g, "");
    setDrafts((current) => ({ ...current, [categoryId]: normalized.length > 0 ? Number(normalized) : 0 }));
  }

  return (
    <section className="section-stack">
      <header className="card section-stack">
        <h2>Ngân sách theo danh mục</h2>
        <p>Thiết lập hạn mức cho từng nhóm chi tiêu cá nhân.</p>
      </header>

      {isLoading ? <StatusMessage>Đang tải ngân sách...</StatusMessage> : null}
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
      {!isLoading && !error && categories.length === 0 ? <StatusMessage>Chưa có danh mục để cấu hình ngân sách.</StatusMessage> : null}

      {!isLoading && !error && categories.length > 0 ? (
        <form className="card section-stack" onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}>
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
                          value={currentBudget === 0 ? "" : String(currentBudget)}
                          onChange={(event) => handleBudgetChange(category.id, event.target.value)}
                          placeholder="Ví dụ: 1000000"
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
      ) : null}
    </section>
  );
}
