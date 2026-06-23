import React from "react";
import Link from "next/link";
import { BookOpenText, CheckCircle2, Info } from "lucide-react";

import type { StoryAdvisorRecommendation } from "@/types/recommendation";

export function formatRecommendationMatch(score: number) {
  return `Phù hợp ${Math.round(score * 100)}%`;
}

export function buildRecommendationStoryHref(storyId: string) {
  return `/stories/${encodeURIComponent(storyId)}`;
}

export function RecommendationStoryCard({
  item,
}: {
  item: StoryAdvisorRecommendation;
}) {
  return (
    <Link
      href={buildRecommendationStoryHref(item.storyId)}
      className="story-card recommendation-story-card"
    >
      <div className="recommendation-story-card-visual" aria-hidden="true">
        <span className="recommendation-story-card-match">
          <CheckCircle2 size={16} />
          {formatRecommendationMatch(item.score)}
        </span>
      </div>

      <div className="recommendation-story-card-body section-stack">
        <div className="section-stack">
          <h3 className="story-title">{item.title}</h3>
          <p className="story-meta">Tác giả: {item.authors}</p>
        </div>

        <div className="form-actions">
          <span className="recommendation-story-card-category">
            {item.category}
          </span>
        </div>

        <div className="recommendation-story-card-reason-box">
          <p className="recommendation-story-card-reason-label">
            <Info size={16} />
            Lý do đề xuất
          </p>
          <p className="recommendation-story-card-reason">{item.reason}</p>
        </div>

        <span className="recommendation-story-card-cta">
          <BookOpenText size={16} />
          Đọc ngay
        </span>
      </div>
    </Link>
  );
}
