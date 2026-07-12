"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LibraryGame } from "@/lib/validators/api";

export type ViewMode = "grid" | "list";
export type GridDensity = "compact" | "normal" | "large";
export type SortOption = "hours-desc" | "hours-asc" | "name" | "recent" | "hours7d";
export type FilterOption = "all" | "played" | "unplayed" | "recent7d" | "hasChart";

export interface LibraryPreferences {
  viewMode: ViewMode;
  gridDensity: GridDensity;
  sortBy: SortOption;
  filterBy: FilterOption;
  search: string;
}

const STORAGE_KEY = "sstatics-library-prefs";

export const GRID_COLS: Record<GridDensity, string> = {
  compact: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
  normal: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  large: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3",
};

const DEFAULT_PREFS: LibraryPreferences = {
  viewMode: "grid",
  gridDensity: "normal",
  sortBy: "hours-desc",
  filterBy: "all",
  search: "",
};

export function useLibraryPreferences(serverDefaults?: {
  defaultView?: ViewMode;
  gridDensity?: GridDensity;
}) {
  const [prefs, setPrefs] = useState<LibraryPreferences>(() => {
    if (typeof window === "undefined") {
      return {
        ...DEFAULT_PREFS,
        viewMode: serverDefaults?.defaultView ?? "grid",
        gridDensity: serverDefaults?.gridDensity ?? "normal",
      };
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return {
      ...DEFAULT_PREFS,
      viewMode: serverDefaults?.defaultView ?? "grid",
      gridDensity: serverDefaults?.gridDensity ?? "normal",
    };
  });

  useEffect(() => {
    if (serverDefaults?.defaultView) {
      setPrefs((p) => ({ ...p, viewMode: serverDefaults.defaultView! }));
    }
    if (serverDefaults?.gridDensity) {
      setPrefs((p) => ({ ...p, gridDensity: serverDefaults.gridDensity! }));
    }
  }, [serverDefaults?.defaultView, serverDefaults?.gridDensity]);

  const updatePrefs = useCallback((partial: Partial<LibraryPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { prefs, updatePrefs };
}

function isRecent7d(iso: string | null): boolean {
  if (!iso) return false;
  const diff = Date.now() - new Date(iso).getTime();
  return diff <= 7 * 24 * 60 * 60 * 1000;
}

export function useFilteredGames(games: LibraryGame[], prefs: LibraryPreferences) {
  return useMemo(() => {
    let filtered = [...games];

    if (prefs.search.trim()) {
      const q = prefs.search.toLowerCase();
      filtered = filtered.filter((g) => g.name.toLowerCase().includes(q));
    }

    switch (prefs.filterBy) {
      case "played":
        filtered = filtered.filter((g) => g.totalHours > 0);
        break;
      case "unplayed":
        filtered = filtered.filter((g) => g.totalHours === 0);
        break;
      case "recent7d":
        filtered = filtered.filter((g) => isRecent7d(g.lastPlayedAt));
        break;
      case "hasChart":
        filtered = filtered.filter((g) => g.hasChartData);
        break;
    }

    switch (prefs.sortBy) {
      case "hours-desc":
        filtered.sort((a, b) => b.totalHours - a.totalHours);
        break;
      case "hours-asc":
        filtered.sort((a, b) => a.totalHours - b.totalHours);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name, "es"));
        break;
      case "recent":
        filtered.sort((a, b) => {
          const ta = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0;
          const tb = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0;
          return tb - ta;
        });
        break;
      case "hours7d":
        filtered.sort((a, b) => (b.hours2weeks ?? 0) - (a.hours2weeks ?? 0));
        break;
    }

    return filtered;
  }, [games, prefs]);
}
