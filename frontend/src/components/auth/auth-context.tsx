"use client";

import React, { createContext, useContext } from "react";

import type { AuthUser } from "@/lib/auth";

export type AuthContextValue = {
  user: AuthUser | null;
  isCheckingAuth: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue>({ user: null, isCheckingAuth: false, logout: () => undefined });

export function AuthContextProvider({ value, children }: { value: AuthContextValue; children: React.ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
