import { StoryAdvisorForm } from "@/components/story-advisor-form";
import { StoryWorkspaceNav } from "@/components/stories/story-workspace-nav";
import { MetricPill } from "@/components/ui/metric-pill";
import { PageShell } from "@/components/ui/page-shell";

export const dynamic = "force-dynamic";

export default function RecommendationsPage() {
  return (
    <PageShell
      title="AI tư vấn truyện"
      description="Nhập gu đọc truyện của bạn để hệ thống tìm truyện liên quan từ nội dung đã index."
      eyebrow="Story workspace"
      variant="workspace"
      heroAside={
        <section className="workspace-card section-stack" aria-label="Khả năng AI tư vấn truyện">
          <p className="eyebrow">AI tư vấn</p>
          <h2>Assistant cho gu đọc của bạn</h2>
          <div className="form-actions">
            <MetricPill label="Input" value="Gu đọc tự do" />
            <MetricPill label="Output" value="Danh sách gợi ý" tone="success" />
          </div>
        </section>
      }
    >
      <div className="section-stack">
        <StoryWorkspaceNav />
        <StoryAdvisorForm />
      </div>
    </PageShell>
  );
}
