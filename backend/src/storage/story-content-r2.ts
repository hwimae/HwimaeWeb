import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { AppConfig } from '../config';

export type R2StoryContentConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

export type R2ReadOutcome =
  | { kind: 'hit'; content: string }
  | { kind: 'not_found' }
  | { kind: 'error'; errorType: 'config_error' | 'auth_error' | 'transient_error'; message: string };

export function buildR2Endpoint(accountId: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export function getR2StoryContentConfig(
  config: Pick<AppConfig, 'r2AccountId' | 'r2AccessKeyId' | 'r2SecretAccessKey' | 'r2Bucket'>,
): R2StoryContentConfig | null {
  const accountId = config.r2AccountId?.trim();
  const accessKeyId = config.r2AccessKeyId?.trim();
  const secretAccessKey = config.r2SecretAccessKey?.trim();
  const bucket = config.r2Bucket?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
  };
}

type R2LikeError = Error & {
  name?: string;
  $metadata?: { httpStatusCode?: number };
};

function isR2LikeError(error: unknown): error is R2LikeError {
  return error instanceof Error;
}

export function createR2StoryContentReader(config: R2StoryContentConfig) {
  const client = new S3Client({
    region: 'auto',
    endpoint: buildR2Endpoint(config.accountId),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return {
    async read(key: string): Promise<R2ReadOutcome> {
      try {
        const response = await client.send(
          new GetObjectCommand({
            Bucket: config.bucket,
            Key: key,
          }),
        );
        const content = await response.Body?.transformToString();

        if (!content) {
          return {
            kind: 'error',
            errorType: 'transient_error',
            message: 'R2 returned an empty body',
          };
        }

        return { kind: 'hit', content };
      } catch (error) {
        if (isR2LikeError(error) && (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404)) {
          return { kind: 'not_found' };
        }

        if (isR2LikeError(error) && (error.$metadata?.httpStatusCode === 401 || error.$metadata?.httpStatusCode === 403)) {
          return {
            kind: 'error',
            errorType: 'auth_error',
            message: error.message,
          };
        }

        return {
          kind: 'error',
          errorType: 'transient_error',
          message: error instanceof Error ? error.message : 'Unknown R2 read error',
        };
      }
    },
  };
}
