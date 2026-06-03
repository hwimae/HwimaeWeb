import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, normalize, resolve, sep } from 'node:path';

export function buildStoredStoryContentPath(productId: number): string {
  return `storage/stories/${productId}.txt`;
}

const DEFAULT_BACKEND_ROOT = resolve(process.cwd());

export function resolveStoryContentPath(
  relativePath: string,
  backendRoot = DEFAULT_BACKEND_ROOT,
): string {
  if (isAbsolute(relativePath)) {
    throw new Error('Story content path must be relative');
  }

  const normalizedRelativePath = normalize(relativePath);
  const storageRoot = resolve(backendRoot, 'storage');
  const absolutePath = resolve(backendRoot, normalizedRelativePath);

  const insideStorage =
    absolutePath === storageRoot || absolutePath.startsWith(`${storageRoot}${sep}`);

  if (!insideStorage) {
    throw new Error('Story content path must stay inside storage');
  }

  return absolutePath;
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
