"use client";

interface SyncProgressBarProps {
  processed: number;
  total: number;
  className?: string;
}

export function SyncProgressBar({ processed, total, className = "" }: SyncProgressBarProps) {
  const percent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  return (
    <div className={`space-y-2 ${className}`} role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-steam-text">
          Sincronizando biblioteca… <span className="font-medium">{processed}</span> de{" "}
          <span className="font-medium">{total}</span> juegos
        </span>
        <span className="shrink-0 tabular-nums text-steam-text-muted">{percent}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-steam-bg-medium"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-steam-link transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
