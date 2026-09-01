"use client";

import { ResponsiveContainer, LineChart, Line } from "recharts";
import { useRangedChartPoints } from "@/hooks/useHoursRange";
import type { ChartPoint } from "@/lib/validators/api";

interface SparklineChartProps {
  data: ChartPoint[];
}

export function SparklineChart({ data }: SparklineChartProps) {
  const { points } = useRangedChartPoints(data);

  if (points.length === 0) {
    return <div className="h-10 w-full rounded bg-steam-bg-light/20" />;
  }

  return (
    <div className="pointer-events-none h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="hours"
            stroke="#a4d007"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
