"use client";

import React from "react";

import { WorkspaceTabs } from "../ui/workspace-tabs";

export const FINANCE_NAV_ITEMS = [
  {
    href: "/finance/dashboard",
    label: "Dashboard",
    match: (pathname: string) => pathname === "/finance" || pathname === "/finance/dashboard",
  },
  { href: "/finance/chat", label: "AI" },
  { href: "/finance/expenses", label: "Chi tiêu" },
  { href: "/finance/budgets", label: "Ngân sách" },
  { href: "/finance/groups", label: "Nhóm" },
] as const;

type FinanceNavProps = {
  variant?: "default" | "rail";
};

export function FinanceNav({ variant = "default" }: FinanceNavProps) {
  return (
    <WorkspaceTabs
      ariaLabel="Điều hướng tài chính"
      items={[...FINANCE_NAV_ITEMS]}
      orientation={variant === "rail" ? "vertical" : "horizontal"}
      className={variant === "rail" ? "finance-nav finance-nav-rail" : "finance-nav"}
    />
  );
}
