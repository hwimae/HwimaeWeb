"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import type { AppNavItem } from "../ui/app-nav";

export const FINANCE_NAV_ITEMS: AppNavItem[] = [
  { href: "/finance/dashboard", label: "Dashboard" },
  { href: "/finance/chat", label: "AI" },
  { href: "/finance/expenses", label: "Chi tiêu" },
  { href: "/finance/budgets", label: "Ngân sách" },
  { href: "/finance/groups", label: "Nhóm" },
];

export function FinanceNav() {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label="Điều hướng tài chính">
      {FINANCE_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Button
            key={item.href}
            as={Link}
            href={item.href}
            color="primary"
            variant={isActive ? "solid" : "flat"}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
}
