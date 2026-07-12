import type { ChartPoint } from "@/lib/validators/api";
import { MIN_SNAPSHOTS_FOR_CHART } from "@/lib/constants";

export interface PlaytimeProgress {
  hoursGained: number;
  hoursGainedRecent: number;
  percentChange: number | null;
  periodDays: number;
}

export function calculatePlaytimeProgress(points: ChartPoint[]): PlaytimeProgress | null {
  if (points.length < MIN_SNAPSHOTS_FOR_CHART) return null;

  const sorted = [...points].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  const hoursGained = Math.round((last.hours - first.hours) * 10) / 10;
  const hoursGainedRecent = Math.round((last.hours - previous.hours) * 10) / 10;

  const percentChange =
    first.hours > 0
      ? Math.round(((last.hours - first.hours) / first.hours) * 1000) / 10
      : last.hours > 0
        ? null
        : 0;

  const periodMs =
    new Date(last.date).getTime() - new Date(first.date).getTime();
  const periodDays = Math.max(1, Math.round(periodMs / (1000 * 60 * 60 * 24)));

  return {
    hoursGained,
    hoursGainedRecent,
    percentChange,
    periodDays,
  };
}

export function formatProgressLabel(progress: PlaytimeProgress): string {
  if (progress.hoursGained === 0) return "Sin cambio";

  const hoursPart =
    progress.hoursGained > 0
      ? `+${progress.hoursGained} h`
      : `${progress.hoursGained} h`;

  if (progress.percentChange !== null && progress.percentChange !== 0) {
    const sign = progress.percentChange > 0 ? "+" : "";
    return `${sign}${progress.percentChange}% · ${hoursPart}`;
  }

  return hoursPart;
}
