import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import Link from "next/link";

import { ReviewForm } from "@/components/review-form";
import { MetricPill } from "@/components/ui/metric-pill";
import { PageShell } from "@/components/ui/page-shell";
import { PageState } from "@/components/ui/page-state";
import { StatusMessage } from "@/components/ui/status-message";
import { apiGet } from "@/lib/api";
import { parseStory, parseStoryContent, type Story, type StoryContent } from "@/types/story";

type StoryPageParams = {
  id: string;
};

type StoryPageProps = {
  params: Promise<StoryPageParams>;
};

async function getStory(id: string): Promise<Story | null> {
  try {
    return await apiGet<Story>(`/stories/${encodeURIComponent(id)}`, undefined, parseStory, { next: { revalidate: 60 } });
  } catch (error) {
    console.error("[StoryDetailPage] Failed to fetch story", error);
    return null;
  }
}

async function getStoryContent(id: string): Promise<StoryContent | null> {
  try {
    return await apiGet<StoryContent>(`/stories/${encodeURIComponent(id)}/content`, undefined, parseStoryContent, { next: { revalidate: 60 } });
  } catch (error) {
    console.error("[StoryDetailPage] Failed to fetch story content", error);
    return null;
  }
}

export default async function StoryDetailPage({ params }: StoryPageProps) {
  const { id } = await params;
  const [story, storyContent] = await Promise.all([getStory(id), getStoryContent(id)]);

  if (!story) {
    return (
      <PageShell
        title="Không tìm thấy truyện"
        description="Không thể tải chi tiết truyện hoặc truyện không tồn tại."
        eyebrow="Chi tiết truyện"
        variant="workspace"
      >
        <div className="section-stack">
          <Button as={Link} href="/stories" color="primary" variant="flat">
            ← Quay lại danh sách truyện
          </Button>
          <PageState
            tone="info"
            title="Truyện hiện chưa khả dụng"
            description="Backend chưa sẵn sàng hoặc truyện không tồn tại trong dữ liệu hiện tại."
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={story.title}
      description={`Tác giả: ${story.authors}`}
      eyebrow="Chi tiết truyện"
      variant="workspace"
    >
      <div className="section-stack">
        <Button as={Link} href="/stories" color="primary" variant="flat">
          ← Quay lại danh sách truyện
        </Button>

        <Card className="section-stack glass-card story-summary-card" shadow="sm" aria-label="Thông tin truyện">
          <CardHeader className="story-summary-header">
            <div className="section-stack">
              <div className="form-actions">
                <Chip color="primary" variant="flat">
                  {story.category}
                </Chip>
                <MetricPill label="Rating" value={`${story.userAverageRating.toFixed(1)} / 5 · ${story.userReviewCount} review`} />
              </div>
              <h2>{story.title}</h2>
              <p className="result-summary">Tác giả: {story.authors}</p>
            </div>
          </CardHeader>
          <CardBody className="section-stack">
            <p>
              <strong>Số trang:</strong> {story.pages ?? "Chưa rõ"}
            </p>
            <p>
              <strong>Nhà xuất bản:</strong> {story.manufacturer ?? "Chưa rõ"}
            </p>
            <p>
              <strong>Giá hiện tại:</strong> {story.currentPrice ?? "Chưa rõ"}
            </p>
            <p>
              <strong>Giảm giá:</strong> {story.discount !== null ? `${Math.round(story.discount * 100)}%` : "Chưa rõ"}
            </p>
          </CardBody>
        </Card>

        <section className="reader-panel story-reader-surface section-stack">
          <div className="section-stack">
            <p className="eyebrow">Đọc truyện</p>
            <h2>Nội dung</h2>
          </div>
          {storyContent ? (
            <article className="story-reader">
              {storyContent.content.split(/\r?\n/).map((paragraph, index) =>
                paragraph.trim().length > 0 ? <p key={index}>{paragraph}</p> : null,
              )}
            </article>
          ) : (
            <StatusMessage tone="info">
              Truyện này chưa có nội dung đọc trong storage. Hãy chạy lại import stories để copy nội dung vào storage.
            </StatusMessage>
          )}
        </section>

        <ReviewForm storyId={story.id} />
      </div>
    </PageShell>
  );
}
