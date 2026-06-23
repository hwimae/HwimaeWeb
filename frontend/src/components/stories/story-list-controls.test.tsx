import { describe, expect, it } from "vitest";

import { buildStoryListQueryHref } from "../story-list-controls";

describe("buildStoryListQueryHref", () => {
  it("adds q and clears page when the search changes", () => {
    expect(buildStoryListQueryHref("/stories", "page=3", { query: "phiêu lưu", hasContent: false })).toBe(
      "/stories?q=phi%C3%AAu+l%C6%B0u",
    );
  });

  it("toggles hasContent while preserving q", () => {
    expect(buildStoryListQueryHref("/stories", "q=kiem+hiep", { query: "kiem hiep", hasContent: true })).toBe(
      "/stories?q=kiem+hiep&hasContent=true",
    );
  });
});
