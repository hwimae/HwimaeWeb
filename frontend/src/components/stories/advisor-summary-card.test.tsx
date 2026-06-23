import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AdvisorSummaryCard } from "./advisor-summary-card";

describe("AdvisorSummaryCard", () => {
  it("renders the StoryRec AI label and answer copy", () => {
    const html = renderToStaticMarkup(
      <AdvisorSummaryCard answer="AI đã tìm ra 3 truyện phù hợp với gu đọc tu tiên của bạn." />,
    );

    expect(html).toContain("StoryRec AI");
    expect(html).toContain("AI đã tìm ra 3 truyện phù hợp");
    expect(html).toContain("story-advisor-summary-card");
  });
});
