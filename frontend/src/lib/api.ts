export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Parser<T> = (input: unknown) => T;

type ApiRequestOptions = {
  signal?: AbortSignal;
};

function parseWithOptionalParser<T>(input: unknown, parser?: Parser<T>): T {
  return parser ? parser(input) : (input as T);
}

export async function apiGet<T>(
  path: string,
  token?: string,
  parser?: Parser<T>,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`);
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
    throw new Error(`POST ${path} failed with status ${response.status}`);
  }

  const json = (await response.json()) as unknown;
  return parseWithOptionalParser(json, parser);
}
