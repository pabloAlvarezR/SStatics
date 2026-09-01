"use client";

import { HOURS_RANGE_OPTIONS } from "@/lib/hours-range";
import { useHoursRange } from "@/hooks/useHoursRange";
import type { HoursRangeId } from "@/lib/constants";

interface HoursRangeSelectorProps {
  className?: string;
}

const RANGE_ARIA: Record<HoursRangeId, string> = {
  "7d": "Últimos 7 días",
  "1m": "Último mes",
  "6m": "Últimos 6 meses",
};

export function HoursRangeSelector({ className = "" }: HoursRangeSelectorProps) {
  const { range, setRange } = useHoursRange();

  return (
    <div
      role="radiogroup"
      aria-label="Periodo de horas"
      className={`flex w-full rounded-lg border border-steam-border/60 bg-steam-bg-dark/50 p-1 sm:w-auto ${className}`}
    >
      {HOURS_RANGE_OPTIONS.map((option) => {
        const selected = range === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={RANGE_ARIA[option.id]}
            onClick={() => setRange(option.id)}
            className={`min-h-11 flex-1 rounded-md px-3.5 text-xs font-semibold tracking-wide transition-colors sm:min-w-[3.25rem] sm:flex-none ${
              selected
                ? "border border-steam-green/55 bg-steam-bg-medium text-steam-green shadow-sm"
                : "border border-transparent text-steam-text-muted hover:text-steam-text"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
