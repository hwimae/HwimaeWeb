import { apiPost } from "./api";
import { embedStoryQuery } from "./story-query-embedding";
import {
  parseStoryAdvisorResponse,
  type StoryAdvisorResponse,
} from "../types/recommendation";

export async function requestStoryAdvisorRecommendations(
  query: string,
  limit = 5,
): Promise<StoryAdvisorResponse> {
  const normalized = query.trim();
  const embedding = await embedStoryQuery(normalized);

  return apiPost<StoryAdvisorResponse>(
    "/recommendations/search-by-vector",
    { query: normalized, embedding, limit },
    undefined,
    parseStoryAdvisorResponse,
  );
}
