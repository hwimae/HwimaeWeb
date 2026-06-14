import { apiGet, apiPost } from "./api";
import { getAccessToken } from "./auth";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
};

function requireToken(): string {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn cần đăng nhập bằng tài khoản admin.");
  }

  return token;
}

function isAdminRole(value: unknown): value is AdminUser["role"] {
  return value === "USER" || value === "ADMIN";
}

function isAdminStatus(value: unknown): value is AdminUser["status"] {
  return value === "PENDING" || value === "APPROVED" || value === "REJECTED";
}

function isStrictIsoDateString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

export function parseAdminUser(input: unknown): AdminUser {
  if (!input || typeof input !== "object" || "passwordHash" in input) {
    throw new Error("Invalid admin user payload");
  }

  const value = input as Partial<AdminUser>;
  if (
    typeof value.id !== "string" ||
    typeof value.email !== "string" ||
    typeof value.name !== "string" ||
    !isAdminRole(value.role) ||
    !isAdminStatus(value.status) ||
    !isStrictIsoDateString(value.createdAt) ||
    !isStrictIsoDateString(value.updatedAt)
  ) {
    throw new Error("Invalid admin user payload");
  }

  return value as AdminUser;
}

export function parseAdminUsers(input: unknown): AdminUser[] {
  if (!Array.isArray(input)) {
    throw new Error("Invalid admin users payload");
  }

  return input.map(parseAdminUser);
}

export async function listPendingAdminUsers(): Promise<AdminUser[]> {
  return apiGet("/admin/users?status=PENDING", requireToken(), parseAdminUsers);
}

export async function approveAdminUser(userId: string): Promise<AdminUser> {
  return apiPost(`/admin/users/${userId}/approve`, {}, requireToken(), parseAdminUser);
}

export async function rejectAdminUser(userId: string): Promise<AdminUser> {
  return apiPost(`/admin/users/${userId}/reject`, {}, requireToken(), parseAdminUser);
}
