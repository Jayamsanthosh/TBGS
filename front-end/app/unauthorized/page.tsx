"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { getLandingPath } from "@/lib/navigationOrigin";

export default function UnauthorizedPage() {
  const { logout } = useAuth();
  const { permissions, isLoading } = usePermission();
  const landing = isLoading ? "/" : getLandingPath(permissions);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <ShieldAlert className="h-16 w-16 text-destructive" />
      <h1 className="text-2xl font-semibold">Access Denied</h1>
      <p className="max-w-md text-muted-foreground">
        You don&apos;t have permission to view this page. If you believe this is a mistake,
        contact your administrator to review your role&apos;s access.
      </p>
      <div className="flex gap-3">
        <Link
          href={landing}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Back to Home
        </Link>
        <button
          onClick={() => logout()}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}