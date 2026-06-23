import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  buildRecommendationStoryHref,
  RecommendationStoryCard,
  formatRecommendationMatch,
} from "./recommendation-story-card";

describe("formatRecommendationMatch", () => {
  it("formats score as a rounded percentage label", () => {
    expect(formatRecommendationMatch(0.923)).toBe("Phù hợp 92%");
  });
});

describe("buildRecommendationStoryHref", () => {
  it("encodes the story id before building the story URL", () => {
    expect(buildRecommendationStoryHref("story/2?draft=yes")).toBe(
      "/stories/story%2F2%3Fdraft%3Dyes",
    );
  });
});

describe("RecommendationStoryCard", () => {
  it("renders score, author, category, reason and story link", () => {
    const html = renderToStaticMarkup(
      <RecommendationStoryCard
        item={{
          storyId: "story-2",
          title: "Khấu Vấn Tiên Đạo",
          authors: "Vũ Đả Thanh Thạch",
          category: "Tiên hiệp",
          averageRating: 4.7,
          reviewCount: 12,
          score: 0.923,
          reason:
            "Nhân vật chính kiên định và truyện có nhịp tu luyện rõ ràng.",
        }}
      />,
    );

    expect(html).toContain("Phù hợp 92%");
    expect(html).toContain("Khấu Vấn Tiên Đạo");
    expect(html).toContain("Tác giả: Vũ Đả Thanh Thạch");
    expect(html).toContain("Lý do đề xuất");
    expect(html).toContain('href="/stories/story-2"');
  });
});
