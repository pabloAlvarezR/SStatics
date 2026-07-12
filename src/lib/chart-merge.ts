import type { ChartPoint } from "@/lib/validators/api";

export interface ChartComparisonSeries {
  key: string;
  label: string;
  color: string;
  points: ChartPoint[];
}

function getHoursAtOrBefore(points: ChartPoint[], date: string): number | null {
  const target = new Date(date).getTime();
  let value: number | null = null;

  for (const point of points) {
    if (new Date(point.date).getTime() <= target) {
      value = point.hours;
    } else {
      break;
    }
  }

  return value;
}

/** Fusiona la serie del usuario con series de comparación para Recharts */
export function mergeChartSeries(
  userPoints: ChartPoint[],
  comparisons: ChartComparisonSeries[] = [],
): Record<string, string | number | null>[] {
  const dateSet = new Set<string>();
  for (const point of userPoints) dateSet.add(point.date);
  for (const series of comparisons) {
    for (const point of series.points) dateSet.add(point.date);
  }

  const dates = [...dateSet].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  return dates.map((date) => {
    const row: Record<string, string | number | null> = {
      date,
      hours: getHoursAtOrBefore(userPoints, date),
    };

    for (const series of comparisons) {
      row[series.key] = getHoursAtOrBefore(series.points, date);
    }

    return row;
  });
}

export function getChartYMax(
  rows: Record<string, string | number | null>[],
  keys: string[],
): number {
  let max = 0;
  for (const row of rows) {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === "number" && value > max) max = value;
    }
  }
  return Math.ceil(max * 1.1) || 1;
}
