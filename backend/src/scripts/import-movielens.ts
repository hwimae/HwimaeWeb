import type { PrismaClient } from '@prisma/client';
import { PrismaClient as DefaultPrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type MovieLensRow = {
  movieId: string;
  title: string;
  genres: string;
};

type ParsedMovie = {
  movielensId: number;
  title: string;
  releaseYear?: number;
  genres: string[];
};

const DEFAULT_MOVIES_CSV = resolve(process.cwd(), '../data/raw/ml-25m/movies.csv');
const MOVIE_YEAR_PATTERN = /\s*\((\d{4})\)$/;

export function parseMovieRows(csv: string): ParsedMovie[] {
  const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as MovieLensRow[];

  return rows.map((row) => {
    const yearMatch = row.title.match(MOVIE_YEAR_PATTERN);
    const title = yearMatch ? row.title.replace(MOVIE_YEAR_PATTERN, '') : row.title;
    const genres = row.genres === '(no genres listed)' ? [] : row.genres.split('|');

    return {
      movielensId: Number(row.movieId),
      title,
      releaseYear: yearMatch ? Number(yearMatch[1]) : undefined,
      genres,
    };
  });
}

export async function importMoviesFromCsv(prisma: Pick<PrismaClient, 'movie'>, csv: string) {
  const movies = parseMovieRows(csv);

  for (const movie of movies) {
    await prisma.movie.upsert({
      where: { movielensId: movie.movielensId },
      create: {
        movielensId: movie.movielensId,
        title: movie.title,
        releaseYear: movie.releaseYear,
        genres: {
          create: movie.genres.map((name) => ({
            genre: {
              connectOrCreate: {
                where: { name },
                create: { name },
              },
            },
          })),
        },
      },
      update: {
        title: movie.title,
        releaseYear: movie.releaseYear,
      },
    });
  }

  return movies.length;
}

async function importMovies(csvPath: string) {
  const prisma = new DefaultPrismaClient();

  try {
    const csv = await readFile(csvPath, 'utf8');
    const count = await importMoviesFromCsv(prisma, csv);

    console.log(`Imported ${count} movies from ${csvPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const csvPath = resolve(process.argv[2] ?? DEFAULT_MOVIES_CSV);
  await importMovies(csvPath);
}

if (require.main === module) {
  void main();
}
