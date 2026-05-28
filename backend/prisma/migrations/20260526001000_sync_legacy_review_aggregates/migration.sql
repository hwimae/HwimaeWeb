INSERT INTO "external_reviews" ("id", "storyId", "externalCustomerId", "externalCommentId", "rating", "title", "content", "thankCount", "reviewedAt", "createdAt", "updatedAt")
SELECT "id", "storyId", "externalCustomerId", "externalCommentId", "rating", "title", "content", "thankCount", "reviewedAt", "createdAt", "updatedAt"
FROM "reviews"
WHERE "externalCommentId" IS NOT NULL
ON CONFLICT ("externalCommentId") DO NOTHING;

INSERT INTO "user_reviews" ("id", "userId", "storyId", "rating", "title", "content", "reviewedAt", "createdAt", "updatedAt")
SELECT "id", "userId", "storyId", "rating", "title", "content", "reviewedAt", "createdAt", "updatedAt"
FROM "reviews"
WHERE "userId" IS NOT NULL
ON CONFLICT ("userId", "storyId") DO NOTHING;

UPDATE "stories" s
SET "externalAverageRating" = COALESCE(a.avg_rating, 0),
    "externalReviewCount" = COALESCE(a.review_count, 0),
    "averageRating" = COALESCE(a.avg_rating, 0),
    "reviewCount" = COALESCE(a.review_count, 0)
FROM (
  SELECT "storyId", AVG("rating") AS avg_rating, COUNT(*)::int AS review_count
  FROM "external_reviews"
  GROUP BY "storyId"
) a
WHERE s."id" = a."storyId";

UPDATE "stories" s
SET "userAverageRating" = COALESCE(a.avg_rating, 0),
    "userReviewCount" = COALESCE(a.review_count, 0)
FROM (
  SELECT "storyId", AVG("rating") AS avg_rating, COUNT(*)::int AS review_count
  FROM "user_reviews"
  GROUP BY "storyId"
) a
WHERE s."id" = a."storyId";
