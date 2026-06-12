CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "currentPrice" DOUBLE PRECISION,
    "quantity" INTEGER,
    "categoryId" TEXT NOT NULL,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "externalAverageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "externalReviewCount" INTEGER NOT NULL DEFAULT 0,
    "userAverageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userReviewCount" INTEGER NOT NULL DEFAULT 0,
    "pages" INTEGER,
    "manufacturer" TEXT,
    "coverUrl" TEXT,
    "discount" DOUBLE PRECISION,
    "contentPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
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

CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "stories_productId_key" ON "stories"("productId");
CREATE INDEX "stories_categoryId_idx" ON "stories"("categoryId");
CREATE UNIQUE INDEX "user_reviews_userId_storyId_key" ON "user_reviews"("userId", "storyId");
CREATE INDEX "user_reviews_storyId_idx" ON "user_reviews"("storyId");

ALTER TABLE "stories" ADD CONSTRAINT "stories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_reviews" ADD CONSTRAINT "user_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_reviews" ADD CONSTRAINT "user_reviews_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
