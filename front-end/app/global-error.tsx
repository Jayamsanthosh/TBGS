"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "3rem 1.5rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Application error
        </h2>
        <p style={{ color: "#666", fontSize: "0.875rem", wordBreak: "break-word" }}>
          {error.message}
        </p>
        {error.digest ? (
          <p style={{ color: "#999", fontSize: "0.75rem" }}>Digest: {error.digest}</p>
        ) : null}
        <button
          onClick={reset}
          style={{
            marginTop: "1.25rem",
            padding: "0.6rem 1.25rem",
            borderRadius: "0.75rem",
            background: "#7c3aed",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.875rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
