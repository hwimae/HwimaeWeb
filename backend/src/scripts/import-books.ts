import type { PrismaClient } from '@prisma/client';
import { PrismaClient as DefaultPrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { copyStoryContentToStorage } from '../storage/story-content-storage';

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
const DEFAULT_MATCH_REPORT_PATH = resolve(process.cwd(), '../data/processed/content-path-match-report.json');

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
      reviewCount: 0,
      averageRating: 0,
      pages: parseNullableInteger(row.pages),
      manufacturer: normalizeString(row.manufacturer),
      coverUrl: normalizeString(row.cover_link),
      discount: parseNullableNumber(row.discount),
      contentPath: contentPathsByProductId.get(String(productId)) ?? null,
    });
  }

  return stories;
}

type ContentPathMatchReport = {
  matched: Array<{ productId: number; title: string; authors: string; fileName: string }>;
  missing: Array<{ productId: number; title: string; authors: string }>;
  ambiguous: Array<{ productId: number; title: string; authors: string; candidates: string[] }>;
};

export async function copyMatchedContentToStorage(
  outputDir: string,
  matches: ContentPathMatchReport['matched'],
  backendRoot = resolve(process.cwd()),
): Promise<Map<string, string>> {
  const contentPathsByProductId = new Map<string, string>();

  for (const match of matches) {
    const sourcePath = join(outputDir, match.fileName);
    const storedRelativePath = await copyStoryContentToStorage(sourcePath, match.productId, backendRoot);
    contentPathsByProductId.set(String(match.productId), storedRelativePath);
  }

  return contentPathsByProductId;
}

export async function buildContentPathsByProductId(
  outputDir: string,
  stories: ParsedStory[],
  backendRoot = resolve(process.cwd()),
) {
  const report = await buildContentPathMatchReport(outputDir, stories);
  return copyMatchedContentToStorage(outputDir, report.matched, backendRoot);
}

export async function buildContentPathMatchReport(outputDir: string, stories: ParsedStory[]): Promise<ContentPathMatchReport> {
  const files = await readdir(outputDir);
  const normalizedFiles = files
    .filter((file) => file.toLowerCase().endsWith('.txt'))
    .map((file) => ({ file, normalized: normalizeForMatch(file.replace(/\.txt$/i, '')) }));
  const report: ContentPathMatchReport = { matched: [], missing: [], ambiguous: [] };

  for (const story of stories) {
    const matches = findContentFileMatches(story, normalizedFiles);
    if (matches.length === 1) {
      report.matched.push({ productId: story.productId, title: story.title, authors: story.authors, fileName: matches[0].file });
    } else if (matches.length > 1) {
      report.ambiguous.push({
        productId: story.productId,
        title: story.title,
        authors: story.authors,
        candidates: matches.map(({ file }) => file).sort(),
      });
    } else {
      report.missing.push({ productId: story.productId, title: story.title, authors: story.authors });
    }
  }

  return report;
}

function findContentFileMatches(story: ParsedStory, files: Array<{ file: string; normalized: string }>) {
  const titleTokens = tokenizeForMatch(removeEditionNoise(story.title));
  const authorTokens = tokenizeForMatch(story.authors).filter((token) => token !== 'unknown');
  if (titleTokens.join('').length < 4) return [];

  const scoredMatches = files
    .map((file) => ({ ...file, score: scoreContentFileMatch(titleTokens, authorTokens, tokenizeForMatch(file.normalized)) }))
    .filter(({ score }) => score >= 0.8)
    .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));

  if (scoredMatches.length <= 1) return scoredMatches;
  return scoredMatches.filter(({ score }) => score === scoredMatches[0].score);
}

function scoreContentFileMatch(titleTokens: string[], authorTokens: string[], fileTokens: string[]): number {
  const fileTokenSet = new Set(fileTokens);
  const titleScore = countTokenMatches(titleTokens, fileTokenSet) / titleTokens.length;
  const authorScore = authorTokens.length > 0 ? countTokenMatches(authorTokens, fileTokenSet) / authorTokens.length : 0;
  return authorTokens.length > 0 ? titleScore * 0.8 + authorScore * 0.2 : titleScore;
}

function countTokenMatches(tokens: string[], fileTokenSet: Set<string>): number {
  return tokens.filter((token) => fileTokenSet.has(token)).length;
}

function tokenizeForMatch(value: string): string[] {
  return normalizeForMatch(value)
    .split(' ')
    .filter((token) => token.length > 1);
}

function removeEditionNoise(value: string): string {
  return value
    .replace(/\([^)]*(tái bản|tai ban|bìa cứng|bia cung|ấn bản|an ban)[^)]*\)/gi, ' ')
    .replace(/\b(tái bản|tai ban|bìa cứng|bia cung|ấn bản|an ban|kỷ niệm|ky niem)\b.*$/gi, ' ');
}

type ImportStoriesPrisma = Pick<PrismaClient, 'story' | '$transaction'>;

export async function importStoriesFromCsv(
  prisma: ImportStoriesPrisma,
  csv: string,
  contentPathsByProductId: Map<string, string>,
) {
  const stories = parseStoryRows(csv, contentPathsByProductId);

  for (const story of stories) {
    await prisma.$transaction(async (tx) => {
      await tx.story.upsert({
        where: { productId: story.productId },
        create: toPrismaStoryCreateData(story),
        update: toPrismaStoryUpdateData(story),
      });
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
    averageRating: 0,
    reviewCount: 0,
    externalAverageRating: 0,
    externalReviewCount: 0,
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

function normalizeForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

async function importStories(csvPath: string, outputDir: string, reportPath: string) {
  const prisma = new DefaultPrismaClient();

  try {
    const csv = await readFile(csvPath, 'utf8');
    const stories = parseStoryRows(csv, new Map());
    const report = await buildContentPathMatchReport(outputDir, stories);
    await writeContentPathMatchReport(reportPath, report);
    const contentPathsByProductId = await copyMatchedContentToStorage(outputDir, report.matched);
    const count = await importStoriesFromCsv(prisma, csv, contentPathsByProductId);

    console.log(`Imported ${count} stories from ${csvPath}`);
    console.log(`Content path matches: ${report.matched.length} matched, ${report.ambiguous.length} ambiguous, ${report.missing.length} missing`);
    console.log(`Content path match report: ${reportPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function writeContentPathMatchReport(reportPath: string, report: ContentPathMatchReport) {
  await mkdir(resolve(reportPath, '..'), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
}

async function main() {
  const csvPath = resolve(process.argv[2] ?? DEFAULT_STORIES_CSV);
  const outputDir = resolve(process.argv[3] ?? DEFAULT_OUTPUT_DIR);
  const reportPath = resolve(process.argv[4] ?? DEFAULT_MATCH_REPORT_PATH);
  await importStories(csvPath, outputDir, reportPath);
}

if (require.main === module) {
  void main();
}
