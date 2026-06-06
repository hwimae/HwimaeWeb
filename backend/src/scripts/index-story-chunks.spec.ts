import {
  buildIndexMetadataUpdateData,
  buildStoryIndexWhere,
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
