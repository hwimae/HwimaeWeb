import Link from "next/link";

import { ReviewForm } from "@/components/review-form";
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
    return await apiGet<Story>(`/stories/${encodeURIComponent(id)}`, undefined, parseStory);
  } catch (error) {
    console.error("[StoryDetailPage] Failed to fetch story", error);
    return null;
  }
}

async function getStoryContent(id: string): Promise<StoryContent | null> {
  try {
    return await apiGet<StoryContent>(`/stories/${encodeURIComponent(id)}/content`, undefined, parseStoryContent);
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
      <main>
        <Link href="/">← Quay lại danh sách truyện</Link>
        <h1>Không tìm thấy truyện</h1>
        <p>Không thể tải chi tiết truyện hoặc truyện không tồn tại.</p>
      </main>
    );
  }

  return (
    <main>
      <Link href="/">← Quay lại danh sách truyện</Link>

      <h1>{story.title}</h1>

      <p>
        <strong>Tác giả:</strong> {story.authors}
      </p>
      <p>
        <strong>Thể loại:</strong> {story.category}
      </p>
      <p>
        <strong>Đánh giá từ người dùng app:</strong> {story.userAverageRating.toFixed(1)} / 5 ({story.userReviewCount} review)
      </p>
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
      <section className="reader-panel">
        <h2>Đọc truyện</h2>
        {storyContent ? (
          <article className="story-reader">
            {storyContent.content.split(/\r?\n/).map((paragraph, index) =>
              paragraph.trim().length > 0 ? <p key={index}>{paragraph}</p> : null,
            )}
          </article>
        ) : (
          <p>Truyện này chưa có nội dung đọc trong storage. Hãy chạy lại import stories để copy nội dung vào storage.</p>
        )}
      </section>

      <ReviewForm storyId={story.id} />
    </main>
  );
}
