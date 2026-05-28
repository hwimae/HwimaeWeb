import { Prisma, PrismaClient, type Prisma as PrismaType } from '@prisma/client';
import { loadConfig } from '../config';
import { createAiClient } from '../recommendations/ai-client';
import { chunkStoryContent } from '../recommendations/story-chunker';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 500;

export type IndexStoryChunksOptions = {
  limit: number;
  after?: string;
  force: boolean;
};

export function parseIndexStoryChunksArgs(args: string[]): IndexStoryChunksOptions {
  const options: IndexStoryChunksOptions = { limit: DEFAULT_LIMIT, force: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

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
    content: { isNot: null },
    ...(options.after ? { id: { gt: options.after } } : {}),
    ...(options.force ? {} : { chunks: { none: {} } }),
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
  const aiClient = createAiClient(config.aiServiceUrl);

  try {
    const stories = await prisma.story.findMany({
      where: buildStoryIndexWhere(options),
      include: { content: true },
      orderBy: { id: 'asc' },
      take: options.limit,
    });

    for (const story of stories) {
      if (!story.content) continue;

      const chunks = chunkStoryContent(story.content.content);
      const chunksWithEmbeddings: Array<{ chunkIndex: number; content: string; embedding: number[] }> = [];

      for (const chunk of chunks) {
        const embedding = await aiClient.embedText(`passage: ${chunk.content}`);
        chunksWithEmbeddings.push({ ...chunk, embedding });
      }

      await replaceStoryChunks(prisma, story.id, chunksWithEmbeddings);
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
