export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Parser<T> = (input: unknown) => T;

export type ApiRequestOptions = {
  signal?: AbortSignal;
  cache?: RequestCache;
  next?: { revalidate?: number };
};

export class ApiError extends Error {
  readonly name = "ApiError";

  constructor(
    public readonly method: string,
    public readonly path: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function parseWithOptionalParser<T>(input: unknown, parser?: Parser<T>): T {
  return parser ? parser(input) : (input as T);
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const json = (await response.json()) as unknown;
    if (json && typeof json === "object" && typeof (json as { message?: unknown }).message === "string") {
      return (json as { message: string }).message;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function buildGetRequestInit(token?: string, options: ApiRequestOptions = {}): RequestInit & { next?: { revalidate?: number } } {
  const cacheOptions = options.next ? { next: options.next } : { cache: options.cache ?? "no-store" };

  return {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: options.signal,
    ...cacheOptions,
  };
}

export async function apiGet<T>(
  path: string,
  token?: string,
  parser?: Parser<T>,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, buildGetRequestInit(token, options));

  if (!response.ok) {
    const fallback = `GET ${path} failed with status ${response.status}`;
    throw new ApiError("GET", path, response.status, await readErrorMessage(response, fallback));
  }

  const json = (await response.json()) as unknown;
  return parseWithOptionalParser(json, parser);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string,
  parser?: Parser<T>,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!response.ok) {
    const fallback = `POST ${path} failed with status ${response.status}`;
    throw new ApiError("POST", path, response.status, await readErrorMessage(response, fallback));
  }

  const json = (await response.json()) as unknown;
  return parseWithOptionalParser(json, parser);
}
