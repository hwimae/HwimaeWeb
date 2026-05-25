import type { PrismaClient } from '@prisma/client';
import { PrismaClient as DefaultPrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

type StoryCsvRow = {
  product_id: string;
  title: string;
  authors: string;
  original_price: string;
  current_price: string;
  quantity: string;
  category: string;
  n_review: string;
  avg_rating: string;
  pages: string;
  manufacturer: string;
  cover_link: string;
  discount: string;
};

export type ParsedStory = {
  productId: number;
  title: string;
  authors: string;
  originalPrice: number | null;
  currentPrice: number | null;
  quantity: number | null;
  category: string;
  reviewCount: number;
  averageRating: number;
  pages: number | null;
  manufacturer: string | null;
  coverUrl: string | null;
  discount: number | null;
  contentPath: string | null;
};

const DEFAULT_BOOKS_DIR = resolve(process.cwd(), '../data/raw/books');
const DEFAULT_STORIES_CSV = resolve(DEFAULT_BOOKS_DIR, 'prepared_data_book.csv');
const DEFAULT_OUTPUT_DIR = resolve(DEFAULT_BOOKS_DIR, 'output');

export function parseStoryRows(csv: string, contentPathsByProductId: Map<string, string>): ParsedStory[] {
  const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as StoryCsvRow[];
  const seenProductIds = new Set<number>();
  const stories: ParsedStory[] = [];

  for (const row of rows) {
    const productId = Number(row.product_id);
    if (seenProductIds.has(productId)) continue;
    seenProductIds.add(productId);

    stories.push({
      productId,
      title: row.title,
      authors: normalizeString(row.authors) ?? 'Unknown',
      originalPrice: parseNullableNumber(row.original_price),
      currentPrice: parseNullableNumber(row.current_price),
      quantity: parseNullableInteger(row.quantity),
      category: normalizeString(row.category) ?? 'Others',
      reviewCount: parseNullableInteger(row.n_review) ?? 0,
      averageRating: parseNullableNumber(row.avg_rating) ?? 0,
      pages: parseNullableInteger(row.pages),
      manufacturer: normalizeString(row.manufacturer),
      coverUrl: normalizeString(row.cover_link),
      discount: parseNullableNumber(row.discount),
      contentPath: contentPathsByProductId.get(String(productId)) ?? null,
    });
  }

  return stories;
}

export async function buildContentPathsByProductId(outputDir: string, stories: ParsedStory[]) {
  const files = await readdir(outputDir);
  const contentPathsByProductId = new Map<string, string>();

  for (const story of stories) {
    const expectedFileName = `${story.title} - ${story.authors}.txt`;
    if (files.includes(expectedFileName)) {
      contentPathsByProductId.set(String(story.productId), join(outputDir, expectedFileName));
    }
  }

  return contentPathsByProductId;
}

type ImportStoriesPrisma = Pick<PrismaClient, 'story' | 'storyContent' | '$transaction'>;

export async function importStoriesFromCsv(
  prisma: ImportStoriesPrisma,
  csv: string,
  contentPathsByProductId: Map<string, string>,
) {
  const stories = parseStoryRows(csv, contentPathsByProductId);

  for (const story of stories) {
    await prisma.$transaction(async (tx) => {
      const content = story.contentPath ? await readFile(story.contentPath, 'utf8') : null;
      const importedStory = await tx.story.upsert({
        where: { productId: story.productId },
        create: toPrismaStoryCreateData(story),
        update: toPrismaStoryUpdateData(story),
      });

      if (content !== null) {
        await tx.storyContent.upsert({
          where: { storyId: importedStory.id },
          create: {
            storyId: importedStory.id,
            content,
          },
          update: {
            content,
          },
        });
      } else {
        await tx.storyContent.deleteMany({ where: { storyId: importedStory.id } });
      }
    });
  }

  return stories.length;
}

function toPrismaStoryCreateData(story: ParsedStory) {
  return {
    productId: story.productId,
    ...toPrismaStoryUpdateData(story),
  };
}

function toPrismaStoryUpdateData(story: ParsedStory) {
  return {
    title: story.title,
    authors: story.authors,
    originalPrice: story.originalPrice,
    currentPrice: story.currentPrice,
    quantity: story.quantity,
    averageRating: story.averageRating,
    reviewCount: story.reviewCount,
    pages: story.pages,
    manufacturer: story.manufacturer,
    coverUrl: story.coverUrl,
    discount: story.discount,
    contentPath: story.contentPath,
    category: {
      connectOrCreate: {
        where: { name: story.category },
        create: { name: story.category },
      },
    },
  };
}

function parseNullableNumber(value: string): number | null {
  const normalized = normalizeString(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNullableInteger(value: string): number | null {
  const parsed = parseNullableNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function normalizeString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function importStories(csvPath: string, outputDir: string) {
  const prisma = new DefaultPrismaClient();

  try {
    const csv = await readFile(csvPath, 'utf8');
    const stories = parseStoryRows(csv, new Map());
    const contentPathsByProductId = await buildContentPathsByProductId(outputDir, stories);
    const count = await importStoriesFromCsv(prisma, csv, contentPathsByProductId);

    console.log(`Imported ${count} stories from ${csvPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const csvPath = resolve(process.argv[2] ?? DEFAULT_STORIES_CSV);
  const outputDir = resolve(process.argv[3] ?? DEFAULT_OUTPUT_DIR);
  await importStories(csvPath, outputDir);
}

if (require.main === module) {
  void main();
}
