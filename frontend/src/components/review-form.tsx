"use client";

import { FormEvent, useId, useRef, useState } from "react";

import { apiPost } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type ReviewFormProps = {
  storyId: string;
};

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

export function ReviewForm({ storyId }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const statusId = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const token = getAccessToken();
    if (!token) {
      setError("Bạn cần đăng nhập để viết review truyện.");
      requestAnimationFrame(() => statusRef.current?.focus());
      return;
    }

    setIsSubmitting(true);

    try {
      await apiPost("/reviews", { storyId, rating, title, content }, token);
      setMessage("Đã lưu review của bạn.");
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch {
      setError("Không thể gửi review lúc này. Vui lòng thử lại sau.");
      requestAnimationFrame(() => statusRef.current?.focus());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="review-title">
      <h2 id="review-title">Viết review truyện</h2>
      <form onSubmit={handleSubmit}>
        <fieldset disabled={isSubmitting}>
          <legend>Điểm đánh giá</legend>
          <div role="radiogroup" aria-label="Chọn số sao từ 1 đến 5">
            {STAR_VALUES.map((star) => (
              <label key={star} style={{ marginRight: "0.75rem" }}>
                <input
                  type="radio"
                  name="rating"
                  value={star}
                  checked={rating === star}
                  onChange={() => setRating(star)}
                />{" "}
                {star} sao
              </label>
            ))}
          </div>
        </fieldset>

        <label style={{ display: "block", marginTop: "0.75rem" }}>
          Tiêu đề review
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={200}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label style={{ display: "block", marginTop: "0.75rem" }}>
          Nội dung review
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
            maxLength={5000}
            rows={5}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <button type="submit" disabled={isSubmitting} style={{ marginTop: "0.75rem" }}>
          {isSubmitting ? "Đang gửi..." : "Gửi review"}
        </button>
      </form>

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
