"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Dot,
  Legend,
} from "recharts";
import { useMemo } from "react";
import type { ChartPoint } from "@/lib/validators/api";
import {
  getChartYDomain,
  mergeChartSeries,
  type ChartComparisonSeries,
} from "@/lib/chart-merge";
import { filterPointsByHoursRange } from "@/lib/hours-range";
import { useHoursRange } from "@/hooks/useHoursRange";

interface PlaytimeChartProps {
  data: ChartPoint[];
  compareSeries?: ChartComparisonSeries[];
}

const USER_COLOR = "#a4d007";
const USER_STROKE = "#5c7e10";

function formatDate(dateStr: string, compact: boolean): string {
  const date = new Date(dateStr + "T00:00:00.000Z");
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    ...(compact ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
}

function CustomTooltip({
  active,
  payload,
  label,
  compact,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number | null; color: string; name: string }[];
  label?: string;
  compact: boolean;
}) {
  if (!active || !payload?.length || !label) return null;

  const entries = payload.filter((p) => p.value !== null && p.value !== undefined);

  return (
    <div className="rounded border border-steam-border bg-steam-bg-medium px-3 py-2 shadow-xl">
      <p className="mb-1.5 text-xs text-steam-text-muted">{formatDate(label, compact)}</p>
      {entries.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-sm font-semibold"
          style={{ color: entry.color }}
        >
          {entry.name}: {entry.value!.toFixed(1)} h
        </p>
      ))}
    </div>
  );
}

export function PlaytimeChart({ data, compareSeries = [] }: PlaytimeChartProps) {
  const { range } = useHoursRange();
  const compactAxis = range === "7d" || range === "1m";

  const rangedData = useMemo(
    () => filterPointsByHoursRange(data, range),
    [data, range],
  );
  const rangedCompare = useMemo(
    () =>
      compareSeries.map((series) => ({
        ...series,
        points: filterPointsByHoursRange(series.points, range),
      })),
    [compareSeries, range],
  );

  if (rangedData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-steam-border/50 bg-steam-bg-medium/50">
        <p className="text-sm text-steam-text-muted">Sin datos de evolución en este periodo</p>
      </div>
    );
  }

  const merged = mergeChartSeries(rangedData, rangedCompare);
  const valueKeys = ["hours", ...rangedCompare.map((s) => s.key)];
  const yDomain = getChartYDomain(merged, valueKeys);

  return (
    <div className="h-72 w-full sm:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={merged} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a475e" opacity={0.5} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => formatDate(v, compactAxis)}
            stroke="#8f98a0"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#2a475e" }}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <YAxis
            domain={yDomain}
            tickFormatter={(v) => `${v}h`}
            stroke="#8f98a0"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#2a475e" }}
            width={45}
          />
          <Tooltip
            content={(props) => (
              <CustomTooltip
                active={props.active}
                payload={
                  props.payload as unknown as
                    | { dataKey: string; value: number | null; color: string; name: string }[]
                    | undefined
                }
                label={typeof props.label === "string" ? props.label : undefined}
                compact={compactAxis}
              />
            )}
          />
          {compareSeries.length > 0 && (
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#8f98a0", paddingTop: 8 }}
              formatter={(value) => <span className="text-steam-text-muted">{value}</span>}
            />
          )}
          <Line
            type="monotone"
            dataKey="hours"
            name="Tú"
            stroke={USER_COLOR}
            strokeWidth={2}
            connectNulls
            dot={<Dot r={4} fill={USER_COLOR} stroke={USER_STROKE} strokeWidth={2} />}
            activeDot={{
              r: 6,
              fill: USER_COLOR,
              stroke: USER_STROKE,
              strokeWidth: 2,
            }}
          />
          {compareSeries.map((series) => (
            <Line
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.label}
              stroke={series.color}
              strokeWidth={2}
              connectNulls
              dot={<Dot r={3} fill={series.color} stroke={series.color} strokeWidth={1} />}
              activeDot={{ r: 5, fill: series.color, stroke: series.color }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
