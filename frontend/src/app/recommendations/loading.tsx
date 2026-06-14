import { PageShell } from "@/components/ui/page-shell";
import { StatusMessage } from "@/components/ui/status-message";

export default function RecommendationsLoading() {
  return (
    <PageShell title="AI tư vấn truyện" description="Đang chuẩn bị khu tư vấn truyện.">
      <StatusMessage>Đang tải AI tư vấn truyện...</StatusMessage>
    </PageShell>
  );
}
