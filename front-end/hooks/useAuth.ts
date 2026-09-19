"use client";

import { useAuthContext } from "@/context/AuthContext";

/**
 * useAuth()
 * Reusable hook exposing identity + session actions.
 * Usage:
 *   const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuthContext();
  return { user, isAuthenticated, isLoading, login, logout };
}
