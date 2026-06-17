import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ModuleCard } from "./module-card";

describe("ModuleCard", () => {
  it("renders a clickable module summary", () => {
    const html = renderToStaticMarkup(
      <ModuleCard
        href="/stories"
        label="Truyện"
        title="Gợi ý truyện"
        description="Khám phá truyện phù hợp."
        cta="Mở truyện"
      />,
    );

    expect(html).toContain('href="/stories"');
    expect(html).toContain("Gợi ý truyện");
    expect(html).toContain("Mở truyện");
    expect(html).toContain("Sẵn sàng");
  });

  it("renders coming-soon status", () => {
    const html = renderToStaticMarkup(
      <ModuleCard
        href="/movie"
        label="Phim"
        title="Không gian phim"
        description="Đang phát triển."
        cta="Xem phim"
        status="Đang hoàn thiện"
      />,
    );

    expect(html).toContain("Đang hoàn thiện");
  });
});
