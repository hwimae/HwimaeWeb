import { StoryAdvisorForm } from "@/components/story-advisor-form";
import { PageShell } from "@/components/ui/page-shell";

export const dynamic = "force-dynamic";

export default function RecommendationsPage() {
  return (
    <PageShell
      title="AI tư vấn truyện"
      description="Nhập gu đọc truyện của bạn để hệ thống tìm truyện liên quan từ nội dung đã index."
    >
      <StoryAdvisorForm />
    </PageShell>
  );
}
