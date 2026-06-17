import { PageShell } from "@/components/ui/page-shell";
import { PageState } from "@/components/ui/page-state";

export default function RecommendationsLoading() {
  return (
    <PageShell title="Đang tải AI tư vấn" description="Đang chuẩn bị form và kết quả gợi ý truyện." eyebrow="Loading" variant="workspace">
      <PageState tone="loading" title="Đang mở khu AI tư vấn truyện" description="Form nhập gu đọc và danh sách gợi ý sẽ hiển thị sau vài giây." />
    </PageShell>
  );
}
