import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StoryRecommendationShowcase } from "./story-recommendation-showcase";

describe("StoryRecommendationShowcase", () => {
  it("renders the first recommendation as featured and the rest as compact cards", () => {
    const html = renderToStaticMarkup(
      <StoryRecommendationShowcase
        items={[
          {
            storyId: "story-1",
            title: "Biển Mơ",
            authors: "Lan",
            category: "Phiêu lưu",
            averageRating: 4.9,
            reviewCount: 12,
            score: 0.94,
            reason: "Phù hợp với gu đọc thư giãn.",
          },
          {
            storyId: "story-2",
            title: "Trăng Xa",
            authors: "Minh",
            category: "Viễn tưởng",
            averageRating: 4.7,
            reviewCount: 8,
            score: 0.83,
            reason: "Đang được đọc nhiều.",
          },
        ]}
      />,
    );

    expect(html).toContain("story-recommendation-featured");
    expect(html).toContain("story-recommendation-compact-list");
    expect(html).toContain('href="/stories/story-1"');
    expect(html).toContain('href="/stories/story-2"');
    expect(html).toContain("Phù hợp với gu đọc thư giãn.");
  });
});
