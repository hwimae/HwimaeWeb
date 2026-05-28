"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiPost } from "@/lib/api";
import {
  parseStoryAdvisorResponse,
  type StoryAdvisorResponse,
} from "@/types/recommendation";

const EXAMPLE_QUERY = "Tôi thích truyện tu tiên, nam chính từ yếu thành mạnh, ít ngôn tình";

export function StoryAdvisorForm() {
  const [query, setQuery] = useState(EXAMPLE_QUERY);
  const [result, setResult] = useState<StoryAdvisorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setError("Hãy nhập gu truyện ít nhất 2 ký tự.");
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiPost<StoryAdvisorResponse>(
        "/recommendations/ask",
        { query: trimmedQuery, limit: 5 },
        undefined,
        parseStoryAdvisorResponse,
      );
      setResult(response);
    } catch (submitError) {
      console.error("[StoryAdvisorForm] Failed to ask story advisor", submitError);
      setError("Không thể gọi AI tư vấn lúc này. Hãy kiểm tra backend, AI service, Ollama và dữ liệu StoryChunk.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="advisor-panel">
      <form onSubmit={handleSubmit} className="advisor-form">
        <label className="search-label" htmlFor="advisor-query">
          Gu truyện của bạn
          <textarea
            id="advisor-query"
            className="advisor-textarea"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            rows={4}
          />
        </label>
        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? "Đang hỏi AI…" : "Hỏi AI tư vấn"}
        </button>
      </form>

      {error ? <p className="warning-text">{error}</p> : null}

      {result ? (
        <div className="advisor-result">
          <h2>Kết quả tư vấn</h2>
          <p className="advisor-answer">{result.answer}</p>
          {result.recommendations.length === 0 ? (
            <p>Chưa tìm thấy truyện phù hợp.</p>
          ) : (
            <div className="story-grid">
              {result.recommendations.map((item) => (
                <Link key={item.storyId} href={`/stories/${item.storyId}`} className="story-card recommendation-card">
                  <h3 className="story-title">{item.title}</h3>
                  <p className="story-meta">Tác giả: {item.authors}</p>
                  <p className="story-meta">Thể loại: {item.category}</p>
                  <p className="recommendation-score">Độ phù hợp: {(item.score * 100).toFixed(0)}%</p>
                  <p className="recommendation-reason">{item.reason}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
