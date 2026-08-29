"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/error-reporting";

/**
 * Global error boundary — catches errors in the root layout itself
 * (AuthProvider, ThemeProvider, font loading, etc.).
 *
 * Unlike error.tsx, this must render its own <html>/<body> because the
 * root layout has failed and won't wrap it.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest, tags: { boundary: "global" } });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: "#0f172a",
          color: "#e2e8f0",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center", padding: "2rem" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 1.5rem",
              borderRadius: "50%",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            ⚠️
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              margin: "0 0 0.75rem",
              letterSpacing: "-0.025em",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#94a3b8",
              lineHeight: 1.6,
              margin: "0 0 2rem",
            }}
          >
            The application encountered an unexpected error. This has been
            logged automatically. Please try reloading the page.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#fff",
              backgroundColor: "#2563eb",
              border: "none",
              borderRadius: "0.75rem",
              cursor: "pointer",
              transition: "background-color 0.15s",
            }}
            onMouseOver={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = "#1d4ed8")
            }
            onMouseOut={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = "#2563eb")
            }
          >
            Reload page
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.6875rem",
                fontFamily: "monospace",
                color: "#475569",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
