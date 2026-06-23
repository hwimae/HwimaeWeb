import React from "react";
import { Button } from "@heroui/react";
import Link from "next/link";

import { StoryListControls } from "../../components/story-list-controls";
import { StoryCatalogCard } from "../../components/stories/story-catalog-card";
import { StoryPagination } from "../../components/stories/story-pagination";
import { StoryRecommendationShowcase } from "../../components/stories/story-recommendation-showcase";
import { StoryWorkspaceNav } from "../../components/stories/story-workspace-nav";
import { PageShell } from "../../components/ui/page-shell";
import { PageState } from "../../components/ui/page-state";
import { StatusMessage } from "../../components/ui/status-message";
import { apiGet } from "../../lib/api";
import {
  parseRecommendationsResponse,
  type RecommendationsResponse,
} from "../../types/recommendation";
import { parsePaginatedStories, type PaginatedStories } from "../../types/story";

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
      description="Khám phá, đọc và lưu trữ những câu chuyện tuyệt vời với không gian truyện mới."
      eyebrow="Story workspace"
      variant="workspace"
    >
      <div className="story-workspace-layout">
        <StoryWorkspaceNav />

        <div className="story-workspace-main section-stack">
          <section className="story-feature-hero workspace-card" aria-label="Khám phá truyện">
            <div className="story-feature-copy section-stack">
              <p className="eyebrow">Truyện · Sáng tác &amp; khám phá</p>
              <h2>Khám phá thế giới truyện</h2>
              <p className="result-summary">
                Tìm kiếm, đọc và lưu trữ những câu chuyện tuyệt vời nhất. Trải nghiệm không gian kể chuyện thư giãn với sự hỗ trợ của AI.
              </p>
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
            <div className="story-feature-visual" aria-hidden="true" />
          </section>

          <section className="section-stack" aria-labelledby="story-popular-heading">
            <div className="section-heading-row">
              <div className="section-stack">
                <p className="eyebrow">Nổi bật</p>
                <h2 id="story-popular-heading">Gợi ý truyện phổ biến</h2>
              </div>
            </div>
            {recommendationsHasError ? <StatusMessage tone="error">Không thể tải gợi ý truyện lúc này.</StatusMessage> : null}
            {recommendations.items.length === 0 ? (
              <PageState
                tone="empty"
                title="Chưa có đủ gợi ý từ cộng đồng"
                description="Hãy thêm review hoặc quay lại sau khi có thêm dữ liệu từ người dùng app."
                cta={<Link href="/recommendations">Mở AI tư vấn</Link>}
              />
            ) : (
              <StoryRecommendationShowcase items={recommendations.items} />
            )}
          </section>

          <section className="section-stack" aria-labelledby="story-catalog-heading">
            <div className="story-catalog-header">
              <div className="section-stack">
                <p className="eyebrow">Thư viện truyện</p>
                <h2 id="story-catalog-heading">Truyện mới cập nhật</h2>
                <p className="result-summary">
                  Tìm thấy {stories.total} truyện{params.hasContent ? " có nội dung đọc" : ""}.
                </p>
              </div>
              <StoryListControls query={params.query} hasContent={params.hasContent} />
            </div>

            {hasError ? (
              <StatusMessage tone="error">Không thể tải danh sách truyện lúc này. Đang hiển thị danh sách rỗng tạm thời.</StatusMessage>
            ) : null}
            {stories.items.length === 0 ? (
              <PageState
                tone="empty"
                title="Chưa có truyện phù hợp"
                description="Hãy đổi từ khóa tìm kiếm hoặc bỏ bộ lọc nội dung đọc để xem thêm kết quả."
              />
            ) : (
              <>
                <div className="story-catalog-grid">
                  {stories.items.map((story) => (
                    <StoryCatalogCard key={story.id} story={story} />
                  ))}
                </div>
                <StoryPagination
                  currentPage={stories.page}
                  totalPages={totalPages}
                  buildHref={(page) => buildPageHref(params, page)}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
