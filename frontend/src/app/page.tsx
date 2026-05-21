import Link from "next/link";
import { apiGet } from "@/lib/api";
import { parsePaginatedMovies, type PaginatedMovies } from "@/types/movie";

type MoviesState = {
  movies: PaginatedMovies;
  hasError: boolean;
};

export const dynamic = "force-dynamic";

const EMPTY_MOVIES: PaginatedMovies = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
};

async function getMovies(): Promise<MoviesState> {
  try {
    const movies = await apiGet<PaginatedMovies>(
      "/movies?limit=20",
      undefined,
      parsePaginatedMovies,
    );
    return { movies, hasError: false };
  } catch (error) {
    console.error("[HomePage] Failed to fetch movies list", error);
    return {
      movies: EMPTY_MOVIES,
      hasError: true,
    };
  }
}

export default async function HomePage() {
  const { movies, hasError } = await getMovies();

  return (
    <main>
      <header className="header">
        <div>
          <h1>Movie Recommendation Platform</h1>
          <p>Khám phá phim và đánh giá để nhận gợi ý phù hợp.</p>
        </div>
        <nav className="auth-links">
          <Link href="/login">Đăng nhập</Link>
          <Link href="/register">Đăng ký</Link>
        </nav>
      </header>

      <section>
        <h2>Phim mới nhập</h2>
        {hasError ? (
          <p
            style={{
              fontSize: "0.875rem",
              color: "#b45309",
              margin: "0.25rem 0 0.75rem",
            }}
          >
            Không thể tải danh sách phim lúc này. Đang hiển thị danh sách rỗng
            tạm thời.
          </p>
        ) : null}
        {movies.items.length === 0 ? (
          <p>Chưa có dữ liệu phim hoặc backend chưa sẵn sàng.</p>
        ) : (
          <div className="movie-grid">
            {movies.items.map((movie) => (
              <Link
                key={movie.id}
                href={`/movies/${movie.id}`}
                className="movie-card"
              >
                <h3 className="movie-title">
                  {movie.title}
                  {movie.releaseYear ? ` (${movie.releaseYear})` : ""}
                </h3>
                <p className="movie-meta">
                  Rating: {movie.averageRating.toFixed(1)} ({movie.ratingCount})
                </p>
                <p className="movie-meta">
                  {movie.genres.length > 0
                    ? movie.genres.join(", ")
                    : "Chưa có thể loại"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
