import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AdvisorQuickPrompts } from "./advisor-quick-prompts";

describe("AdvisorQuickPrompts", () => {
  it("renders the helper label and every prompt chip", () => {
    const html = renderToStaticMarkup(
      <AdvisorQuickPrompts
        prompts={["Huyền huyễn", "Trọng sinh", "Nữ cường", "Điền văn"]}
        onSelectPrompt={vi.fn()}
      />,
    );

    expect(html).toContain("Gợi ý nhanh");
    expect(html).toContain("Huyền huyễn");
    expect(html).toContain("Trọng sinh");
    expect(html).toContain("story-advisor-quick-prompts");
  });
});
