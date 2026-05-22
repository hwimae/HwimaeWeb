export type AuthResponse = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  accessToken: string;
};

const ACCESS_TOKEN_KEY = "accessToken";

export function saveAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

function isAuthResponse(input: unknown): input is AuthResponse {
  if (!input || typeof input !== "object") {
    return false;
  }

  const value = input as Partial<AuthResponse>;
  const user = value.user as Partial<AuthResponse["user"]> | undefined;

  return (
    typeof value.accessToken === "string" &&
    !!user &&
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    typeof user.name === "string"
  );
}

export function parseAuthResponse(input: unknown): AuthResponse {
  if (!isAuthResponse(input)) {
    throw new Error("Invalid auth response payload");
  }

  return input;
}
