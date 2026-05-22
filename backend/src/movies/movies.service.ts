import { Prisma } from '@prisma/client';
import type { BackendDeps } from '../dependencies';
import { notFound } from '../errors';
import type { ListMoviesQuery } from './movies.schema';

type MovieWithGenres = Prisma.MovieGetPayload<{
  include: {
    genres: {
      include: {
        genre: true;
      };
    };
  };
}>;

export type MovieResponse = Omit<MovieWithGenres, 'genres'> & {
  genres: string[];
};

export type ListMoviesResponse = {
  items: MovieResponse[];
  total: number;
  page: number;
  limit: number;
};

export type MoviesService = {
  listMovies(query: ListMoviesQuery): Promise<ListMoviesResponse>;
  getMovieById(id: string): Promise<MovieResponse>;
};

export function createMoviesService(deps: Pick<BackendDeps, 'prisma'>): MoviesService {
  return {
    async listMovies(query) {
      const where: Prisma.MovieWhereInput = query.q
        ? { title: { contains: query.q, mode: 'insensitive' } }
        : {};

      const [items, total] = await deps.prisma.$transaction([
        deps.prisma.movie.findMany({
          where,
          include: { genres: { include: { genre: true } } },
          orderBy: [{ ratingCount: 'desc' }, { averageRating: 'desc' }, { title: 'asc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        deps.prisma.movie.count({ where }),
      ]);

      return { items: items.map(toMovieResponse), total, page: query.page, limit: query.limit };
    },

    async getMovieById(id) {
      const movie = await deps.prisma.movie.findUnique({
        where: { id },
        include: { genres: { include: { genre: true } } },
      });

      if (!movie) {
        throw notFound('Movie not found');
      }

      return toMovieResponse(movie);
    },
  };
}

function toMovieResponse(movie: MovieWithGenres): MovieResponse {
  return {
    ...movie,
    genres: movie.genres.map((row) => row.genre.name),
  };
}
