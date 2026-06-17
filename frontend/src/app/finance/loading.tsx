import { PageShell } from "@/components/ui/page-shell";
import { PageState } from "@/components/ui/page-state";

export default function FinanceLoading() {
  return (
    <PageShell title="Đang tải tài chính" description="Đang chuẩn bị dữ liệu hiển thị." eyebrow="Loading" variant="workspace">
      <PageState
        tone="loading"
        title="Đang tải workspace tài chính"
        description="Đang chuẩn bị dashboard, giao dịch và các nhóm chia sẻ của bạn."
      />
    </PageShell>
  );
}
