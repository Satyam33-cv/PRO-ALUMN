import { AlertTriangle } from "lucide-react";

export function ErrorState({ title, body, retry }: { title?: string; body?: string; retry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 border border-clay-500/30 bg-clay-500/5 p-6 sm:p-8">
      <AlertTriangle size={20} className="text-clay-500" strokeWidth={1.6} />
      <div>
        <h3 className="font-display text-2xl text-clay-500">{title ?? "Something went wrong"}</h3>
        {body ? <p className="mt-2 max-w-prose text-sm leading-6 text-ink-900/70">{body}</p> : null}
      </div>
      {retry ? (
        <button onClick={retry} className="text-sm font-semibold text-ink-900 underline decoration-mist-200 underline-offset-4 hover:decoration-brass-500">
          Try again
        </button>
      ) : null}
    </div>
  );
}
