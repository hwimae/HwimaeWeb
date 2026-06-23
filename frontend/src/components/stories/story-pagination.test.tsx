import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StoryPagination } from "./story-pagination";

describe("StoryPagination", () => {
  it("renders previous, next, active page, and ellipsis for long ranges", () => {
    const html = renderToStaticMarkup(
      <StoryPagination currentPage={6} totalPages={12} buildHref={(page) => `/stories?page=${page}`} />,
    );

    expect(html).toContain("Phân trang danh sách truyện");
    expect(html).toContain('href="/stories?page=5"');
    expect(html).toContain('href="/stories?page=7"');
    expect(html).toContain("story-pagination-ellipsis");
    expect(html).toContain('aria-current="page"');
  });
});
