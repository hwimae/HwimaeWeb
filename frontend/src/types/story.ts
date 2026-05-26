export type Story = {
  id: string;
  productId: number;
  title: string;
  authors: string;
  originalPrice: number | null;
  currentPrice: number | null;
  quantity: number | null;
  averageRating: number;
  reviewCount: number;
  externalAverageRating: number;
  externalReviewCount: number;
  userAverageRating: number;
  userReviewCount: number;
  pages: number | null;
  manufacturer: string | null;
  coverUrl: string | null;
  discount: number | null;
  categoryId: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  hasContent: boolean;
};

export type PaginatedStories = {
  items: Story[];
  total: number;
  page: number;
  limit: number;
};

export type StoryContent = {
  storyId: string;
  title: string;
  content: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseNullableString(value: unknown, fieldName: string): string | null {
  if (value === null || typeof value === "string") return value;
  throw new Error(`Invalid story.${fieldName}: expected string | null`);
}

function parseNullableNumber(value: unknown, fieldName: string): number | null {
  if (value === null || typeof value === "number") return value;
  throw new Error(`Invalid story.${fieldName}: expected number | null`);
}

export function parseStory(input: unknown): Story {
  if (!isRecord(input)) throw new Error("Invalid story: expected object");

  const {
    id,
    productId,
    title,
    authors,
    originalPrice,
    currentPrice,
    quantity,
    averageRating,
    reviewCount,
    externalAverageRating,
    externalReviewCount,
    userAverageRating,
    userReviewCount,
    pages,
    manufacturer,
    coverUrl,
    discount,
    categoryId,
    category,
    createdAt,
    updatedAt,
    hasContent,
  } = input;

  if (typeof id !== "string") throw new Error("Invalid story.id: expected string");
  if (typeof productId !== "number") throw new Error("Invalid story.productId: expected number");
  if (typeof title !== "string") throw new Error("Invalid story.title: expected string");
  if (typeof authors !== "string") throw new Error("Invalid story.authors: expected string");
  if (typeof quantity !== "number" && quantity !== null) throw new Error("Invalid story.quantity: expected number | null");
  if (typeof averageRating !== "number") throw new Error("Invalid story.averageRating: expected number");
  if (typeof reviewCount !== "number") throw new Error("Invalid story.reviewCount: expected number");
  if (typeof externalAverageRating !== "number") throw new Error("Invalid story.externalAverageRating: expected number");
  if (typeof externalReviewCount !== "number") throw new Error("Invalid story.externalReviewCount: expected number");
  if (typeof userAverageRating !== "number") throw new Error("Invalid story.userAverageRating: expected number");
  if (typeof userReviewCount !== "number") throw new Error("Invalid story.userReviewCount: expected number");
  if (typeof pages !== "number" && pages !== null) throw new Error("Invalid story.pages: expected number | null");
  if (typeof categoryId !== "string") throw new Error("Invalid story.categoryId: expected string");
  if (typeof category !== "string") throw new Error("Invalid story.category: expected string");
  if (typeof createdAt !== "string") throw new Error("Invalid story.createdAt: expected string");
  if (typeof updatedAt !== "string") throw new Error("Invalid story.updatedAt: expected string");
  if (typeof hasContent !== "boolean") throw new Error("Invalid story.hasContent: expected boolean");

  return {
    id,
    productId,
    title,
    authors,
    originalPrice: parseNullableNumber(originalPrice, "originalPrice"),
    currentPrice: parseNullableNumber(currentPrice, "currentPrice"),
    quantity,
    averageRating,
    reviewCount,
    externalAverageRating,
    externalReviewCount,
    userAverageRating,
    userReviewCount,
    pages,
    manufacturer: parseNullableString(manufacturer, "manufacturer"),
    coverUrl: parseNullableString(coverUrl, "coverUrl"),
    discount: parseNullableNumber(discount, "discount"),
    categoryId,
    category,
    createdAt,
    updatedAt,
    hasContent,
  };
}

export function parsePaginatedStories(input: unknown): PaginatedStories {
  if (!isRecord(input)) throw new Error("Invalid paginated stories response: expected object");

  const { items, total, page, limit } = input;

  if (!Array.isArray(items)) throw new Error("Invalid paginated stories response.items: expected array");
  if (typeof total !== "number") throw new Error("Invalid paginated stories response.total: expected number");
  if (typeof page !== "number") throw new Error("Invalid paginated stories response.page: expected number");
  if (typeof limit !== "number") throw new Error("Invalid paginated stories response.limit: expected number");

  return { items: items.map(parseStory), total, page, limit };
}

export function parseStoryContent(input: unknown): StoryContent {
  if (!isRecord(input)) throw new Error("Invalid story content: expected object");

  const { storyId, title, content } = input;

  if (typeof storyId !== "string") throw new Error("Invalid storyContent.storyId: expected string");
  if (typeof title !== "string") throw new Error("Invalid storyContent.title: expected string");
  if (typeof content !== "string") throw new Error("Invalid storyContent.content: expected string");

  return { storyId, title, content };
}
