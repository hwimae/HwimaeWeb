import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  buildContentPathMatchReport,
  copyMatchedContentToStorage,
  importStoriesFromCsv,
  parseStoryRows,
} from './import-books';

describe('parseStoryRows', () => {
  it('uses mapped contentPath and forces averageRating/reviewCount to 0', () => {
    const csv = [
      'product_id,title,authors,original_price,current_price,quantity,category,n_review,avg_rating,pages,manufacturer,cover_link,discount',
      '101,Book A,Author A,100,90,12,Fiction,345,4.8,210,Publisher A,https://example.com/a.jpg,10',
    ].join('\n');

    const contentPathsByProductId = new Map<string, string>([['101', 'storage/stories/101.txt']]);

    const stories = parseStoryRows(csv, contentPathsByProductId);

    expect(stories).toHaveLength(1);
    expect(stories[0]).toMatchObject({
      productId: 101,
      contentPath: 'storage/stories/101.txt',
      reviewCount: 0,
      averageRating: 0,
    });
  });
});

describe('copyMatchedContentToStorage', () => {
  it('copies matched files into storage/stories/<productId>.txt and returns relative paths map', async () => {
    const backendRoot = await mkdtemp(join(tmpdir(), 'import-books-copy-'));
    const outputDir = join(backendRoot, 'data', 'raw', 'books', 'output');

    try {
      await mkdir(outputDir, { recursive: true });
      await writeFile(join(outputDir, 'file-1.txt'), 'CONTENT-ONE', 'utf8');
      await writeFile(join(outputDir, 'file-2.txt'), 'CONTENT-TWO', 'utf8');

      const result = await copyMatchedContentToStorage(
        outputDir,
        [
          { productId: 11, title: 'T1', authors: 'A1', fileName: 'file-1.txt' },
          { productId: 22, title: 'T2', authors: 'A2', fileName: 'file-2.txt' },
        ],
        backendRoot,
      );

      expect(result).toEqual(
        new Map<string, string>([
          ['11', 'storage/stories/11.txt'],
          ['22', 'storage/stories/22.txt'],
        ]),
      );

      await expect(readFile(join(backendRoot, 'storage', 'stories', '11.txt'), 'utf8')).resolves.toBe('CONTENT-ONE');
      await expect(readFile(join(backendRoot, 'storage', 'stories', '22.txt'), 'utf8')).resolves.toBe('CONTENT-TWO');
    } finally {
      await rm(backendRoot, { recursive: true, force: true });
    }
  });
});

describe('importStoriesFromCsv', () => {
  it('upserts stories metadata only and does not access storyContent', async () => {
    const csv = [
      'product_id,title,authors,original_price,current_price,quantity,category,n_review,avg_rating,pages,manufacturer,cover_link,discount',
      '501,Story X,Author X,200,150,10,Novel,999,4.9,300,Pub,https://example.com/x.jpg,25',
    ].join('\n');

    const upsertCalls: any[] = [];

    const prismaMock = {
      story: {
        upsert: jest.fn(async (args) => {
          upsertCalls.push(args);
          return { id: 'story-501', productId: 501 };
        }),
      },
      $transaction: jest.fn(async (callback) => callback({ story: { upsert: prismaMock.story.upsert } })),
    } as any;

    const count = await importStoriesFromCsv(prismaMock, csv, new Map([['501', 'storage/stories/501.txt']]));

    expect(count).toBe(1);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.story.upsert).toHaveBeenCalledTimes(1);

    const call = upsertCalls[0];
    expect(call.where).toEqual({ productId: 501 });
    expect(call.create.contentPath).toBe('storage/stories/501.txt');
    expect(call.update.contentPath).toBe('storage/stories/501.txt');
    expect(call.update.averageRating).toBe(0);
    expect(call.update.reviewCount).toBe(0);
    expect(call.update.externalAverageRating).toBe(0);
    expect(call.update.externalReviewCount).toBe(0);

    const serializedCall = JSON.stringify(call);
    expect(serializedCall).not.toContain('storyContent');
  });
});

describe('buildContentPathMatchReport', () => {
  it('matches .txt files by normalized title and author', async () => {
    const backendRoot = await mkdtemp(join(tmpdir(), 'import-books-match-'));
    const outputDir = join(backendRoot, 'output');

    try {
      await mkdir(outputDir, { recursive: true });
      await writeFile(join(outputDir, 'Toi thay hoa vang tren co xanh - Nguyen Nhat Anh.txt'), 'dummy', 'utf8');

      const stories = parseStoryRows(
        [
          'product_id,title,authors,original_price,current_price,quantity,category,n_review,avg_rating,pages,manufacturer,cover_link,discount',
          '900,Tôi thấy hoa vàng trên cỏ xanh,Nguyễn Nhật Ánh,100,90,2,Literature,5,4.5,120,Pub,https://example.com/c.jpg,10',
        ].join('\n'),
        new Map(),
      );

      const report = await buildContentPathMatchReport(outputDir, stories);

      expect(report.matched).toEqual([
        {
          productId: 900,
          title: 'Tôi thấy hoa vàng trên cỏ xanh',
          authors: 'Nguyễn Nhật Ánh',
          fileName: 'Toi thay hoa vang tren co xanh - Nguyen Nhat Anh.txt',
        },
      ]);
      expect(report.ambiguous).toHaveLength(0);
      expect(report.missing).toHaveLength(0);
    } finally {
      await rm(backendRoot, { recursive: true, force: true });
    }
  });
});
