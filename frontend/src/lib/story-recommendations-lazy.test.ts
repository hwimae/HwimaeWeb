import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("requestStoryAdvisorRecommendations lazy loading", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.doUnmock("./api");
    vi.doUnmock("./story-query-embedding");
  });

  it("loads the browser embedding module only when a recommendation request is made", async () => {
    let storyQueryEmbeddingModuleLoadCount = 0;
    const embedStoryQuery = vi.fn().mockResolvedValue(new Array(384).fill(0.1));
    const apiPost = vi.fn().mockResolvedValue({ answer: "ok", recommendations: [] });

    vi.doMock("./story-query-embedding", () => {
      storyQueryEmbeddingModuleLoadCount += 1;
      return { embedStoryQuery };
    });
    vi.doMock("./api", () => ({ apiPost }));

    const { requestStoryAdvisorRecommendations } = await import("./story-recommendations");

    expect(storyQueryEmbeddingModuleLoadCount).toBe(0);

    await requestStoryAdvisorRecommendations("truyện tu tiên", 5);

    expect(storyQueryEmbeddingModuleLoadCount).toBe(1);
    expect(embedStoryQuery).toHaveBeenCalledWith("truyện tu tiên");
    expect(apiPost).toHaveBeenCalledWith(
      "/recommendations/search-by-vector",
      expect.objectContaining({
        query: "truyện tu tiên",
        embedding: expect.any(Array),
        limit: 5,
      }),
      undefined,
      expect.any(Function),
    );
  });
});
