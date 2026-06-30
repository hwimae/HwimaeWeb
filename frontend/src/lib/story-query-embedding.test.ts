import { afterEach, describe, expect, it, vi } from "vitest";

import { embedStoryQuery } from "./story-query-embedding";

describe("embedStoryQuery", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fails fast with a clear error outside the browser runtime", async () => {
    vi.stubGlobal("window", undefined);

    await expect(embedStoryQuery("tu tiên")).rejects.toThrow(
      "Story query embedding can only run in the browser runtime. Do not initialize story semantic search on the server.",
    );
  });
});
