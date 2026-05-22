"use client";

import { useId, useRef, useState } from "react";

import { getAccessToken } from "@/lib/auth";
import { apiPost } from "@/lib/api";

type RatingStarsProps = {
  movieId: string;
};

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

export function RatingStars({ movieId }: RatingStarsProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const statusId = useId();

  async function handleRate(rating: number) {
    setError(null);
    setMessage(null);

    const token = getAccessToken();
    if (!token) {
      setError("Bạn cần đăng nhập để đánh giá phim.");
      requestAnimationFrame(() => {
        statusRef.current?.focus();
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiPost("/ratings", { movieId, rating }, token);
      setSelectedRating(rating);
      setMessage(`Đã lưu đánh giá ${rating}/5 sao của bạn.`);
      requestAnimationFrame(() => {
        statusRef.current?.focus();
      });
    } catch {
      setError("Không thể gửi đánh giá lúc này. Vui lòng thử lại sau.");
      requestAnimationFrame(() => {
        statusRef.current?.focus();
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="rating-title">
      <h2 id="rating-title">Đánh giá phim</h2>
      <div role="group" aria-label="Chọn số sao từ 1 đến 5">
        {STAR_VALUES.map((star) => {
          const isSelected = selectedRating === star;
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleRate(star)}
              disabled={isSubmitting}
              aria-pressed={isSelected}
              aria-describedby={error || message ? statusId : undefined}
              style={{ marginRight: "0.5rem" }}
            >
              {isSelected ? `★ ${star}` : `☆ ${star}`}
            </button>
          );
        })}
      </div>

      <p
        id={statusId}
        ref={statusRef}
        role={error ? "alert" : "status"}
        aria-live="assertive"
        aria-atomic="true"
        tabIndex={-1}
      >
        {error ?? message ?? ""}
      </p>
    </section>
  );
}
