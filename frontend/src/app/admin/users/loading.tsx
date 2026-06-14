import { PageShell } from "@/components/ui/page-shell";
import { StatusMessage } from "@/components/ui/status-message";

export default function AdminUsersLoading() {
  return (
    <PageShell title="Duyệt tài khoản" description="Đang tải danh sách tài khoản chờ duyệt.">
      <StatusMessage>Đang tải trang duyệt tài khoản...</StatusMessage>
    </PageShell>
  );
}
