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

export async function importReviewsFromCsv(_prisma: unknown, _csv: string) {
  return 0;
}

async function importReviews(csvPath: string) {
  const prisma = new DefaultPrismaClient();

  try {
    const csv = await readFile(csvPath, 'utf8');
    const parsedCount = parseReviewRows(csv).length;
    const importedCount = await importReviewsFromCsv(prisma, csv);

    console.log(
      `Comment dataset import is disabled for MVP. Parsed ${parsedCount} comments from ${csvPath}, imported ${importedCount}.`,
    );
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
