ALTER TABLE "stories"
ADD COLUMN "externalAverageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "externalReviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "userAverageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "userReviewCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "external_reviews" (
  "id" TEXT NOT NULL,
  "storyId" TEXT NOT NULL,
  "externalCustomerId" TEXT,
  "externalCommentId" TEXT NOT NULL,
  "rating" DOUBLE PRECISION NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "thankCount" INTEGER NOT NULL DEFAULT 0,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "external_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_reviews" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "storyId" TEXT NOT NULL,
  "rating" DOUBLE PRECISION NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_reviews_pkey" PRIMARY KEY ("id")
);

INSERT INTO "external_reviews" ("id", "storyId", "externalCustomerId", "externalCommentId", "rating", "title", "content", "thankCount", "reviewedAt", "createdAt", "updatedAt")
SELECT "id", "storyId", "externalCustomerId", "externalCommentId", "rating", "title", "content", "thankCount", "reviewedAt", "createdAt", "updatedAt"
FROM "reviews"
WHERE "source" = 'imported' AND "externalCommentId" IS NOT NULL;

INSERT INTO "user_reviews" ("id", "userId", "storyId", "rating", "title", "content", "reviewedAt", "createdAt", "updatedAt")
SELECT "id", "userId", "storyId", "rating", "title", "content", "reviewedAt", "createdAt", "updatedAt"
FROM "reviews"
WHERE "source" = 'user' AND "userId" IS NOT NULL;

CREATE UNIQUE INDEX "external_reviews_externalCommentId_key" ON "external_reviews"("externalCommentId");
CREATE INDEX "external_reviews_storyId_idx" ON "external_reviews"("storyId");
CREATE UNIQUE INDEX "user_reviews_userId_storyId_key" ON "user_reviews"("userId", "storyId");
CREATE INDEX "user_reviews_storyId_idx" ON "user_reviews"("storyId");

ALTER TABLE "external_reviews" ADD CONSTRAINT "external_reviews_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_reviews" ADD CONSTRAINT "user_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_reviews" ADD CONSTRAINT "user_reviews_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "stories" s
SET "externalAverageRating" = COALESCE(a.avg_rating, 0),
    "externalReviewCount" = COALESCE(a.review_count, 0)
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
