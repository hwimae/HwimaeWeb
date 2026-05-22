import { Prisma } from '@prisma/client';
import { notFound } from '../errors';
import { prisma } from '../prisma';
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

export async function listMovies(query: ListMoviesQuery): Promise<ListMoviesResponse> {
  const where: Prisma.MovieWhereInput = query.q
    ? {
        title: {
          contains: query.q,
          mode: 'insensitive',
        },
      }
    : {};

  const [items, total] = await prisma.$transaction([
    prisma.movie.findMany({
      where,
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
      },
      orderBy: [{ ratingCount: 'desc' }, { averageRating: 'desc' }, { title: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.movie.count({ where }),
  ]);

  return {
    items: items.map(toMovieResponse),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function getMovieById(id: string): Promise<MovieResponse> {
  const movie = await prisma.movie.findUnique({
    where: { id },
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
    },
  });

  if (!movie) {
    throw notFound('Movie not found');
  }

  return toMovieResponse(movie);
}

function toMovieResponse(movie: MovieWithGenres): MovieResponse {
  return {
    ...movie,
    genres: movie.genres.map((row) => row.genre.name),
  };
}
