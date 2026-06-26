import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  buildStoredStoryContentPath,
  computeStoryContentHash,
  copyStoryContentToStorage,
  createStoryContentReader,
  readStoryContentFromStorage,
  resolveStoryContentPath,
} from './story-content-storage';

describe('story-content-storage', () => {
  let backendRoot: string;

  beforeEach(async () => {
    backendRoot = await mkdtemp(join(tmpdir(), 'story-storage-'));
  });

  afterEach(async () => {
    await rm(backendRoot, { recursive: true, force: true });
  });

  it('builds deterministic relative storage paths from product id', () => {
    expect(buildStoredStoryContentPath(12345)).toBe('storage/stories/12345.txt');
  });

  it('copies content files into storage/stories and returns a relative path', async () => {
    const source = join(backendRoot, 'source.txt');
    await writeFile(source, 'Nội dung truyện', 'utf8');

    const relativePath = await copyStoryContentToStorage(source, 12345, backendRoot);

    expect(relativePath).toBe('storage/stories/12345.txt');
    await expect(readFile(join(backendRoot, relativePath), 'utf8')).resolves.toBe('Nội dung truyện');
  });

  it('reads content from a safe storage-relative path', async () => {
    const source = join(backendRoot, 'source.txt');
    await writeFile(source, 'Chương 1', 'utf8');
    const relativePath = await copyStoryContentToStorage(source, 10, backendRoot);

    await expect(readStoryContentFromStorage(relativePath, backendRoot)).resolves.toBe('Chương 1');
  });

  it('returns null when the storage file does not exist', async () => {
    await expect(readStoryContentFromStorage('storage/stories/missing.txt', backendRoot)).resolves.toBeNull();
  });

  it('returns R2 content before checking local storage', async () => {
    const reader = createStoryContentReader({
      r2Reader: { read: jest.fn().mockResolvedValue({ kind: 'hit', content: 'R2 content' }) },
      logger: { warn: jest.fn(), error: jest.fn() },
      backendRoot,
    });

    await expect(reader.read('storage/stories/10.txt')).resolves.toBe('R2 content');
  });

  it('falls back to local storage when R2 reports not_found', async () => {
    const relativePath = 'storage/stories/10.txt';
    await mkdir(dirname(join(backendRoot, relativePath)), { recursive: true });
    await writeFile(join(backendRoot, relativePath), 'Local content', 'utf8');

    const reader = createStoryContentReader({
      r2Reader: { read: jest.fn().mockResolvedValue({ kind: 'not_found' }) },
      logger: { warn: jest.fn(), error: jest.fn() },
      backendRoot,
    });

    await expect(reader.read(relativePath)).resolves.toBe('Local content');
  });

  it('logs and falls back to local storage when R2 auth fails', async () => {
    const warn = jest.fn();
    const error = jest.fn();
    const relativePath = 'storage/stories/10.txt';
    await mkdir(dirname(join(backendRoot, relativePath)), { recursive: true });
    await writeFile(join(backendRoot, relativePath), 'Local content', 'utf8');

    const reader = createStoryContentReader({
      r2Reader: {
        read: jest.fn().mockResolvedValue({
          kind: 'error',
          errorType: 'auth_error',
          message: 'Access denied',
        }),
      },
      logger: { warn, error },
      backendRoot,
    });

    await expect(reader.read(relativePath)).resolves.toBe('Local content');
    expect(error).toHaveBeenCalledWith(expect.stringContaining('auth_error'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('local fallback'));
  });

  it('rejects absolute paths and paths outside storage/stories', () => {
    expect(() => resolveStoryContentPath('/tmp/story.txt', backendRoot)).toThrow('Story content path must be relative');
    expect(() => resolveStoryContentPath('../outside.txt', backendRoot)).toThrow('Story content path must stay inside storage/stories');
    expect(() => resolveStoryContentPath('storage/../.env', backendRoot)).toThrow('Story content path must stay inside storage/stories');
    expect(() => resolveStoryContentPath('storage/other.txt', backendRoot)).toThrow('Story content path must stay inside storage/stories');
    expect(() => resolveStoryContentPath('data/raw/books/output/story.txt', backendRoot)).toThrow('Story content path must stay inside storage/stories');
  });

  it('computes stable sha256 content hashes', async () => {
    const source = join(backendRoot, 'source.txt');
    await writeFile(source, 'Nội dung truyện', 'utf8');

    await expect(computeStoryContentHash(source)).resolves.toBe(
      '900555d7e2bcf573f374e2d494c08266d86fef10cedf0b6d105e8ef75e2589d0',
    );
  });
});
