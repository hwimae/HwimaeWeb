ALTER TABLE "stories"
ADD COLUMN "contentHash" TEXT,
ADD COLUMN "contentUpdatedAt" TIMESTAMP(3),
ADD COLUMN "contentIndexedAt" TIMESTAMP(3);

CREATE INDEX "stories_content_index_state_idx"
ON "stories"("contentPath", "contentUpdatedAt", "contentIndexedAt");
