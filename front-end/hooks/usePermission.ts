"use client";

import { usePathname } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";

/**
 * usePermission(path?)
 * ---------------------------------------------------------------------
 * Reusable hook for guarding pages or hiding UI elements.
 *
 *   // Guard the current page:
 *   const { allowed, isLoading } = usePermission();
 *
 *   // Check a specific screen (e.g. to hide a sidebar link, or a button
 *   // that navigates elsewhere):
 *   const { allowed } = usePermission("/user-master");
 *
 * NOTE: this is a UX convenience only. The backend's checkPermission
 * middleware is the real authority - even if this hook is bypassed
 * (e.g. via DevTools), every API call for the underlying data will
 * still be rejected with 403 by the server.
 * ---------------------------------------------------------------------
 */
export function usePermission(path?: string) {
  const pathname = usePathname();
  const { hasPermission, isLoading, permissions } = useAuthContext();
  const target = path ?? pathname ?? "/";

  return {
    allowed: hasPermission(target),
    isLoading,
    permissions,
  };
}
