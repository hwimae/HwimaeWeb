import React from "react";

import { PageShell } from "../../components/ui/page-shell";
import { PageState } from "../../components/ui/page-state";

export default function StoriesLoading() {
  return (
    <PageShell
      title="Đang tải truyện"
      description="Đang chuẩn bị danh sách và gợi ý truyện."
      eyebrow="Loading"
      variant="workspace"
    >
      <div className="story-loading-state">
        <PageState
          tone="loading"
          title="Đang đồng bộ khu Truyện"
          description="Vui lòng chờ trong giây lát để danh sách và gợi ý hiển thị đúng bố cục mới."
        />
      </div>
    </PageShell>
  );
}
