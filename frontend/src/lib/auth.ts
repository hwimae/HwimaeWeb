export type AuthUserRole = "USER" | "ADMIN";
export type AuthUserStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AuthUserRole;
  status: AuthUserStatus;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

export type RegisterResponse = {
  user: AuthUser;
  message: "Registration pending approval";
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

export function clearAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function isAuthUserRole(value: unknown): value is AuthUserRole {
  return value === "USER" || value === "ADMIN";
}

function isAuthUserStatus(value: unknown): value is AuthUserStatus {
  return value === "PENDING" || value === "APPROVED" || value === "REJECTED";
}

function isAuthUser(input: unknown): input is AuthUser {
  if (!input || typeof input !== "object") {
    return false;
  }

  const value = input as Partial<AuthUser>;
  return (
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    typeof value.name === "string" &&
    isAuthUserRole(value.role) &&
    isAuthUserStatus(value.status)
  );
}

export function parseAuthUser(input: unknown): AuthUser {
  if (!isAuthUser(input)) {
    throw new Error("Invalid auth user payload");
  }

  return input;
}

function isAuthResponse(input: unknown): input is AuthResponse {
  if (!input || typeof input !== "object") {
    return false;
  }

  const value = input as Partial<AuthResponse>;
  return typeof value.accessToken === "string" && isAuthUser(value.user);
}

export function parseAuthResponse(input: unknown): AuthResponse {
  if (!isAuthResponse(input)) {
    throw new Error("Invalid auth response payload");
  }

  return input;
}

export function parseRegisterResponse(input: unknown): RegisterResponse {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid register response payload");
  }

  const value = input as Partial<RegisterResponse>;
  if (!isAuthUser(value.user) || value.message !== "Registration pending approval") {
    throw new Error("Invalid register response payload");
  }

  return { user: value.user, message: value.message };
}
