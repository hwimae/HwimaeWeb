import { PageShell } from "@/components/ui/page-shell";
import { StatusMessage } from "@/components/ui/status-message";

export default function FinanceLoading() {
  return (
    <PageShell title="Quản lý tài chính" description="Đang tải khu tài chính.">
      <StatusMessage>Đang tải dữ liệu tài chính...</StatusMessage>
    </PageShell>
  );
}
