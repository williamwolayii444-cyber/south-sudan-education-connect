import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Inline, retryable error notice for a failed data query. */
export function QueryError({
  error,
  what = "data",
  onRetry,
}: {
  error: unknown;
  what?: string;
  onRetry?: () => void;
}) {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error ?? "Unknown error");

  return (
    <div
      role="alert"
      className="flex flex-wrap items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-destructive">Could not load {what}.</p>
        <p className="mt-0.5 break-words text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw className="size-4" /> Retry
        </Button>
      )}
    </div>
  );
}
