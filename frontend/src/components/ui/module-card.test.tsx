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
  });
});
