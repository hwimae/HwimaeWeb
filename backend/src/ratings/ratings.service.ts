import { Prisma, Rating } from '@prisma/client';
import type { BackendDeps } from '../dependencies';
import { notFound } from '../errors';
import type { RateMovieInput } from './ratings.schema';

export type MyRating = Prisma.RatingGetPayload<{
  include: {
    movie: {
      select: {
        id: true;
        title: true;
        averageRating: true;
        ratingCount: true;
      };
    };
  };
}>;

export type RatingsService = {
  rateMovie(userId: string, input: RateMovieInput): Promise<Rating>;
  listMyRatings(userId: string): Promise<MyRating[]>;
};

export function createRatingsService(deps: Pick<BackendDeps, 'prisma'>): RatingsService {
  return {
    async rateMovie(userId, input) {
      const maxAttempts = 3;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          return await deps.prisma.$transaction(
            async (tx): Promise<Rating> => {
              const movie = await tx.movie.findUnique({ where: { id: input.movieId }, select: { id: true } });

              if (!movie) {
                throw notFound('Movie not found');
              }

              const rating = await tx.rating.upsert({
                where: { userId_movieId: { userId, movieId: input.movieId } },
                update: { rating: input.rating, ratedAt: new Date() },
                create: { userId, movieId: input.movieId, rating: input.rating },
              });

              const aggregate = await tx.rating.aggregate({
                where: { movieId: input.movieId },
                _avg: { rating: true },
                _count: { _all: true },
              });

              await tx.movie.update({
                where: { id: input.movieId },
                data: { averageRating: aggregate._avg.rating ?? 0, ratingCount: aggregate._count._all },
              });

              return rating;
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
          );
        } catch (error) {
          const isRetryableConflict =
            error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';

          if (!isRetryableConflict || attempt === maxAttempts) {
            throw error;
          }
        }
      }

      throw new Error('Unreachable retry state in rateMovie');
    },

    listMyRatings(userId) {
      return deps.prisma.rating.findMany({
        where: { userId },
        include: {
          movie: { select: { id: true, title: true, averageRating: true, ratingCount: true } },
        },
        orderBy: { ratedAt: 'desc' },
      });
    },
  };
}
