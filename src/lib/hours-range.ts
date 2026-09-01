import {
  DEFAULT_HOURS_RANGE,
  HOURS_RANGE_DAYS,
  type HoursRangeId,
} from "@/lib/constants";
import type { ChartPoint } from "@/lib/validators/api";

export const HOURS_RANGE_OPTIONS: {
  id: HoursRangeId;
  label: string;
  days: number;
}[] = [
  { id: "7d", label: "7d", days: HOURS_RANGE_DAYS["7d"] },
  { id: "1m", label: "1m", days: HOURS_RANGE_DAYS["1m"] },
  { id: "6m", label: "6m", days: HOURS_RANGE_DAYS["6m"] },
];

export function isHoursRangeId(value: unknown): value is HoursRangeId {
  return typeof value === "string" && value in HOURS_RANGE_DAYS;
}

export function toUtcDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Primer día UTC incluido en la ventana (hoy − N días). */
export function getHoursRangeCutoff(range: HoursRangeId, now: Date = new Date()): string {
  const days = HOURS_RANGE_DAYS[range];
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  utc.setUTCDate(utc.getUTCDate() - days);
  return toUtcDateString(utc);
}

/**
 * Recorta puntos de horas acumuladas a una ventana.
 * Arrastra el último valor anterior al corte para no “borrar” el inicio del periodo
 * y, si no hay actividad posterior, dibuja una línea plana hasta hoy.
 */
export function filterPointsByHoursRange(
  points: ChartPoint[],
  range: HoursRangeId = DEFAULT_HOURS_RANGE,
  now: Date = new Date(),
): ChartPoint[] {
  if (points.length === 0) return [];

  const cutoff = getHoursRangeCutoff(range, now);
  const today = toUtcDateString(now);
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));

  const lastBefore = [...sorted].reverse().find((p) => p.date < cutoff) ?? null;
  const inRange = sorted.filter((p) => p.date >= cutoff && p.date <= today);

  const result: ChartPoint[] = [];

  if (lastBefore) {
    result.push({ date: cutoff, hours: lastBefore.hours });
  }

  for (const point of inRange) {
    const last = result[result.length - 1];
    if (last && last.date === point.date) {
      result[result.length - 1] = point;
    } else {
      result.push(point);
    }
  }

  if (result.length === 1 && result[0].date < today) {
    result.push({ date: today, hours: result[0].hours });
  }

  return result;
}
