"use client";

import { FormEvent, useId, useRef, useState } from "react";

import { FormField } from "@/components/ui/form-field";
import { StatusMessage } from "@/components/ui/status-message";
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
  const statusRef = useRef<HTMLDivElement>(null);
  const statusId = useId();
  const titleId = useId();
  const contentId = useId();

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
    <section aria-labelledby="review-title" className="section-stack">
      <h2 id="review-title">Viết review truyện</h2>
      <form onSubmit={handleSubmit} className="card">
        <div className="section-stack">
          <fieldset disabled={isSubmitting} className="section-stack">
            <legend>Điểm đánh giá</legend>
            <div role="radiogroup" aria-label="Chọn số sao từ 1 đến 5" className="section-stack">
              {STAR_VALUES.map((star) => (
                <label key={star}>
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

          <FormField
            id={titleId}
            label="Tiêu đề review"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={200}
            aria-describedby={(error ?? message) ? statusId : undefined}
          />

          <FormField
            id={contentId}
            kind="textarea"
            label="Nội dung review"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
            maxLength={5000}
            rows={5}
            aria-describedby={(error ?? message) ? statusId : undefined}
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang gửi..." : "Gửi review"}
          </button>

          <div
            id={statusId}
            ref={statusRef}
            aria-live="assertive"
            aria-atomic="true"
            tabIndex={-1}
          >
            {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
            {!error && message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
          </div>
        </div>
      </form>
    </section>
  );
}
