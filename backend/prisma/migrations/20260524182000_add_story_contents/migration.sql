-- CreateTable
CREATE TABLE "story_contents" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "story_contents_storyId_key" ON "story_contents"("storyId");

-- AddForeignKey
ALTER TABLE "story_contents" ADD CONSTRAINT "story_contents_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
