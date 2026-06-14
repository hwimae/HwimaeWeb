import { PageShell } from "@/components/ui/page-shell";
import { StatusMessage } from "@/components/ui/status-message";

export default function StoriesLoading() {
  return (
    <PageShell title="Truyện" description="Đang tải danh sách truyện và gợi ý phổ biến.">
      <StatusMessage>Đang tải khu truyện...</StatusMessage>
    </PageShell>
  );
}
