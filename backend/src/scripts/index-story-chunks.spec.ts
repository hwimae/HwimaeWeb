import {
  buildIndexMetadataUpdateData,
  buildStoryIndexWhere,
  indexStoryCandidate,
  parseIndexStoryChunksArgs,
} from './index-story-chunks';

describe('parseIndexStoryChunksArgs', () => {
  it('uses defaults when no options are provided', () => {
    expect(parseIndexStoryChunksArgs([])).toEqual({ limit: 20, force: false, dryRun: false });
  });

  it('parses limit, after cursor, force flag, and dry-run flag', () => {
    expect(parseIndexStoryChunksArgs(['--limit', '100', '--after', 'story-1', '--force', '--dry-run'])).toEqual({
      limit: 100,
      after: 'story-1',
      force: true,
      dryRun: true,
    });
  });

  it('keeps the previous positional limit syntax', () => {
    expect(parseIndexStoryChunksArgs(['5'])).toEqual({ limit: 5, force: false, dryRun: false });
  });

  it('rejects invalid limits', () => {
    expect(() => parseIndexStoryChunksArgs(['--limit', '0'])).toThrow('Limit must be an integer between 1 and 500');
    expect(() => parseIndexStoryChunksArgs(['--limit', '501'])).toThrow('Limit must be an integer between 1 and 500');
  });
});

describe('buildIndexMetadataUpdateData', () => {
  it('initializes contentUpdatedAt with the same timestamp when metadata is missing', () => {
    const indexedAt = new Date('2026-06-03T10:00:00.000Z');

    expect(buildIndexMetadataUpdateData(null, indexedAt)).toEqual({
      contentIndexedAt: indexedAt,
      contentUpdatedAt: indexedAt,
    });
  });

  it('keeps existing contentUpdatedAt unchanged by only updating contentIndexedAt', () => {
    const contentUpdatedAt = new Date('2026-06-02T10:00:00.000Z');
    const indexedAt = new Date('2026-06-03T10:00:00.000Z');

    expect(buildIndexMetadataUpdateData(contentUpdatedAt, indexedAt)).toEqual({
      contentIndexedAt: indexedAt,
    });
  });
});

describe('buildStoryIndexWhere', () => {
  it('filters stories that have content path by default', () => {
    expect(buildStoryIndexWhere({ limit: 20, force: false, dryRun: false })).toEqual({
      contentPath: { not: null },
    });
  });

  it('keeps the same simple where when force is enabled', () => {
    expect(buildStoryIndexWhere({ limit: 20, force: true, dryRun: false })).toEqual({
      contentPath: { not: null },
    });
  });

  it('adds cursor filter when after is provided', () => {
    expect(buildStoryIndexWhere({ limit: 20, after: 'story-1', force: false, dryRun: false })).toEqual({
      contentPath: { not: null },
      id: { gt: 'story-1' },
    });
  });
});

describe('indexStoryCandidate', () => {
  it('skips a story when the shared content reader returns null', async () => {
    const result = await indexStoryCandidate({
      prisma: {
        $transaction: jest.fn(),
        story: { update: jest.fn() },
      } as never,
      aiClient: { embedText: jest.fn() } as never,
      storyContentReader: { read: jest.fn().mockResolvedValue(null) },
      story: {
        id: 'story-1',
        title: 'Missing content',
        contentPath: 'storage/stories/missing.txt',
        contentUpdatedAt: null,
      },
    });

    expect(result).toBe('skipped_missing_content');
  });

  it('rejects passage embeddings with the wrong dimension before starting a transaction', async () => {
    const prisma = {
      $transaction: jest.fn(async (callback) =>
        callback({
          storyChunk: { deleteMany: jest.fn() },
          $executeRaw: jest.fn(),
        }),
      ),
      story: { update: jest.fn().mockResolvedValue(undefined) },
    };

    await expect(
      indexStoryCandidate({
        prisma: prisma as never,
        aiClient: { embedText: jest.fn().mockResolvedValue([0.1, 0.2]) } as never,
        storyContentReader: { read: jest.fn().mockResolvedValue('Chương 1\nChương 2') },
        story: {
          id: 'story-1',
          title: 'Indexed content',
          contentPath: 'storage/stories/1.txt',
          contentUpdatedAt: new Date('2026-06-29T00:00:00.000Z'),
        },
      }),
    ).rejects.toThrow('Expected embedding dimension 384, received 2');

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('uses one raw insert statement for many chunks to keep the transaction short', async () => {
    const tx = {
      storyChunk: { deleteMany: jest.fn() },
      $executeRaw: jest.fn().mockResolvedValue(undefined),
    };
    const prisma = {
      $transaction: jest.fn(async (callback) => callback(tx)),
      story: { update: jest.fn().mockResolvedValue(undefined) },
    };
    const longContent = `${'A'.repeat(2600)}\n${'B'.repeat(2600)}`;

    const result = await indexStoryCandidate({
      prisma: prisma as never,
      aiClient: { embedText: jest.fn().mockResolvedValue(new Array(384).fill(0.1)) } as never,
      storyContentReader: { read: jest.fn().mockResolvedValue(longContent) },
      story: {
        id: 'story-1',
        title: 'Indexed content',
        contentPath: 'storage/stories/1.txt',
        contentUpdatedAt: new Date('2026-06-26T00:00:00.000Z'),
      },
    });

    expect(result).toBe('indexed');
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('indexes a story when the shared content reader returns text', async () => {
    const result = await indexStoryCandidate({
      prisma: {
        $transaction: jest.fn(async (callback) =>
          callback({
            storyChunk: { deleteMany: jest.fn() },
            $executeRaw: jest.fn(),
          }),
        ),
        story: { update: jest.fn().mockResolvedValue(undefined) },
      } as never,
      aiClient: { embedText: jest.fn().mockResolvedValue(new Array(384).fill(0.1)) } as never,
      storyContentReader: { read: jest.fn().mockResolvedValue('Chương 1\nChương 2') },
      story: {
        id: 'story-1',
        title: 'Indexed content',
        contentPath: 'storage/stories/1.txt',
        contentUpdatedAt: new Date('2026-06-26T00:00:00.000Z'),
      },
    });

    expect(result).toBe('indexed');
  });
});
