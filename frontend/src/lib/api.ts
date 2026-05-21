const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Parser<T> = (input: unknown) => T;

function parseWithOptionalParser<T>(input: unknown, parser?: Parser<T>): T {
  return parser ? parser(input) : (input as T);
}

export async function apiGet<T>(
  path: string,
  token?: string,
  parser?: Parser<T>,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
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
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`POST ${path} failed with status ${response.status}`);
  }

  const json = (await response.json()) as unknown;
  return parseWithOptionalParser(json, parser);
}
