"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import { installAuthFetchInterceptor } from "@/lib/httpInterceptor";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { hydrateFromStorage, loginUser, logoutUser, type UserData } from "@/lib/authSlice";

export interface AuthUser {
  id: number | string;
  loginName: string;
  role: string;   // display only - never used for access decisions
  roleId: number;  // the ONLY value used for access decisions
}

export interface Permission {
  linkId: number;
  linkName: string;
  pageAction: string;
  linkLocation: string; // e.g. "/company-master" - matches Next.js pathname
  redirectionType: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  permissions: Permission[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (loginName: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  /** true if the caller's role is permitted to access `pathname` */
  hasPermission: (pathname: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizePath(path?: string | null): string | null {
  if (!path) return null;
  const withoutQuery = path.split("?")[0];
  const trimmed = withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, "") : withoutQuery;
  return trimmed.toLowerCase();
}

function toAuthUser(user: UserData): AuthUser {
  return {
    id: user.id ?? user.LOGIN_ID ?? "",
    loginName: user.loginName ?? user.LOGIN_NAME ?? "",
    role: user.role ?? user.ROLE ?? "User",
    roleId: Number(user.roleId ?? user.ROLE_ID ?? 0),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const authState = useAppSelector((s) => s.auth);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    installAuthFetchInterceptor();
  }, []);

  // Restore the session from localStorage (Redux authSlice) - the same
  // approach as the TBGS Approval app. No httpOnly cookie required.
  useEffect(() => {
    dispatch(hydrateFromStorage());
  }, [dispatch]);

  const fetchPermissions = useCallback(async (): Promise<Permission[]> => {
    try {
      const res = await fetch(`${API_URL}/auth/permissions`, { credentials: "include" });
      if (!res.ok) return [];
      const json = await res.json();
      return json?.data ?? [];
    } catch {
      return [];
    }
  }, []);

  const refreshPermissions = useCallback(async () => {
    const perms = await fetchPermissions();
    setPermissions(perms);
  }, [fetchPermissions]);

  // Wait for the localStorage hydration to settle, then load permissions
  // for whatever user (if any) the session restored.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      await new Promise((r) => setTimeout(r, 0));
      if (cancelled) return;
      setPermissions(await fetchPermissions());
      setIsLoading(false);
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [fetchPermissions]);

  // React to Redux login/logout events, and to the fetch interceptor
  // telling us the session died mid-way through.
  useEffect(() => {
    const refresh = () => {
      refreshPermissions();
    };
    const onSessionExpired = () => {
      dispatch(logoutUser());
      router.push("/login");
    };
    const onForbidden = () => router.push("/unauthorized");

    window.addEventListener("user-data-updated", refresh);
    window.addEventListener("auth-session-expired", onSessionExpired);
    window.addEventListener("auth-forbidden", onForbidden);
    return () => {
      window.removeEventListener("user-data-updated", refresh);
      window.removeEventListener("auth-session-expired", onSessionExpired);
      window.removeEventListener("auth-forbidden", onForbidden);
    };
  }, [dispatch, refreshPermissions, router]);

  const user = useMemo<AuthUser | null>(
    () => (authState.user ? toAuthUser(authState.user) : null),
    [authState.user]
  );

  const login = useCallback(
    async (loginName: string, password: string) => {
      const result = await dispatch(loginUser({ LOGIN_NAME: loginName, PASSWORD: password }));

      if (loginUser.fulfilled.match(result)) {
        await refreshPermissions();
        return { success: true };
      }

      return { success: false, message: (result.payload as string) || "Login failed" };
    },
    [dispatch, refreshPermissions]
  );

  const logout = useCallback(async () => {
    dispatch(logoutUser());
    router.push("/login");
  }, [dispatch, router]);

  const hasPermission = useCallback(
    (pathname: string) => {
      const target = normalizePath(pathname);
      if (!target) return false;
      return permissions.some((p) => {
        const allowed = normalizePath(p.linkLocation);
        if (!allowed) return false;
        if (allowed === "/") return target === "/"; // Strict match for root, prevent wildcard
        return target === allowed || target.startsWith(`${allowed}/`);
      });
    },
    [permissions]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      permissions,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshPermissions,
      hasPermission,
    }),
    [user, permissions, isLoading, login, logout, refreshPermissions, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within an AuthProvider");
  return ctx;
}