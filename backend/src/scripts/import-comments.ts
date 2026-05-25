import type { PrismaClient } from '@prisma/client';
import { PrismaClient as DefaultPrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type CommentCsvRow = {
  product_id: string;
  comment_id: string;
  title: string;
  thank_count: string;
  customer_id: string;
  rating: string;
  content: string;
};

export type ParsedReview = {
  productId: number;
  externalCommentId: string;
  title: string;
  thankCount: number;
  externalCustomerId: string;
  rating: number;
  content: string;
};

const DEFAULT_COMMENTS_CSV = resolve(process.cwd(), '../data/raw/books/comments.csv');

export function parseReviewRows(csv: string): ParsedReview[] {
  const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as CommentCsvRow[];

  return rows.map((row) => ({
    productId: Number(row.product_id),
    externalCommentId: row.comment_id,
    title: row.title,
    thankCount: Number(row.thank_count),
    externalCustomerId: row.customer_id,
    rating: Number(row.rating),
    content: row.content,
  }));
}

export async function importReviewsFromCsv(prisma: Pick<PrismaClient, 'story' | 'review'>, csv: string) {
  const reviews = parseReviewRows(csv);
  const affectedStoryIds = new Set<string>();
  let importedCount = 0;

  for (const review of reviews) {
    const story = await prisma.story.findUnique({ where: { productId: review.productId }, select: { id: true } });
    if (!story) continue;

    await prisma.review.upsert({
      where: { externalCommentId: review.externalCommentId },
      create: {
        storyId: story.id,
        externalCommentId: review.externalCommentId,
        externalCustomerId: review.externalCustomerId,
        rating: review.rating,
        title: review.title,
        content: review.content,
        thankCount: review.thankCount,
        source: 'imported',
      },
      update: {
        storyId: story.id,
        externalCustomerId: review.externalCustomerId,
        rating: review.rating,
        title: review.title,
        content: review.content,
        thankCount: review.thankCount,
        source: 'imported',
      },
    });
    affectedStoryIds.add(story.id);
    importedCount += 1;
  }

  for (const storyId of affectedStoryIds) {
    const aggregate = await prisma.review.aggregate({
      where: { storyId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await prisma.story.update({
      where: { id: storyId },
      data: { averageRating: aggregate._avg.rating ?? 0, reviewCount: aggregate._count._all },
    });
  }

  return importedCount;
}

async function importReviews(csvPath: string) {
  const prisma = new DefaultPrismaClient();

  try {
    const csv = await readFile(csvPath, 'utf8');
    const count = await importReviewsFromCsv(prisma, csv);

    console.log(`Imported ${count} reviews from ${csvPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const csvPath = resolve(process.argv[2] ?? DEFAULT_COMMENTS_CSV);
  await importReviews(csvPath);
}

if (require.main === module) {
  void main();
}
