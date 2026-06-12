import React from "react";

import { AppNav, type AppNavItem } from "../ui/app-nav";

export const FINANCE_NAV_ITEMS: AppNavItem[] = [
  { href: "/finance/dashboard", label: "Dashboard" },
  { href: "/finance/chat", label: "AI" },
  { href: "/finance/expenses", label: "Chi tiêu" },
  { href: "/finance/budgets", label: "Ngân sách" },
];

export function FinanceNav() {
  return <AppNav items={FINANCE_NAV_ITEMS} ariaLabel="Điều hướng tài chính" />;
}
