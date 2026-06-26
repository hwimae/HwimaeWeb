const sendMock = jest.fn();
const getObjectCommandInputs: Array<unknown> = [];

jest.mock('@aws-sdk/client-s3', () => {
  class GetObjectCommand {
    input: unknown;

    constructor(input: unknown) {
      this.input = input;
      getObjectCommandInputs.push(input);
    }
  }

  class S3Client {
    constructor(_config: unknown) {}

    send(command: unknown) {
      return sendMock(command);
    }
  }

  class S3ServiceException extends Error {
    $metadata: { httpStatusCode?: number };

    constructor({ name, message, statusCode }: { name: string; message: string; statusCode?: number }) {
      super(message);
      this.name = name;
      this.$metadata = statusCode === undefined ? {} : { httpStatusCode: statusCode };
    }
  }

  return { GetObjectCommand, S3Client, S3ServiceException };
});

import { buildR2Endpoint, createR2StoryContentReader, getR2StoryContentConfig } from './story-content-r2';

function buildS3Error(name: string, message: string, statusCode?: number): Error & {
  $metadata?: { httpStatusCode?: number };
} {
  return Object.assign(new Error(message), {
    name,
    ...(statusCode === undefined ? {} : { $metadata: { httpStatusCode: statusCode } }),
  });
}

describe('story-content-r2', () => {
  beforeEach(() => {
    sendMock.mockReset();
    getObjectCommandInputs.length = 0;
  });

  it('builds the Cloudflare R2 endpoint from account id', () => {
    expect(buildR2Endpoint('abc123')).toBe('https://abc123.r2.cloudflarestorage.com');
  });

  it('returns null config when any required R2 env is missing', () => {
    expect(
      getR2StoryContentConfig({
        r2AccountId: 'account',
        r2AccessKeyId: 'access',
        r2SecretAccessKey: '',
        r2Bucket: 'hwimae-story',
      }),
    ).toBeNull();
  });

  it('reads story content from R2', async () => {
    sendMock.mockResolvedValueOnce({
      Body: {
        transformToString: jest.fn().mockResolvedValue('Nội dung từ R2'),
      },
    });

    const reader = createR2StoryContentReader({
      accountId: 'account',
      accessKeyId: 'access',
      secretAccessKey: 'secret',
      bucket: 'hwimae-story',
    });

    await expect(reader.read('storage/stories/1.txt')).resolves.toEqual({
      kind: 'hit',
      content: 'Nội dung từ R2',
    });
    expect(getObjectCommandInputs).toEqual([
      {
        Bucket: 'hwimae-story',
        Key: 'storage/stories/1.txt',
      },
    ]);
  });

  it('maps NoSuchKey to not_found', async () => {
    sendMock.mockRejectedValueOnce(
      buildS3Error('NoSuchKey', 'Missing object', 404),
    );

    const reader = createR2StoryContentReader({
      accountId: 'account',
      accessKeyId: 'access',
      secretAccessKey: 'secret',
      bucket: 'hwimae-story',
    });

    await expect(reader.read('storage/stories/missing.txt')).resolves.toEqual({ kind: 'not_found' });
  });

  it('maps permission errors to auth_error', async () => {
    sendMock.mockRejectedValueOnce(
      buildS3Error('AccessDenied', 'Access denied', 403),
    );

    const reader = createR2StoryContentReader({
      accountId: 'account',
      accessKeyId: 'access',
      secretAccessKey: 'secret',
      bucket: 'hwimae-story',
    });

    await expect(reader.read('storage/stories/forbidden.txt')).resolves.toEqual({
      kind: 'error',
      errorType: 'auth_error',
      message: 'Access denied',
    });
  });
});
