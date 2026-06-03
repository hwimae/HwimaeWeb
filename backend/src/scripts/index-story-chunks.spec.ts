import { buildStoryIndexWhere, parseIndexStoryChunksArgs } from './index-story-chunks';

describe('parseIndexStoryChunksArgs', () => {
  it('uses defaults when no options are provided', () => {
    expect(parseIndexStoryChunksArgs([])).toEqual({ limit: 20, force: false });
  });

  it('parses limit, after cursor, and force flag', () => {
    expect(parseIndexStoryChunksArgs(['--limit', '100', '--after', 'story-1', '--force'])).toEqual({
      limit: 100,
      after: 'story-1',
      force: true,
    });
  });

  it('keeps the previous positional limit syntax', () => {
    expect(parseIndexStoryChunksArgs(['5'])).toEqual({ limit: 5, force: false });
  });

  it('rejects invalid limits', () => {
    expect(() => parseIndexStoryChunksArgs(['--limit', '0'])).toThrow('Limit must be an integer between 1 and 500');
    expect(() => parseIndexStoryChunksArgs(['--limit', '501'])).toThrow('Limit must be an integer between 1 and 500');
  });
});

describe('buildStoryIndexWhere', () => {
  it('skips stories that already have chunks by default', () => {
    expect(buildStoryIndexWhere({ limit: 20, force: false })).toEqual({
      contentPath: { not: null },
      chunks: { none: {} },
    });
  });

  it('includes already indexed stories when force is enabled', () => {
    expect(buildStoryIndexWhere({ limit: 20, force: true })).toEqual({
      contentPath: { not: null },
    });
  });

  it('adds cursor filter when after is provided', () => {
    expect(buildStoryIndexWhere({ limit: 20, after: 'story-1', force: false })).toEqual({
      contentPath: { not: null },
      id: { gt: 'story-1' },
      chunks: { none: {} },
    });
  });
});
