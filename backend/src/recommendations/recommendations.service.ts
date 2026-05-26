import { Prisma } from '@prisma/client';
import type { BackendDeps } from '../dependencies';

export type RecommendationQuery = {
  limit: number;
};

type StoryCandidate = Prisma.StoryGetPayload<{ include: { category: true } }>;

export type RecommendationItem = {
  storyId: string;
  title: string;
  authors: string;
  category: string;
  averageRating: number;
  reviewCount: number;
  score: number;
  reason: string;
};

export type RecommendationsResponse = {
  items: RecommendationItem[];
};

export type RecommendationsService = {
  listPopularRecommendations(query: RecommendationQuery): Promise<RecommendationsResponse>;
  listRecommendationsForUser(userId: string, query: RecommendationQuery): Promise<RecommendationsResponse>;
};

export function createRecommendationsService(deps: Pick<BackendDeps, 'prisma'>): RecommendationsService {
  return {
    async listPopularRecommendations(query) {
      return listRecommendations(deps, query);
    },

    async listRecommendationsForUser(userId, query) {
      const reviewedStories = await deps.prisma.userReview.findMany({
        where: { userId },
        select: { storyId: true },
      });

      return listRecommendations(
        deps,
        query,
        reviewedStories.map((review) => review.storyId),
      );
    },
  };
}

async function listRecommendations(
  deps: Pick<BackendDeps, 'prisma'>,
  query: RecommendationQuery,
  excludedStoryIds: string[] = [],
): Promise<RecommendationsResponse> {
  const stories = await deps.prisma.story.findMany({
    where: {
      externalAverageRating: { gt: 0 },
      externalReviewCount: { gt: 0 },
      ...(excludedStoryIds.length > 0 ? { id: { notIn: excludedStoryIds } } : {}),
    },
    include: { category: true },
    orderBy: [{ externalReviewCount: 'desc' }, { externalAverageRating: 'desc' }, { title: 'asc' }],
  });

  return {
    items: stories
      .filter((story) => story.externalAverageRating > 0 && story.externalReviewCount > 0 && !excludedStoryIds.includes(story.id))
      .map(toRecommendationItem)
      .sort(compareRecommendationItems)
      .slice(0, query.limit),
  };
}

function toRecommendationItem(story: StoryCandidate): RecommendationItem {
  return {
    storyId: story.id,
    title: story.title,
    authors: story.authors,
    category: story.category.name,
    averageRating: story.externalAverageRating,
    reviewCount: story.externalReviewCount,
    score: story.externalAverageRating * Math.log1p(story.externalReviewCount),
    reason: `Truyện đạt ${story.externalAverageRating.toFixed(1)}/5 từ ${story.externalReviewCount.toLocaleString('vi-VN')} review dữ liệu gốc, nên được ưu tiên trong nhóm truyện phổ biến.`,
  };
}

function compareRecommendationItems(a: RecommendationItem, b: RecommendationItem): number {
  return (
    b.score - a.score ||
    b.reviewCount - a.reviewCount ||
    b.averageRating - a.averageRating ||
    a.title.localeCompare(b.title, 'vi')
  );
}
