/**
 * Error reporting utility powered by @sentry/browser.
 *
 * Always logs to console.error locally. If NEXT_PUBLIC_SENTRY_DSN is configured,
 * initializes @sentry/browser and dispatches telemetry to Sentry.
 */

import * as Sentry from "@sentry/browser";

let sentryInitialized = false;

export interface ErrorContext {
  componentStack?: string;
  digest?: string;
  tags?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Initializes Sentry client SDK if NEXT_PUBLIC_SENTRY_DSN is present.
 * Safe to call multiple times (idempotent).
 */
export function initSentry(): void {
  if (sentryInitialized || typeof window === "undefined") return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
    });
    sentryInitialized = true;
  } catch (err) {
    console.warn("[Sentry] Initialization warning:", err);
  }
}

/**
 * Global unhandled error reporter used across React ErrorBoundaries and API catch blocks.
 */
export function reportError(error: unknown, context?: ErrorContext): void {
  // Always log locally to console
  console.error("[PRO ALUMN] Unhandled error:", error, context);

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn || typeof window === "undefined") return;

  try {
    if (!sentryInitialized) {
      initSentry();
    }

    Sentry.captureException(error, {
      extra: {
        componentStack: context?.componentStack,
        digest: context?.digest,
        ...context,
      },
      tags: context?.tags,
    });
  } catch {
    // Fallback: reporting failure should never crash the user session
  }
}
