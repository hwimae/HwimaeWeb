import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import Link from "next/link";

import { StoryWorkspaceNav } from "@/components/stories/story-workspace-nav";
import { StoryListControls } from "@/components/story-list-controls";
import { MetricPill } from "@/components/ui/metric-pill";
import { PageShell } from "@/components/ui/page-shell";
import { PageState } from "@/components/ui/page-state";
import { StatusMessage } from "@/components/ui/status-message";
import { apiGet } from "@/lib/api";
import {
  parseRecommendationsResponse,
  type RecommendationsResponse,
} from "@/types/recommendation";
import { parsePaginatedStories, type PaginatedStories } from "@/types/story";

type StoriesPageProps = {
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
  return next ? `/stories?${next}` : "/stories";
}

async function getStories(params: StoryListParams): Promise<StoriesState> {
  try {
    const stories = await apiGet<PaginatedStories>(
      buildStoriesPath(params),
      undefined,
      parsePaginatedStories,
      { next: { revalidate: 60 } },
    );
    return { stories, hasError: false };
  } catch (error) {
    console.error("[StoriesPage] Failed to fetch stories list", error);
    return { stories: { ...EMPTY_STORIES, page: params.page, limit: params.limit }, hasError: true };
  }
}

async function getPopularRecommendations(): Promise<RecommendationsState> {
  try {
    const recommendations = await apiGet<RecommendationsResponse>(
      "/recommendations/popular?limit=6",
      undefined,
      parseRecommendationsResponse,
      { next: { revalidate: 120 } },
    );
    return { recommendations, hasError: false };
  } catch (error) {
    console.error("[StoriesPage] Failed to fetch recommendations", error);
    return { recommendations: EMPTY_RECOMMENDATIONS, hasError: true };
  }
}

export default async function StoriesPage({ searchParams }: StoriesPageProps) {
  const params = parseStoryListParams(await searchParams);
  const [{ stories, hasError }, { recommendations, hasError: recommendationsHasError }] = await Promise.all([
    getStories(params),
    getPopularRecommendations(),
  ]);
  const totalPages = Math.max(1, Math.ceil(stories.total / stories.limit));

  return (
    <PageShell
      title="Truyện"
      description="Khám phá truyện chữ, đọc nội dung đã nhập và viết review để nhận gợi ý phù hợp."
      eyebrow="Story workspace"
      variant="workspace"
    >
      <div className="section-stack">
        <StoryWorkspaceNav />

        <section className="workspace-card section-stack story-feature-surface" aria-label="Khám phá truyện">
          <div className="section-heading-row">
            <div className="section-stack">
              <p className="eyebrow">Truyện · Sáng tác & khám phá</p>
              <h2>Khám phá thế giới truyện</h2>
              <p className="result-summary">
                Tìm kiếm, đọc và lưu trữ những câu chuyện tuyệt vời từ dữ liệu đã nhập.
              </p>
            </div>
            <div className="page-header-actions">
              <Button as={Link} href="/recommendations" color="primary">
                AI tư vấn
              </Button>
              <Button as={Link} href="/login" color="primary" variant="flat">
                Đăng nhập
              </Button>
              <Button as={Link} href="/register" color="primary" variant="flat">
                Đăng ký
              </Button>
            </div>
          </div>
        </section>

        <section className="section-stack">
          <div className="section-heading-row">
            <div className="section-stack">
              <p className="eyebrow">Nổi bật</p>
              <h2>Gợi ý truyện phổ biến</h2>
              <p className="result-summary">Các truyện được xếp hạng theo rating và số lượng review từ người dùng app.</p>
            </div>
          </div>
          {recommendationsHasError ? (
            <StatusMessage tone="error">Không thể tải gợi ý truyện lúc này.</StatusMessage>
          ) : null}
          {recommendations.items.length === 0 ? (
            <PageState
              tone="empty"
              title="Chưa có đủ gợi ý từ cộng đồng"
              description="Hãy thêm review hoặc quay lại sau khi có thêm dữ liệu từ người dùng app."
              cta={<Link href="/recommendations">Mở AI tư vấn</Link>}
            />
          ) : (
            <div className="story-grid">
              {recommendations.items.map((item) => (
                <Link key={item.storyId} href={`/stories/${item.storyId}`} className="story-card recommendation-card">
                  <div className="form-actions">
                    <Chip color="primary" variant="flat">
                      {item.category}
                    </Chip>
                    <MetricPill label="Score" value={item.score.toFixed(2)} tone="success" />
                  </div>
                  <h3 className="story-title">{item.title}</h3>
                  <p className="story-meta">Tác giả: {item.authors}</p>
                  <MetricPill label="Rating" value={`${item.averageRating.toFixed(1)} · ${item.reviewCount} review`} />
                  <p className="recommendation-reason">{item.reason}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="section-stack">
          <div className="section-heading-row">
            <div className="section-stack">
              <p className="eyebrow">Thư viện truyện</p>
              <h2>Truyện mới nhập</h2>
            </div>
          </div>
          <StoryListControls query={params.query} hasContent={params.hasContent} />
          <p className="result-summary">
            Tìm thấy {stories.total} truyện{params.hasContent ? " có nội dung đọc" : ""}.
          </p>
          {hasError ? (
            <StatusMessage tone="error">
              Không thể tải danh sách truyện lúc này. Đang hiển thị danh sách rỗng tạm thời.
            </StatusMessage>
          ) : null}
          {stories.items.length === 0 ? (
            <PageState
              tone="empty"
              title="Chưa có truyện phù hợp"
              description="Hãy đổi từ khóa tìm kiếm hoặc bỏ bộ lọc nội dung đọc để xem thêm kết quả."
            />
          ) : (
            <>
              <div className="story-grid">
                {stories.items.map((story) => (
                  <Link key={story.id} href={`/stories/${story.id}`} className="story-card">
                    <div className="form-actions">
                      <Chip color="primary" variant="flat">
                        {story.category}
                      </Chip>
                      {story.hasContent ? (
                        <Chip color="success" variant="flat">
                          Có nội dung
                        </Chip>
                      ) : null}
                    </div>
                    <h3 className="story-title">{story.title}</h3>
                    <p className="story-meta">Tác giả: {story.authors}</p>
                    <MetricPill label="Rating" value={`${story.userAverageRating.toFixed(1)} · ${story.userReviewCount} review`} />
                    {story.currentPrice !== null ? <p className="story-meta">Giá: {story.currentPrice}</p> : null}
                  </Link>
                ))}
              </div>
              <nav className="pagination" aria-label="Phân trang danh sách truyện">
                {stories.page > 1 ? (
                  <Button as={Link} href={buildPageHref(params, stories.page - 1)} color="primary" variant="flat">
                    Trước
                  </Button>
                ) : (
                  <Button isDisabled color="primary" variant="flat">
                    Trước
                  </Button>
                )}
                <span>
                  Trang {stories.page} / {totalPages}
                </span>
                {stories.page < totalPages ? (
                  <Button as={Link} href={buildPageHref(params, stories.page + 1)} color="primary" variant="flat">
                    Sau
                  </Button>
                ) : (
                  <Button isDisabled color="primary" variant="flat">
                    Sau
                  </Button>
                )}
              </nav>
            </>
          )}
        </section>
      </div>
    </PageShell>
  );
}
