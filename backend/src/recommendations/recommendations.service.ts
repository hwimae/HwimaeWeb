import { Prisma } from '@prisma/client';
import type { BackendDeps } from '../dependencies';
import { badRequest } from '../errors';
import type { AdvisorContext } from './ai-client';

export type RecommendationQuery = {
  limit: number;
};

export type AskRecommendationInput = {
  query: string;
  limit: number;
};

type StoryCandidate = Prisma.StoryGetPayload<{ include: { category: true } }>;

type StoryChunkSearchRow = {
  storyId: string;
  title: string;
  authors: string;
  category: string;
  averageRating: number;
  reviewCount: number;
  chunkContent: string;
  distance: number;
};

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

export type StoryAdvisorResponse = {
  answer: string;
  recommendations: RecommendationItem[];
};

export type RecommendationsService = {
  listPopularRecommendations(query: RecommendationQuery): Promise<RecommendationsResponse>;
  listRecommendationsForUser(userId: string, query: RecommendationQuery): Promise<RecommendationsResponse>;
  askStoryAdvisor(input: AskRecommendationInput): Promise<StoryAdvisorResponse>;
};

export function createRecommendationsService(deps: Pick<BackendDeps, 'prisma' | 'aiClient'>): RecommendationsService {
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

    async askStoryAdvisor(input) {
      const queryEmbedding = await deps.aiClient.embedText(`query: ${input.query}`);
      const rows = await searchStoryChunks(deps, queryEmbedding, input.limit * 4);
      const recommendations = toAdvisorRecommendations(rows, input.limit);

      if (recommendations.length === 0) {
        throw badRequest('Chưa có dữ liệu nội dung truyện để tư vấn. Hãy chạy script index story chunks trước.');
      }

      const contexts = recommendations.map((item): AdvisorContext => {
        const row = rows.find((candidate) => candidate.storyId === item.storyId);
        return {
          storyId: item.storyId,
          title: item.title,
          authors: item.authors,
          category: item.category,
          reason: item.reason,
          content: row?.chunkContent ?? '',
          score: item.score,
        };
      });

      try {
        const answer = await deps.aiClient.generateAdvisorAnswer({ query: input.query, contexts });
        return { answer, recommendations };
      } catch {
        return { answer: buildFallbackAnswer(recommendations.length), recommendations };
      }
    },
  };
}

async function searchStoryChunks(deps: Pick<BackendDeps, 'prisma'>, embedding: number[], limit: number): Promise<StoryChunkSearchRow[]> {
  const vector = toVectorLiteral(embedding);

  return deps.prisma.$queryRaw<StoryChunkSearchRow[]>`
    SELECT
      s.id AS "storyId",
      s.title AS "title",
      s.authors AS "authors",
      c.name AS "category",
      s."userAverageRating" AS "averageRating",
      s."userReviewCount" AS "reviewCount",
      sc.content AS "chunkContent",
      sc.embedding <=> ${vector}::vector AS "distance"
    FROM "story_chunks" sc
    INNER JOIN "stories" s ON s.id = sc."storyId"
    INNER JOIN "categories" c ON c.id = s."categoryId"
    ORDER BY sc.embedding <=> ${vector}::vector
    LIMIT ${limit}
  `;
}

function toAdvisorRecommendations(rows: StoryChunkSearchRow[], limit: number): RecommendationItem[] {
  const bestByStory = new Map<string, StoryChunkSearchRow>();

  for (const row of rows) {
    const current = bestByStory.get(row.storyId);
    if (!current || row.distance < current.distance) {
      bestByStory.set(row.storyId, row);
    }
  }

  return [...bestByStory.values()]
    .sort((a, b) => a.distance - b.distance || b.reviewCount - a.reviewCount || a.title.localeCompare(b.title, 'vi'))
    .slice(0, limit)
    .map((row) => ({
      storyId: row.storyId,
      title: row.title,
      authors: row.authors,
      category: row.category,
      averageRating: row.averageRating,
      reviewCount: row.reviewCount,
      score: Math.max(0, 1 - row.distance),
      reason: `Nội dung gần với yêu cầu của bạn qua đoạn: ${summarizeChunk(row.chunkContent)}`,
    }));
}

function summarizeChunk(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  return normalized.length <= 180 ? normalized : `${normalized.slice(0, 177)}…`;
}

function buildFallbackAnswer(count: number): string {
  return `Mình tìm được ${count} truyện có nội dung gần với yêu cầu của bạn. Bạn có thể mở từng truyện để đọc chi tiết hơn.`;
}

function toVectorLiteral(values: number[]): string {
  if (values.length !== 384) {
    throw new Error(`Expected embedding dimension 384, received ${values.length}`);
  }

  if (!values.every((value) => Number.isFinite(value))) {
    throw new Error('Embedding contains a non-finite value');
  }

  return `[${values.join(',')}]`;
}

async function listRecommendations(
  deps: Pick<BackendDeps, 'prisma'>,
  query: RecommendationQuery,
  excludedStoryIds: string[] = [],
): Promise<RecommendationsResponse> {
  const stories = await deps.prisma.story.findMany({
    where: {
      userAverageRating: { gt: 0 },
      userReviewCount: { gt: 0 },
      ...(excludedStoryIds.length > 0 ? { id: { notIn: excludedStoryIds } } : {}),
    },
    include: { category: true },
    orderBy: [{ userReviewCount: 'desc' }, { userAverageRating: 'desc' }, { title: 'asc' }],
    take: query.limit,
  });

  return {
    items: stories
      .filter((story) => story.userAverageRating > 0 && story.userReviewCount > 0 && !excludedStoryIds.includes(story.id))
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
    averageRating: story.userAverageRating,
    reviewCount: story.userReviewCount,
    score: story.userAverageRating * Math.log1p(story.userReviewCount),
    reason: `Truyện đạt ${story.userAverageRating.toFixed(1)}/5 từ ${story.userReviewCount.toLocaleString('vi-VN')} review từ người dùng app.`,
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
