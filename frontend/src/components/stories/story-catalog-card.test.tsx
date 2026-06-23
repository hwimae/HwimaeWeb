import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StoryCatalogCard } from "./story-catalog-card";

describe("StoryCatalogCard", () => {
  it("renders placeholder cover, metadata, and content chip", () => {
    const html = renderToStaticMarkup(
      <StoryCatalogCard
        story={{
          id: "story-1",
          productId: 1,
          title: "Mưa Xanh",
          authors: "An",
          originalPrice: null,
          currentPrice: null,
          quantity: null,
          averageRating: 4.2,
          reviewCount: 9,
          externalAverageRating: 4.1,
          externalReviewCount: 7,
          userAverageRating: 4.6,
          userReviewCount: 10,
          pages: null,
          manufacturer: null,
          coverUrl: null,
          discount: null,
          categoryId: "cat-1",
          category: "Tình cảm",
          createdAt: "2026-06-21T00:00:00.000Z",
          updatedAt: "2026-06-21T00:00:00.000Z",
          hasContent: true,
        }}
      />,
    );

    expect(html).toContain('href="/stories/story-1"');
    expect(html).toContain("story-catalog-cover");
    expect(html).toContain("Mưa Xanh");
    expect(html).toContain("Tác giả: An");
    expect(html).toContain("Có nội dung");
  });
});
