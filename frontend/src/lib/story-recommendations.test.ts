import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./api", () => ({ apiPost: vi.fn() }));
vi.mock("./story-query-embedding", () => ({ embedStoryQuery: vi.fn() }));

import { apiPost } from "./api";
import { embedStoryQuery } from "./story-query-embedding";
import { requestStoryAdvisorRecommendations } from "./story-recommendations";

describe("requestStoryAdvisorRecommendations", () => {
  beforeEach(() => {
    vi.mocked(embedStoryQuery).mockResolvedValue(new Array(384).fill(0.1));
    vi.mocked(apiPost).mockResolvedValue({ answer: "ok", recommendations: [] });
  });

  it("embeds the trimmed query in the browser before calling the vector endpoint", async () => {
    await requestStoryAdvisorRecommendations("  truyện tu tiên  ", 5);

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
