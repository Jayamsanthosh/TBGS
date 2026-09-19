"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { getLandingPath } from "@/lib/navigationOrigin";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { permissions, isLoading: permLoading } = usePermission();

  useEffect(() => {
    if (authLoading || permLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    router.replace(getLandingPath(permissions));
  }, [router, isAuthenticated, authLoading, permissions, permLoading]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}