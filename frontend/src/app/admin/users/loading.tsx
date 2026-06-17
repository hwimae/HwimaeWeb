import { PageShell } from "@/components/ui/page-shell";
import { PageState } from "@/components/ui/page-state";

export default function AdminUsersLoading() {
  return (
    <PageShell title="Đang tải admin" description="Đang chuẩn bị dữ liệu hiển thị." eyebrow="Loading" variant="workspace">
      <PageState
        tone="loading"
        title="Đang tải danh sách tài khoản chờ duyệt"
        description="Đang chuẩn bị dữ liệu để admin xử lý yêu cầu đăng ký mới."
      />
    </PageShell>
  );
}
