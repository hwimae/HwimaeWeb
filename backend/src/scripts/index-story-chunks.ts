import { Prisma, PrismaClient, type Prisma as PrismaType } from '@prisma/client';
import { loadConfig } from '../config';
import { createAiClient } from '../recommendations/ai-client';
import { chunkStoryContent } from '../recommendations/story-chunker';
import { readStoryContentFromStorage } from '../storage/story-content-storage';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 500;

export type IndexStoryChunksOptions = {
  limit: number;
  after?: string;
  force: boolean;
  dryRun: boolean;
};

type StoryIndexCandidate = {
  id: string;
  title: string;
  contentPath: string | null;
  contentUpdatedAt: Date | null;
};

export function parseIndexStoryChunksArgs(args: string[]): IndexStoryChunksOptions {
  const options: IndexStoryChunksOptions = { limit: DEFAULT_LIMIT, force: false, dryRun: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--limit') {
      options.limit = parseLimit(args[index + 1]);
      index += 1;
      continue;
    }

    if (arg === '--after') {
      const after = args[index + 1];
      if (!after) throw new Error('--after requires a story id');
      options.after = after;
      index += 1;
      continue;
    }

    if (arg === '--force') {
      options.force = true;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (!arg.startsWith('--') && index === 0) {
      options.limit = parseLimit(arg);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

export function buildStoryIndexWhere(options: IndexStoryChunksOptions): PrismaType.StoryWhereInput {
  return {
    contentPath: { not: null },
    ...(options.after ? { id: { gt: options.after } } : {}),
  };
}

async function findStoryIndexCandidates(
  prisma: PrismaClient,
  options: IndexStoryChunksOptions,
): Promise<StoryIndexCandidate[]> {
  const stalePredicate = options.force
    ? Prisma.empty
    : Prisma.sql`AND ("contentIndexedAt" IS NULL OR "contentUpdatedAt" IS NULL OR "contentUpdatedAt" > "contentIndexedAt")`;
  const afterPredicate = options.after ? Prisma.sql`AND "id" > ${options.after}` : Prisma.empty;

  return prisma.$queryRaw<StoryIndexCandidate[]>`
    SELECT "id", "title", "contentPath", "contentUpdatedAt"
    FROM "stories"
    WHERE "contentPath" IS NOT NULL
    ${stalePredicate}
    ${afterPredicate}
    ORDER BY "id" ASC
    LIMIT ${options.limit}
  `;
}

export function buildIndexMetadataUpdateData(contentUpdatedAt: Date | null, indexedAt: Date) {
  return {
    contentIndexedAt: indexedAt,
    ...(contentUpdatedAt === null ? { contentUpdatedAt: indexedAt } : {}),
  };
}

function parseLimit(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
    throw new Error(`Limit must be an integer between 1 and ${MAX_LIMIT}`);
  }
  return parsed;
}

function toVectorLiteral(values: number[]): string {
  if (values.length !== 384) {
    throw new Error(`Expected embedding dimension 384, received ${values.length}`);
  }

  for (const value of values) {
    if (!Number.isFinite(value)) {
      throw new Error('Embedding contains a non-finite value');
    }
  }

  return `[${values.join(',')}]`;
}

async function replaceStoryChunks(
  prisma: PrismaClient,
  storyId: string,
  chunks: Array<{ chunkIndex: number; content: string; embedding: number[] }>,
) {
  await prisma.$transaction(async (tx) => {
    await tx.storyChunk.deleteMany({ where: { storyId } });

    for (const chunk of chunks) {
      await tx.$executeRaw`
        INSERT INTO "story_chunks" ("id", "storyId", "chunkIndex", "content", "embedding")
        VALUES (gen_random_uuid()::text, ${storyId}, ${chunk.chunkIndex}, ${chunk.content}, ${toVectorLiteral(chunk.embedding)}::vector)
      `;
    }
  });
}

async function main() {
  const options = parseIndexStoryChunksArgs(process.argv.slice(2));
  const config = loadConfig();
  const prisma = new PrismaClient();
  const aiClient = options.dryRun ? null : createAiClient(config.aiServiceUrl);

  try {
    const stories = await findStoryIndexCandidates(prisma, options);

    if (options.dryRun) {
      console.log(`Dry run: ${stories.length} stories need indexing`);
      for (const story of stories) {
        console.log(`${story.id}\t${story.title}`);
      }

      const lastStory = stories.at(-1);
      if (lastStory) {
        console.log(`Next cursor: ${lastStory.id}`);
      }
      return;
    }

    for (const story of stories) {
      if (!story.contentPath) continue;

      const content = await readStoryContentFromStorage(story.contentPath);
      if (content === null) {
        console.warn(`Skipped ${story.title}: content file not found at ${story.contentPath}`);
        continue;
      }

      const chunks = chunkStoryContent(content);
      const chunksWithEmbeddings: Array<{ chunkIndex: number; content: string; embedding: number[] }> = [];

      if (!aiClient) {
        throw new Error('AI client is required when not running dry-run');
      }

      for (const chunk of chunks) {
        const embedding = await aiClient.embedText(`passage: ${chunk.content}`);
        chunksWithEmbeddings.push({ ...chunk, embedding });
      }

      await replaceStoryChunks(prisma, story.id, chunksWithEmbeddings);
      const indexedAt = new Date();
      await prisma.story.update({
        where: { id: story.id },
        data: buildIndexMetadataUpdateData(story.contentUpdatedAt, indexedAt),
      });
      console.log(`Indexed ${chunksWithEmbeddings.length} chunks for ${story.title}`);
    }

    console.log(`Indexed story chunks for ${stories.length} stories`);
    const lastStory = stories.at(-1);
    if (lastStory) {
      console.log(`Next cursor: ${lastStory.id}`);
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`Prisma error ${error.code}: ${error.message}`);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.env.JEST_WORKER_ID === undefined) {
  void main();
}
