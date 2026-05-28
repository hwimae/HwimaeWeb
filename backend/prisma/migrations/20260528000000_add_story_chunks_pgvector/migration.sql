CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "story_chunks" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(384) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_chunks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "story_chunks_storyId_chunkIndex_key" ON "story_chunks"("storyId", "chunkIndex");
CREATE INDEX "story_chunks_storyId_idx" ON "story_chunks"("storyId");
CREATE INDEX "story_chunks_embedding_idx" ON "story_chunks" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

ALTER TABLE "story_chunks" ADD CONSTRAINT "story_chunks_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
