import Link from "next/link";

import { apiGet } from "@/lib/api";
import { RatingStars } from "@/components/rating-stars";
import { parseMovie, type Movie } from "@/types/movie";

type MoviePageParams = {
  id: string;
};

type MoviePageProps = {
  params: Promise<MoviePageParams>;
};

async function getMovie(id: string): Promise<Movie | null> {
  try {
    return await apiGet<Movie>(`/movies/${encodeURIComponent(id)}`, undefined, parseMovie);
  } catch (error) {
    console.error("[MovieDetailPage] Failed to fetch movie", error);
    return null;
  }
}

export default async function MovieDetailPage({ params }: MoviePageProps) {
  const { id } = await params;
  const movie = await getMovie(id);

  if (!movie) {
    return (
      <main>
        <Link href="/">← Quay lại danh sách phim</Link>
        <h1>Không tìm thấy phim</h1>
        <p>Không thể tải chi tiết phim hoặc phim không tồn tại.</p>
      </main>
    );
  }

  return (
    <main>
      <Link href="/">← Quay lại danh sách phim</Link>

      <h1>
        {movie.title}
        {movie.releaseYear ? ` (${movie.releaseYear})` : ""}
      </h1>

      <p>
        <strong>Thể loại:</strong>{" "}
        {movie.genres.length > 0 ? movie.genres.join(", ") : "Chưa có thể loại"}
      </p>
      <p>
        <strong>Điểm trung bình:</strong> {movie.averageRating.toFixed(1)} / 5 ({movie.ratingCount} lượt đánh giá)
      </p>
      <p>
        <strong>Giới thiệu:</strong> {movie.overview ?? "Hiện chưa có mô tả cho phim này."}
      </p>

      <RatingStars movieId={movie.id} />
    </main>
  );
}
