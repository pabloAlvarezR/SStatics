"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_HOURS_RANGE, type HoursRangeId } from "@/lib/constants";
import { filterPointsByHoursRange, isHoursRangeId } from "@/lib/hours-range";
import { calculatePlaytimeProgress } from "@/lib/playtime-progress";
import type { ChartPoint } from "@/lib/validators/api";

const STORAGE_KEY = "sstatics-hours-range";
const CHANGE_EVENT = "sstatics-hours-range-change";

function readStoredRange(): HoursRangeId {
  if (typeof window === "undefined") return DEFAULT_HOURS_RANGE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isHoursRangeId(stored)) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_HOURS_RANGE;
}

export function useHoursRange() {
  const [range, setRangeState] = useState<HoursRangeId>(DEFAULT_HOURS_RANGE);

  useEffect(() => {
    setRangeState(readStoredRange());

    const onChange = (event: Event) => {
      const next = (event as CustomEvent<HoursRangeId>).detail;
      if (isHoursRangeId(next)) setRangeState(next);
    };

    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  const setRange = useCallback((next: HoursRangeId) => {
    setRangeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  }, []);

  return { range, setRange };
}

export function useRangedChartPoints(points: ChartPoint[]) {
  const { range } = useHoursRange();

  return useMemo(() => {
    const ranged = filterPointsByHoursRange(points, range);
    return {
      range,
      points: ranged,
      progress: calculatePlaytimeProgress(ranged),
    };
  }, [points, range]);
}
