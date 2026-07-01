import React from "react";

import { StoryAdvisorPanel } from "../../components/story-advisor-panel";
import { PageShell } from "../../components/ui/page-shell";

export default function RecommendationsPage() {
  return (
    <PageShell
      title="AI tư vấn truyện"
      description="Mô tả gu đọc của bạn để StoryRec phân tích và gợi ý những truyện phù hợp từ dữ liệu đã nhập."
      eyebrow="Story workspace"
      variant="workspace"
    >
      <StoryAdvisorPanel />
    </PageShell>
  );
}
