import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, normalize, resolve, sep } from 'node:path';
import type { R2ReadOutcome } from './story-content-r2';

export function buildStoredStoryContentPath(productId: number): string {
  return `storage/stories/${productId}.txt`;
}

export type StoryContentReader = { read(relativePath: string): Promise<string | null> };
export type StoryContentLogger = Pick<Console, 'warn' | 'error'>;

type CreateStoryContentReaderDeps = {
  r2Reader?: { read(key: string): Promise<R2ReadOutcome> } | null;
  logger?: StoryContentLogger;
  backendRoot?: string;
};

const DEFAULT_BACKEND_ROOT = resolve(process.cwd());

export function resolveStoryContentPath(
  relativePath: string,
  backendRoot = DEFAULT_BACKEND_ROOT,
): string {
  if (isAbsolute(relativePath)) {
    throw new Error('Story content path must be relative');
  }

  const normalizedRelativePath = normalize(relativePath);
  const storyStorageRoot = resolve(backendRoot, 'storage', 'stories');
  const absolutePath = resolve(backendRoot, normalizedRelativePath);

  const insideStoryStorage =
    absolutePath === storyStorageRoot || absolutePath.startsWith(`${storyStorageRoot}${sep}`);

  if (!insideStoryStorage) {
    throw new Error('Story content path must stay inside storage/stories');
  }

  return absolutePath;
}

export async function computeStoryContentHash(path: string): Promise<string> {
  const content = await readFile(path);
  return createHash('sha256').update(content).digest('hex');
}

export async function copyStoryContentToStorage(
  sourcePath: string,
  productId: number,
  backendRoot = DEFAULT_BACKEND_ROOT,
): Promise<string> {
  const relativePath = buildStoredStoryContentPath(productId);
  const destinationPath = resolveStoryContentPath(relativePath, backendRoot);

  await mkdir(dirname(destinationPath), { recursive: true });
  await copyFile(sourcePath, destinationPath);

  return relativePath;
}

export async function readStoryContentFromStorage(
  relativePath: string,
  backendRoot = DEFAULT_BACKEND_ROOT,
): Promise<string | null> {
  const absolutePath = resolveStoryContentPath(relativePath, backendRoot);

  try {
    return await readFile(absolutePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

export function createStoryContentReader(deps: CreateStoryContentReaderDeps = {}): StoryContentReader {
  const logger = deps.logger ?? console;
  const backendRoot = deps.backendRoot ?? DEFAULT_BACKEND_ROOT;

  return {
    async read(relativePath: string): Promise<string | null> {
      if (!deps.r2Reader) {
        return readStoryContentFromStorage(relativePath, backendRoot);
      }

      const outcome = await deps.r2Reader.read(relativePath);

      if (outcome.kind === 'hit') {
        return outcome.content;
      }

      if (outcome.kind === 'not_found') {
        logger.warn(`[story-content] R2 miss for ${relativePath}; trying local fallback`);
        return readStoryContentFromStorage(relativePath, backendRoot);
      }

      logger.error(`[story-content] R2 ${outcome.errorType} for ${relativePath}: ${outcome.message}`);
      logger.warn(`[story-content] local fallback for ${relativePath}`);
      return readStoryContentFromStorage(relativePath, backendRoot);
    },
  };
}
