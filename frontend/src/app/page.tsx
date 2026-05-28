import Link from "next/link";
import { StoryListControls } from "@/components/story-list-controls";
import { apiGet } from "@/lib/api";
import {
  parseRecommendationsResponse,
  type RecommendationsResponse,
} from "@/types/recommendation";
import { parsePaginatedStories, type PaginatedStories } from "@/types/story";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type StoryListParams = {
  page: number;
  limit: number;
  query: string;
  hasContent: boolean;
};

type StoriesState = {
  stories: PaginatedStories;
  hasError: boolean;
};

type RecommendationsState = {
  recommendations: RecommendationsResponse;
  hasError: boolean;
};

export const dynamic = "force-dynamic";

const EMPTY_STORIES: PaginatedStories = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
};

const EMPTY_RECOMMENDATIONS: RecommendationsResponse = {
  items: [],
};

function getSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseStoryListParams(searchParams: Record<string, string | string[] | undefined>): StoryListParams {
  const page = Number(getSingleParam(searchParams.page) ?? "1");
  const query = getSingleParam(searchParams.q)?.trim() ?? "";
  const hasContent = getSingleParam(searchParams.hasContent) === "true";

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: 20,
    query,
    hasContent,
  };
}

function buildStoriesPath(params: StoryListParams): string {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.query.length > 0) query.set("q", params.query);
  if (params.hasContent) query.set("hasContent", "true");

  return `/stories?${query.toString()}`;
}

function buildPageHref(params: StoryListParams, page: number): string {
  const query = new URLSearchParams();

  if (params.query.length > 0) query.set("q", params.query);
  if (params.hasContent) query.set("hasContent", "true");
  if (page > 1) query.set("page", String(page));

  const next = query.toString();
  return next ? `/?${next}` : "/";
}

async function getStories(params: StoryListParams): Promise<StoriesState> {
  try {
    const stories = await apiGet<PaginatedStories>(
      buildStoriesPath(params),
      undefined,
      parsePaginatedStories,
    );
    return { stories, hasError: false };
  } catch (error) {
    console.error("[HomePage] Failed to fetch stories list", error);
    return { stories: { ...EMPTY_STORIES, page: params.page, limit: params.limit }, hasError: true };
  }
}

async function getPopularRecommendations(): Promise<RecommendationsState> {
  try {
    const recommendations = await apiGet<RecommendationsResponse>(
      "/recommendations/popular?limit=6",
      undefined,
      parseRecommendationsResponse,
    );
    return { recommendations, hasError: false };
  } catch (error) {
    console.error("[HomePage] Failed to fetch recommendations", error);
    return { recommendations: EMPTY_RECOMMENDATIONS, hasError: true };
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = parseStoryListParams(await searchParams);
  const [{ stories, hasError }, { recommendations, hasError: recommendationsHasError }] = await Promise.all([
    getStories(params),
    getPopularRecommendations(),
  ]);
  const totalPages = Math.max(1, Math.ceil(stories.total / stories.limit));

  return (
    <main>
      <header className="header">
        <div>
          <h1>Story Recommendation Platform</h1>
          <p>Khám phá truyện chữ và viết review để nhận gợi ý phù hợp.</p>
        </div>
        <nav className="auth-links">
          <Link href="/login">Đăng nhập</Link>
          <Link href="/register">Đăng ký</Link>
        </nav>
      </header>

      <section className="recommendation-section">
        <h2>Gợi ý truyện phổ biến</h2>
        <p className="result-summary">
          Các truyện được xếp hạng theo rating và số lượng review từ dữ liệu gốc.
        </p>
        {recommendationsHasError ? (
          <p className="warning-text">Không thể tải gợi ý truyện lúc này.</p>
        ) : null}
        {recommendations.items.length === 0 ? (
          <p>Chưa có đủ tín hiệu review để tạo gợi ý.</p>
        ) : (
          <div className="story-grid">
            {recommendations.items.map((item) => (
              <Link key={item.storyId} href={`/stories/${item.storyId}`} className="story-card recommendation-card">
                <h3 className="story-title">{item.title}</h3>
                <p className="story-meta">Tác giả: {item.authors}</p>
                <p className="story-meta">Thể loại: {item.category}</p>
                <p className="story-meta">
                  Dữ liệu gốc: {item.averageRating.toFixed(1)} ({item.reviewCount} review)
                </p>
                <p className="recommendation-score">Score: {item.score.toFixed(2)}</p>
                <p className="recommendation-reason">{item.reason}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Truyện mới nhập</h2>
        <StoryListControls query={params.query} hasContent={params.hasContent} />
        <p className="result-summary">
          Tìm thấy {stories.total} truyện{params.hasContent ? " có nội dung đọc" : ""}.
        </p>
        {hasError ? (
          <p className="warning-text">
            Không thể tải danh sách truyện lúc này. Đang hiển thị danh sách rỗng tạm thời.
          </p>
        ) : null}
        {stories.items.length === 0 ? (
          <p>Chưa có dữ liệu truyện phù hợp hoặc backend chưa sẵn sàng.</p>
        ) : (
          <>
            <div className="story-grid">
              {stories.items.map((story) => (
                <Link key={story.id} href={`/stories/${story.id}`} className="story-card">
                  <h3 className="story-title">{story.title}</h3>
                  <p className="story-meta">Tác giả: {story.authors}</p>
                  <p className="story-meta">
                    Dữ liệu gốc: {story.externalAverageRating.toFixed(1)} ({story.externalReviewCount} review)
                  </p>
                  <p className="story-meta">
                    Người dùng app: {story.userAverageRating.toFixed(1)} ({story.userReviewCount} review)
                  </p>
                  <p className="story-meta">{story.category}</p>
                  {story.currentPrice !== null ? <p className="story-meta">Giá: {story.currentPrice}</p> : null}
                  {story.hasContent ? <span className="story-badge">Có nội dung</span> : null}
                </Link>
              ))}
            </div>
            <nav className="pagination" aria-label="Phân trang danh sách truyện">
              {stories.page > 1 ? <Link href={buildPageHref(params, stories.page - 1)}>Trước</Link> : <span>Trước</span>}
              <span>Trang {stories.page} / {totalPages}</span>
              {stories.page < totalPages ? <Link href={buildPageHref(params, stories.page + 1)}>Sau</Link> : <span>Sau</span>}
            </nav>
          </>
        )}
      </section>
    </main>
  );
}
