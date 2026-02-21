import { apiRequest } from "./queryClient";
import type { User } from "@shared/schema";

export type AuthUser = Omit<User, "password">;

export async function login(email: string, password: string): Promise<AuthUser> {
  return apiRequest("POST", "/api/auth/login", { email, password });
}

export async function register(data: Record<string, any>): Promise<{ message: string }> {
  return apiRequest("POST", "/api/auth/register", data);
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout", {});
}

export async function getMe(): Promise<AuthUser> {
  return apiRequest("GET", "/api/auth/me");
}
