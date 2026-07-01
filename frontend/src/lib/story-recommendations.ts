import { apiPost } from "./api";
import {
  parseStoryAdvisorResponse,
  type StoryAdvisorResponse,
} from "../types/recommendation";

async function loadEmbedStoryQuery() {
  const { embedStoryQuery } = await import("./story-query-embedding");
  return embedStoryQuery;
}

export async function requestStoryAdvisorRecommendations(
  query: string,
  limit = 5,
): Promise<StoryAdvisorResponse> {
  const normalized = query.trim();
  const embedStoryQuery = await loadEmbedStoryQuery();
  const embedding = await embedStoryQuery(normalized);

  return apiPost<StoryAdvisorResponse>(
    "/recommendations/search-by-vector",
    { query: normalized, embedding, limit },
    undefined,
    parseStoryAdvisorResponse,
  );
}
