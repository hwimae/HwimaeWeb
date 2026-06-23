"use client";

import { Button, Textarea } from "@heroui/react";
import { Sparkles, Wand2 } from "lucide-react";
import React, { FormEvent, useMemo, useState } from "react";

import { AdvisorQuickPrompts } from "./stories/advisor-quick-prompts";
import { AdvisorSummaryCard } from "./stories/advisor-summary-card";
import { RecommendationStoryCard } from "./stories/recommendation-story-card";
import { StatusMessage } from "./ui/status-message";
import { apiPost } from "../lib/api";
import {
  parseStoryAdvisorResponse,
  type StoryAdvisorResponse,
} from "../types/recommendation";

const EXAMPLE_QUERY =
  "Tôi thích truyện tu tiên, nam chính từ yếu thành mạnh, ít ngôn tình";
const MAX_ADVISOR_QUERY_LENGTH = 500;

export const ADVISOR_QUICK_PROMPTS = [
  "Huyền huyễn",
  "Trọng sinh",
  "Nữ cường",
  "Điền văn",
] as const;

export function buildAdvisorPromptValue(prompt: string) {
  return `Mình muốn đọc truyện ${prompt}, nhân vật chính có chiều sâu, nhịp truyện cuốn hút và bối cảnh rõ nét.`;
}

export function StoryAdvisorForm() {
  const [query, setQuery] = useState(EXAMPLE_QUERY);
  const [result, setResult] = useState<StoryAdvisorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasRecommendations = useMemo(
    () => (result?.recommendations.length ?? 0) > 0,
    [result],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setError("Hãy nhập gu truyện ít nhất 2 ký tự.");
      setResult(null);
      return;
    }

    if (trimmedQuery.length > MAX_ADVISOR_QUERY_LENGTH) {
      setError(`Hãy giữ mô tả trong khoảng ${MAX_ADVISOR_QUERY_LENGTH} ký tự.`);
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
    } catch {
      setError("Không thể gọi AI tư vấn lúc này. Hãy thử lại sau ít phút.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="section-stack story-advisor-layout">
      <form
        onSubmit={handleSubmit}
        className="story-advisor-hero glass-card section-stack"
      >
        <div className="story-advisor-hero-header">
          <div className="story-advisor-hero-icon" aria-hidden="true">
            <Sparkles size={22} />
          </div>
          <div className="section-stack">
            <h2>Tìm truyện cùng AI</h2>
            <p className="result-summary">
              Hãy kể cho StoryRec nghe gu đọc của bạn để nhận danh sách truyện
              phù hợp nhất.
            </p>
          </div>
        </div>

        <div className="story-advisor-input-shell">
          <Textarea
            id="advisor-query"
            aria-label="Gu truyện của bạn"
            label="Gu truyện của bạn"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            minRows={5}
            maxLength={MAX_ADVISOR_QUERY_LENGTH}
            variant="bordered"
            color="primary"
            placeholder="Ví dụ: Mình thích thể loại tu tiên, main lạnh lùng sát phạt quyết đoán, bối cảnh hoành tráng, không hậu cung."
            classNames={{
              inputWrapper: "story-advisor-textarea-wrapper",
              input: "story-advisor-textarea-input",
            }}
          />

          <div className="story-advisor-action-row">
            <div className="story-advisor-action-hint">
              <Wand2 size={16} />
              <span>
                Mô tả thể loại, nhân vật, bối cảnh hoặc nhịp truyện bạn muốn
                đọc.
              </span>
            </div>
            <Button
              color="primary"
              type="submit"
              isLoading={isLoading}
              className="story-advisor-submit-button"
            >
              {isLoading ? "Đang hỏi AI…" : "Hỏi AI tư vấn"}
            </Button>
          </div>
        </div>
      </form>

      <AdvisorQuickPrompts
        prompts={ADVISOR_QUICK_PROMPTS}
        disabled={isLoading}
        onSelectPrompt={(prompt) => setQuery(buildAdvisorPromptValue(prompt))}
      />

      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

      {result ? <AdvisorSummaryCard answer={result.answer} /> : null}

      {result && hasRecommendations ? (
        <div className="story-grid story-advisor-results-grid">
          {result.recommendations.map((item) => (
            <RecommendationStoryCard key={item.storyId} item={item} />
          ))}
        </div>
      ) : null}

      {result && !hasRecommendations ? (
        <section className="empty-state-card story-advisor-empty-state">
          <h3>Chưa tìm thấy truyện phù hợp</h3>
          <p>
            Hãy thử mô tả kỹ hơn về thể loại, nhân vật chính, bối cảnh hoặc nhịp
            truyện bạn muốn đọc.
          </p>
        </section>
      ) : null}
    </section>
  );
}
