import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/api", () => ({
  apiPost: vi.fn(),
}));

import {
  ADVISOR_QUICK_PROMPTS,
  buildAdvisorPromptValue,
  StoryAdvisorForm,
} from "./story-advisor-form";

describe("buildAdvisorPromptValue", () => {
  it("expands quick prompt chips into a fuller query", () => {
    expect(buildAdvisorPromptValue("Huyền huyễn")).toContain("Huyền huyễn");
    expect(buildAdvisorPromptValue("Huyền huyễn")).toContain("nhân vật chính");
  });
});

describe("StoryAdvisorForm", () => {
  it("renders the hero title, textarea CTA and quick prompts before any result", () => {
    const html = renderToStaticMarkup(<StoryAdvisorForm />);

    expect(ADVISOR_QUICK_PROMPTS).toEqual([
      "Huyền huyễn",
      "Trọng sinh",
      "Nữ cường",
      "Điền văn",
    ]);
    expect(html).toContain("Tìm truyện cùng AI");
    expect(html).toContain("Hỏi AI tư vấn");
    expect(html).toContain("Gợi ý nhanh");
    expect(html).not.toContain("StoryRec AI");
  });
});
