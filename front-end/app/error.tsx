"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground break-words">{error.message}</p>
      {error.digest ? (
        <p className="text-xs text-muted-foreground/60">Digest: {error.digest}</p>
      ) : null}
      <button
        onClick={reset}
        className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
      >
        Try again
      </button>
    </div>
  );
}
