import { Prisma, Review } from '@prisma/client';
import type { BackendDeps } from '../dependencies';
import { notFound } from '../errors';
import type { ReviewStoryInput } from './reviews.schema';

export type MyReview = Prisma.ReviewGetPayload<{
  include: {
    story: {
      select: { id: true; title: true; authors: true; averageRating: true; reviewCount: true };
    };
  };
}>;

export type ReviewsService = {
  reviewStory(userId: string, input: ReviewStoryInput): Promise<Review>;
  listMyReviews(userId: string): Promise<MyReview[]>;
};

export function createReviewsService(deps: Pick<BackendDeps, 'prisma'>): ReviewsService {
  return {
    async reviewStory(userId, input) {
      const maxAttempts = 3;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          return await deps.prisma.$transaction(
            async (tx): Promise<Review> => {
              const story = await tx.story.findUnique({ where: { id: input.storyId }, select: { id: true } });

              if (!story) {
                throw notFound('Story not found');
              }

              const review = await tx.review.upsert({
                where: { userId_storyId: { userId, storyId: input.storyId } },
                update: {
                  rating: input.rating,
                  title: input.title,
                  content: input.content,
                  source: 'user',
                  reviewedAt: new Date(),
                },
                create: {
                  userId,
                  storyId: input.storyId,
                  rating: input.rating,
                  title: input.title,
                  content: input.content,
                  source: 'user',
                },
              });

              const aggregate = await tx.review.aggregate({
                where: { storyId: input.storyId },
                _avg: { rating: true },
                _count: { _all: true },
              });

              await tx.story.update({
                where: { id: input.storyId },
                data: { averageRating: aggregate._avg.rating ?? 0, reviewCount: aggregate._count._all },
              });

              return review;
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
          );
        } catch (error) {
          const isRetryableConflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';

          if (!isRetryableConflict || attempt === maxAttempts) {
            throw error;
          }
        }
      }

      throw new Error('Unreachable retry state in reviewStory');
    },

    listMyReviews(userId) {
      return deps.prisma.review.findMany({
        where: { userId },
        include: {
          story: { select: { id: true, title: true, authors: true, averageRating: true, reviewCount: true } },
        },
        orderBy: { reviewedAt: 'desc' },
      });
    },
  };
}
