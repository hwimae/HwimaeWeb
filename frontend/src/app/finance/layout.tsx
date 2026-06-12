import type { ReactNode } from "react";

import { FinanceShell } from "@/components/finance/finance-shell";

type FinanceLayoutProps = {
  children: ReactNode;
};

export default function FinanceLayout({ children }: FinanceLayoutProps) {
  return <FinanceShell>{children}</FinanceShell>;
}
