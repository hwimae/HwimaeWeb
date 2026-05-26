export type RecommendationItem = {
  storyId: string;
  title: string;
  authors: string;
  category: string;
  averageRating: number;
  reviewCount: number;
  score: number;
  reason: string;
};

export type RecommendationsResponse = {
  items: RecommendationItem[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseRecommendationItem(input: unknown): RecommendationItem {
  if (!isRecord(input)) throw new Error("Invalid recommendation: expected object");

  const { storyId, title, authors, category, averageRating, reviewCount, score, reason } = input;

  if (typeof storyId !== "string") throw new Error("Invalid recommendation.storyId: expected string");
  if (typeof title !== "string") throw new Error("Invalid recommendation.title: expected string");
  if (typeof authors !== "string") throw new Error("Invalid recommendation.authors: expected string");
  if (typeof category !== "string") throw new Error("Invalid recommendation.category: expected string");
  if (typeof averageRating !== "number") throw new Error("Invalid recommendation.averageRating: expected number");
  if (typeof reviewCount !== "number") throw new Error("Invalid recommendation.reviewCount: expected number");
  if (typeof score !== "number") throw new Error("Invalid recommendation.score: expected number");
  if (typeof reason !== "string") throw new Error("Invalid recommendation.reason: expected string");

  return { storyId, title, authors, category, averageRating, reviewCount, score, reason };
}

export function parseRecommendationsResponse(input: unknown): RecommendationsResponse {
  if (!isRecord(input)) throw new Error("Invalid recommendations response: expected object");

  const { items } = input;

  if (!Array.isArray(items)) throw new Error("Invalid recommendations response.items: expected array");

  return { items: items.map(parseRecommendationItem) };
}
