"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { isMenuOpened, ALWAYS_OPEN, getLandingPath } from "@/lib/navigationOrigin";

const PUBLIC_PATHS = ["/login", "/unauthorized", "/403"];

/**
 * AuthGuard
 * ---------------------------------------------------------------------
 * Client-side companion to middleware.ts. middleware.ts already blocks
 * unauthorized navigations at the edge (including a hard refresh or a
 * typed-in URL), so this component's job is just:
 *   - show a loading state while the AuthContext hydrates
 *   - handle the redirect for purely client-side transitions/edge cases
 *   - keep already-logged-in users off the /login screen
 *
 * This is a UX convenience layer only. It is not what stops
 * unauthorized access - the backend API and middleware.ts are.
 * ---------------------------------------------------------------------
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { allowed, isLoading: permLoading, permissions } = usePermission();

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isLoading = authLoading || (!isPublic && permLoading) || (isAuthenticated && permLoading);
  const landing = getLandingPath(permissions);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isPublic) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && pathname === "/login") {
      router.replace(landing);
      return;
    }

    if (isAuthenticated && !isPublic && pathname !== "/" && !allowed) {
      router.replace(landing && landing !== pathname ? landing : "/unauthorized");
      return;
    }

    if (isAuthenticated && !isPublic && pathname !== "/") {
      const isAlwaysOpen = ALWAYS_OPEN.some((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)));
      const fallback = landing && landing !== pathname ? landing : "/unauthorized";
      if (!isAlwaysOpen && !isMenuOpened(pathname)) {
        router.replace(fallback);
      }
    }
  }, [isLoading, isAuthenticated, isPublic, pathname, allowed, landing, permissions, router]);

  if (isLoading && !isPublic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
