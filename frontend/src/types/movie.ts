export type Movie = {
  id: string;
  movielensId: number;
  title: string;
  releaseYear: number | null;
  overview: string | null;
  posterUrl: string | null;
  averageRating: number;
  ratingCount: number;
  genres: string[];
};

export type PaginatedMovies = {
  items: Movie[];
  total: number;
  page: number;
  limit: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseNullableString(value: unknown, fieldName: string): string | null {
  if (value === null || typeof value === "string") {
    return value;
  }

  throw new Error(`Invalid movie.${fieldName}: expected string | null`);
}

function parseNullableNumber(value: unknown, fieldName: string): number | null {
  if (value === null || typeof value === "number") {
    return value;
  }

  throw new Error(`Invalid movie.${fieldName}: expected number | null`);
}

export function parseMovie(input: unknown): Movie {
  if (!isRecord(input)) {
    throw new Error("Invalid movie: expected object");
  }

  const {
    id,
    movielensId,
    title,
    releaseYear,
    overview,
    posterUrl,
    averageRating,
    ratingCount,
    genres,
  } = input;

  if (typeof id !== "string")
    throw new Error("Invalid movie.id: expected string");
  if (typeof movielensId !== "number")
    throw new Error("Invalid movie.movielensId: expected number");
  if (typeof title !== "string")
    throw new Error("Invalid movie.title: expected string");
  if (typeof averageRating !== "number")
    throw new Error("Invalid movie.averageRating: expected number");
  if (typeof ratingCount !== "number")
    throw new Error("Invalid movie.ratingCount: expected number");
  if (
    !Array.isArray(genres) ||
    !genres.every((genre) => typeof genre === "string")
  ) {
    throw new Error("Invalid movie.genres: expected string[]");
  }

  return {
    id,
    movielensId,
    title,
    releaseYear: parseNullableNumber(releaseYear, "releaseYear"),
    overview: parseNullableString(overview, "overview"),
    posterUrl: parseNullableString(posterUrl, "posterUrl"),
    averageRating,
    ratingCount,
    genres,
  };
}

export function parsePaginatedMovies(input: unknown): PaginatedMovies {
  if (!isRecord(input)) {
    throw new Error("Invalid paginated movies response: expected object");
  }

  const { items, total, page, limit } = input;

  if (!Array.isArray(items)) {
    throw new Error("Invalid paginated movies response.items: expected array");
  }
  if (typeof total !== "number") {
    throw new Error("Invalid paginated movies response.total: expected number");
  }
  if (typeof page !== "number") {
    throw new Error("Invalid paginated movies response.page: expected number");
  }
  if (typeof limit !== "number") {
    throw new Error("Invalid paginated movies response.limit: expected number");
  }

  return {
    items: items.map(parseMovie),
    total,
    page,
    limit,
  };
}
