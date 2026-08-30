/**
 * Lightweight error reporting utility.
 *
 * Always logs to console.error. If NEXT_PUBLIC_SENTRY_DSN is configured,
 * sends a minimal event to the Sentry envelope endpoint (no SDK required).
 *
 * To upgrade to full Sentry SDK later, replace this file's implementation
 * with Sentry.captureException() — the call-sites stay the same.
 */

interface ErrorContext {
  componentStack?: string;
  digest?: string;
  tags?: Record<string, string>;
  [key: string]: unknown;
}

export function reportError(error: unknown, context?: ErrorContext): void {
  // Always log locally
  console.error("[PRO ALUMN] Unhandled error:", error, context);

  const dsn = typeof window !== "undefined"
    ? (window as unknown as { __NEXT_DATA__?: { props?: { pageProps?: { sentryDsn?: string } } } }).__NEXT_DATA__?.props?.pageProps?.sentryDsn ?? process.env.NEXT_PUBLIC_SENTRY_DSN
    : process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) return;

  try {
    const dsnUrl = new URL(dsn);
    const projectId = dsnUrl.pathname.replace("/", "");
    const envelopeUrl = `${dsnUrl.protocol}//${dsnUrl.host}/api/${projectId}/envelope/`;

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    const event = {
      event_id: crypto.randomUUID().replace(/-/g, ""),
      timestamp: new Date().toISOString(),
      platform: "javascript",
      level: "error",
      logger: "pro-alumn.error-boundary",
      environment: process.env.NODE_ENV || "development",
      exception: {
        values: [
          {
            type: error instanceof Error ? error.constructor.name : "Error",
            value: errorMessage,
            stacktrace: errorStack
              ? { frames: parseStackFrames(errorStack) }
              : undefined,
          },
        ],
      },
      tags: {
        ...context?.tags,
        ...(context?.digest ? { digest: context.digest } : {}),
      },
      extra: {
        componentStack: context?.componentStack,
      },
    };

    const header = JSON.stringify({
      event_id: event.event_id,
      dsn,
      sent_at: event.timestamp,
    });
    const itemHeader = JSON.stringify({ type: "event" });
    const body = `${header}\n${itemHeader}\n${JSON.stringify(event)}`;

    // Fire-and-forget; don't let reporting failures cascade
    if (typeof fetch !== "undefined") {
      fetch(envelopeUrl, {
        method: "POST",
        body,
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
      }).catch(() => {
        // Silently swallow — we already logged to console
      });
    }
  } catch {
    // Reporting itself failed — already logged to console above
  }
}

/** Minimal stack-frame parser for Sentry's expected format */
function parseStackFrames(stack: string): Array<{ filename?: string; function?: string; lineno?: number; colno?: number }> {
  return stack
    .split("\n")
    .slice(1, 10) // First 10 frames, skip the error message line
    .map((line) => {
      const match = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/);
      if (match) {
        return {
          function: match[1],
          filename: match[2],
          lineno: parseInt(match[3], 10),
          colno: parseInt(match[4], 10),
        };
      }
      const simpleMatch = line.match(/at\s+(.+):(\d+):(\d+)/);
      if (simpleMatch) {
        return {
          filename: simpleMatch[1],
          lineno: parseInt(simpleMatch[2], 10),
          colno: parseInt(simpleMatch[3], 10),
        };
      }
      return { function: line.trim() };
    });
}
