import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/recommendations",
}));

import RecommendationsPage from "./page";

describe("RecommendationsPage", () => {
  it("renders the plain advisor entry card without workspace navigation", () => {
    const html = renderToStaticMarkup(<RecommendationsPage />);

    expect(html).not.toContain("story-workspace-nav-sidebar");
    expect(html).toContain("story-advisor-card");
    expect(html).not.toContain("story-advisor-hero");
    expect(html).toContain("Tìm truyện cùng AI");
    expect(html).toContain("Gợi ý nhanh");
    expect(html).not.toContain("Assistant cho gu đọc của bạn");
  });
});
