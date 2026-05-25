-- Drop old movie-domain tables after the domain cutover.
DROP TABLE IF EXISTS "ratings";
DROP TABLE IF EXISTS "movie_genres";
DROP TABLE IF EXISTS "movies";
DROP TABLE IF EXISTS "genres";

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "pages" INTEGER,
    "manufacturer" TEXT,
    "coverUrl" TEXT,
    "discount" DOUBLE PRECISION,
    "contentPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "storyId" TEXT NOT NULL,
    "externalCustomerId" TEXT,
    "externalCommentId" TEXT,
    "rating" DOUBLE PRECISION NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "thankCount" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'user',
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "stories_productId_key" ON "stories"("productId");

-- CreateIndex
CREATE INDEX "stories_categoryId_idx" ON "stories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_externalCommentId_key" ON "reviews"("externalCommentId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_userId_storyId_key" ON "reviews"("userId", "storyId");

-- CreateIndex
CREATE INDEX "reviews_storyId_idx" ON "reviews"("storyId");

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
