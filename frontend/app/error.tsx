"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import { reportError } from "@/lib/error-reporting";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError(error, { digest: error.digest, tags: { boundary: "app" } });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper-50 px-6">
      <div className="max-w-md text-center">
        <AlertTriangle size={28} className="mx-auto text-clay-500" />
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-clay-500">
          Unexpected interruption
        </p>
        <h1 className="mt-3 font-display text-4xl">
          That page needs another try.
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink-900/60">
          The app could not finish loading this view. This error has been logged.
        </p>
        <Button type="button" className="mt-7" onClick={reset}>
          Try again
        </Button>
        {error.digest && (
          <p className="mt-4 font-mono text-[10px] text-slate-400">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
