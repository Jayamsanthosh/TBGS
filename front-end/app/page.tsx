"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { getLandingPath } from "@/lib/navigationOrigin";
import { useAppDispatch } from "@/lib/store";
import { logoutUser } from "@/lib/authSlice";

export default function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { permissions, isLoading: permLoading } = usePermission();

  useEffect(() => {
    if (authLoading || permLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    const landing = getLandingPath(permissions);
    if (landing && landing !== "/") router.replace(landing);
  }, [router, isAuthenticated, authLoading, permissions, permLoading]);

  if (authLoading || permLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated && permissions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-center space-y-4">
          <h1 className="text-lg font-semibold text-foreground">No screens assigned</h1>
          <p className="text-sm text-muted-foreground">
            Your role does not have any page or screen assigned yet. Please contact the administrator.
          </p>
          <button
            onClick={() => {
              dispatch(logoutUser());
              router.push("/login");
            }}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}