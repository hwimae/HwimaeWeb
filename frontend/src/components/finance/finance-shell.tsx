"use client";

import { usePathname } from "next/navigation";
import React, { type ReactNode } from "react";

import { PageShell } from "../ui/page-shell";
import { FinanceNav } from "./finance-nav";

const PAGE_COPY: Record<string, { title: string; description: string }> = {
  "/finance/dashboard": {
    title: "Tài chính cá nhân",
    description: "Theo dõi chi tiêu, ngân sách và các danh mục tài chính của bạn.",
  },
  "/finance/chat": {
    title: "AI tài chính",
    description: "Trao đổi với trợ lý về chi tiêu, hóa đơn và kế hoạch ngân sách cá nhân.",
  },
  "/finance/expenses": {
    title: "Chi tiêu",
    description: "Xem lại các khoản chi đã ghi nhận và theo dõi giao dịch gần đây.",
  },
  "/finance/budgets": {
    title: "Ngân sách",
    description: "Thiết lập hạn mức theo danh mục để kiểm soát thói quen chi tiêu.",
  },
  "/finance/groups": {
    title: "Nhóm tài chính",
    description: "Chia sẻ dashboard tài chính cá nhân với các thành viên trong nhóm.",
  },
};

const DEFAULT_COPY = {
  title: "Quản lý tài chính",
  description: "Theo dõi chi tiêu, quản lý ngân sách và nhận hỗ trợ từ AI.",
};

type FinanceShellProps = {
  children: ReactNode;
};

export function FinanceShell({ children }: FinanceShellProps) {
  const pathname = usePathname();
  const copy = PAGE_COPY[pathname] ?? DEFAULT_COPY;
  const isGroupsRoute = pathname === "/finance/groups" || pathname.startsWith("/finance/groups/");

  return (
    <PageShell title={copy.title} description={copy.description} eyebrow="Finance workspace" variant="workspace">
      {isGroupsRoute ? (
        <div className="finance-shell-layout">
          <aside className="finance-shell-sidebar workspace-card" aria-label="Khu vực điều hướng Finance">
            <FinanceNav variant="rail" />
          </aside>
          <div className="finance-shell-main section-stack">{children}</div>
        </div>
      ) : (
        <div className="section-stack">
          <FinanceNav />
          {children}
        </div>
      )}
    </PageShell>
  );
}
