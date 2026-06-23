import React from "react";

import { StoryAdvisorForm } from "../../components/story-advisor-form";
import { StoryWorkspaceNav } from "../../components/stories/story-workspace-nav";
import { PageShell } from "../../components/ui/page-shell";

export default function RecommendationsPage() {
  return (
    <PageShell
      title="AI tư vấn truyện"
      description="Mô tả gu đọc của bạn để StoryRec phân tích và gợi ý những truyện phù hợp từ dữ liệu đã nhập."
      eyebrow="Story workspace"
      variant="workspace"
    >
      <div className="section-stack story-workspace-layout">
        <StoryWorkspaceNav />
        <StoryAdvisorForm />
      </div>
    </PageShell>
  );
}
