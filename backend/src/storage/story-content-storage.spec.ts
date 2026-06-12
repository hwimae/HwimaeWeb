import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildStoredStoryContentPath,
  computeStoryContentHash,
  copyStoryContentToStorage,
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
