import { PageShell } from "@/components/ui/page-shell";
import { StatusMessage } from "@/components/ui/status-message";

export default function StoryDetailLoading() {
  return (
    <PageShell title="Chi tiết truyện" description="Đang tải nội dung truyện.">
      <StatusMessage>Đang tải chi tiết truyện...</StatusMessage>
    </PageShell>
  );
}
