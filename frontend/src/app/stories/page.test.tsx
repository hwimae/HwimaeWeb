import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../lib/api", () => ({
  apiGet: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/stories",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("page=2"),
}));

import StoriesPage from "./page";
import { apiGet } from "../../lib/api";

describe("StoriesPage", () => {
  it("renders the story workspace content without the decorative feature hero", async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({
        items: [
          {
            id: "story-1",
            productId: 1,
            title: "Sương Đêm",
            authors: "Vy",
            originalPrice: null,
            currentPrice: null,
            quantity: null,
            averageRating: 4.1,
            reviewCount: 3,
            externalAverageRating: 4.2,
            externalReviewCount: 4,
            userAverageRating: 4.5,
            userReviewCount: 5,
            pages: null,
            manufacturer: null,
            coverUrl: null,
            discount: null,
            categoryId: "cat-1",
            category: "Phiêu lưu",
            createdAt: "2026-06-21T00:00:00.000Z",
            updatedAt: "2026-06-21T00:00:00.000Z",
            hasContent: true,
          },
        ],
        total: 40,
        page: 2,
        limit: 20,
      })
      .mockResolvedValueOnce({
        items: [
          {
            storyId: "story-1",
            title: "Sương Đêm",
            authors: "Vy",
            category: "Phiêu lưu",
            averageRating: 4.8,
            reviewCount: 10,
            score: 0.92,
            reason: "Được cộng đồng đánh giá cao.",
          },
        ],
      });

    const element = await StoriesPage({ searchParams: Promise.resolve({ page: "2" }) });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("story-workspace-main");
    expect(html).not.toContain("story-workspace-nav-sidebar");
    expect(html).not.toContain("story-feature-hero");
    expect(html).toContain("Gợi ý truyện phổ biến");
    expect(html).toContain("Truyện mới cập nhật");
    expect(html).toContain("story-pagination");
  });
});
