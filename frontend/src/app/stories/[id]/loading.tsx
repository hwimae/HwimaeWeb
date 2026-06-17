import { PageShell } from "@/components/ui/page-shell";
import { PageState } from "@/components/ui/page-state";

export default function StoryDetailLoading() {
  return (
    <PageShell title="Đang tải truyện" description="Đang chuẩn bị chi tiết và nội dung truyện." eyebrow="Loading" variant="workspace">
      <PageState tone="loading" title="Đang mở trang chi tiết truyện" description="Thông tin truyện, phần đọc và khu review sẽ hiển thị ngay khi dữ liệu sẵn sàng." />
    </PageShell>
  );
}
