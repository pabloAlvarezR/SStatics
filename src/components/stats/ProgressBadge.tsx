import type { PlaytimeProgress } from "@/lib/playtime-progress";
import { formatProgressLabel } from "@/lib/playtime-progress";

interface ProgressBadgeProps {
  progress: PlaytimeProgress | null;
  size?: "sm" | "md";
  showRecent?: boolean;
}

export function ProgressBadge({
  progress,
  size = "md",
  showRecent = false,
}: ProgressBadgeProps) {
  if (!progress) return null;

  const isPositive = progress.hoursGained > 0;
  const isNeutral = progress.hoursGained === 0;
  const isNegative = progress.hoursGained < 0;

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : "px-2.5 py-1 text-xs";

  const colorClasses = isPositive
    ? "border-steam-green/40 bg-steam-green/15 text-steam-green"
    : isNegative
      ? "border-red-500/30 bg-red-500/10 text-red-300"
      : "border-steam-border/40 bg-steam-bg-light/30 text-steam-text-muted";

  const label = formatProgressLabel(progress);
  const recentLabel =
    showRecent && progress.hoursGainedRecent !== progress.hoursGained
      ? progress.hoursGainedRecent > 0
        ? `Último escaneo: +${progress.hoursGainedRecent} h`
        : null
      : null;

  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center gap-1 rounded-full border font-semibold ${sizeClasses} ${colorClasses}`}
        title={`Progreso en ${progress.periodDays} día(s) registrado(s)`}
      >
        {isPositive && (
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
            <path d="M6 2l4 6H2l4-6z" />
          </svg>
        )}
        {label}
        {progress.periodDays > 1 && !isNeutral && (
          <span className="font-normal opacity-75">/ {progress.periodDays}d</span>
        )}
      </span>
      {recentLabel && (
        <span className="text-[10px] text-steam-text-muted">{recentLabel}</span>
      )}
    </div>
  );
}
