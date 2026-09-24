"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import { installAuthFetchInterceptor, resetAuthExpiredFlag } from "@/lib/httpInterceptor";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { hydrateFromStorage, loginUser, logoutUser, updateUserCompany, type UserData, type UserCompanyInfo } from "@/lib/authSlice";

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
  // Ensures a dead session only triggers ONE logout/redirect, even if many
  // requests 401 at the same time.
  const sessionExpiredHandled = useRef(false);

  useEffect(() => {
    installAuthFetchInterceptor();
  }, []);

  // Restore the session from localStorage (Redux authSlice) - the same
  // approach as the TBGS Approval app. No httpOnly cookie required.
  useEffect(() => {
    dispatch(hydrateFromStorage());
  }, [dispatch]);

  const fetchPermissions = useCallback(async (): Promise<{ permissions: Permission[]; companies: UserCompanyInfo[] }> => {
    try {
      const res = await fetch(`${API_URL}/auth/permissions`, { credentials: "include" });
      if (!res.ok) return { permissions: [], companies: [] };
      const json = await res.json();
      const permissions: Permission[] = Array.isArray(json?.data) ? json.data : [];
      const companies: UserCompanyInfo[] = Array.isArray(json?.companies) ? json.companies : [];
      return { permissions, companies };
    } catch {
      return { permissions: [], companies: [] };
    }
  }, []);

  const applyPermissions = useCallback((perms: Permission[]) => {
    setPermissions(perms);
    try {
      localStorage.setItem("permissions", JSON.stringify(perms));
    } catch {}
  }, []);

  const refreshPermissions = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      // No session -> nothing to load. Resolve immediately so the guard can
      // redirect instead of spinning on a doomed API call.
      setPermissions([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { permissions, companies } = await fetchPermissions();
      setPermissions(permissions);
      if (companies.length > 0) dispatch(updateUserCompany(companies));
    } finally {
      setIsLoading(false);
    }
  }, [fetchPermissions, dispatch]);

  // Restore the session from localStorage, then load the role's permissions
  // exactly once. If there is no valid session we resolve immediately.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      dispatch(hydrateFromStorage());
      await new Promise((r) => setTimeout(r, 0));
      if (cancelled) return;
      const { permissions, companies } = await fetchPermissions();
      setPermissions(permissions);
      if (companies.length > 0) dispatch(updateUserCompany(companies));
      setIsLoading(false);
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [fetchPermissions, dispatch]);

  // `user-data-updated` is emitted ONLY on a successful login now (logout no
  // longer emits it), so reacting to it just loads permissions after login -
  // it can no longer feed a logout loop. refreshPermissions is also a no-op
  // when there is no token.
  useEffect(() => {
    const onUserDataUpdated = () => {
      refreshPermissions();
    };
    const onSessionExpired = () => {
      if (sessionExpiredHandled.current) return;
      sessionExpiredHandled.current = true;
      // Thunk clears local state + cookies then hard-redirects to /login.
      dispatch(logoutUserThunk());
    };

    window.addEventListener("user-data-updated", onUserDataUpdated);
    window.addEventListener("auth-session-expired", onSessionExpired);
    return () => {
      window.removeEventListener("user-data-updated", onUserDataUpdated);
      window.removeEventListener("auth-session-expired", onSessionExpired);
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
        resetAuthExpiredFlag();
        sessionExpiredHandled.current = false;
        await refreshPermissions();
        return { success: true };
      }

      return { success: false, message: (result.payload as string) || "Login failed" };
    },
    [dispatch, refreshPermissions]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutUserThunk());
  }, [dispatch]);

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