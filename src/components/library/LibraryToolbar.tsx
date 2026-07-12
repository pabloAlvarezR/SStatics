"use client";

import type { LibraryPreferences } from "@/hooks/useLibraryPreferences";
import type { GridDensity, ViewMode } from "@/hooks/useLibraryPreferences";

interface LibraryToolbarProps {
  prefs: LibraryPreferences;
  onChange: (partial: Partial<LibraryPreferences>) => void;
  totalCount: number;
  filteredCount: number;
}

export function LibraryToolbar({
  prefs,
  onChange,
  totalCount,
  filteredCount,
}: LibraryToolbarProps) {
  return (
    <div className="steam-panel space-y-4 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="search"
          placeholder="Buscar juegos..."
          value={prefs.search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="min-h-11 w-full rounded border border-steam-border/50 bg-steam-bg-dark/50 px-4 py-2 text-sm text-steam-text placeholder:text-steam-text-muted focus:border-steam-green/50 focus:outline-none lg:max-w-xs"
        />

        <div className="flex flex-wrap items-center gap-2">
          <ViewToggle
            viewMode={prefs.viewMode}
            onChange={(viewMode) => onChange({ viewMode })}
          />
          {prefs.viewMode === "grid" && (
            <DensityToggle
              density={prefs.gridDensity}
              onChange={(gridDensity) => onChange({ gridDensity })}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <select
          value={prefs.filterBy}
          onChange={(e) => onChange({ filterBy: e.target.value as LibraryPreferences["filterBy"] })}
          className="min-h-11 flex-1 rounded border border-steam-border/50 bg-steam-bg-dark/50 px-3 py-2 text-sm text-steam-text sm:flex-none sm:min-w-[160px]"
        >
          <option value="all">Todos</option>
          <option value="played">Con horas</option>
          <option value="unplayed">Sin jugar</option>
          <option value="recent7d">Jugados 7d</option>
          <option value="hasChart">Con gráfico</option>
        </select>

        <select
          value={prefs.sortBy}
          onChange={(e) => onChange({ sortBy: e.target.value as LibraryPreferences["sortBy"] })}
          className="min-h-11 flex-1 rounded border border-steam-border/50 bg-steam-bg-dark/50 px-3 py-2 text-sm text-steam-text sm:flex-none sm:min-w-[160px]"
        >
          <option value="hours-desc">Horas ↓</option>
          <option value="hours-asc">Horas ↑</option>
          <option value="name">Nombre A-Z</option>
          <option value="recent">Última sesión</option>
          <option value="hours7d">Horas 2 sem.</option>
        </select>

        <p className="text-sm text-steam-text-muted sm:ml-auto">
          {filteredCount} de {totalCount} juegos
        </p>
      </div>
    </div>
  );
}

function ViewToggle({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex rounded border border-steam-border/50 overflow-hidden">
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`min-h-11 min-w-11 px-3 text-sm font-medium transition-colors ${
          viewMode === "grid"
            ? "bg-steam-green text-steam-bg-dark"
            : "bg-steam-bg-dark/50 text-steam-text-muted hover:text-steam-text"
        }`}
        aria-label="Vista cuadrícula"
      >
        <svg className="mx-auto h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`min-h-11 min-w-11 px-3 text-sm font-medium transition-colors ${
          viewMode === "list"
            ? "bg-steam-green text-steam-bg-dark"
            : "bg-steam-bg-dark/50 text-steam-text-muted hover:text-steam-text"
        }`}
        aria-label="Vista lista"
      >
        <svg className="mx-auto h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}

function DensityToggle({
  density,
  onChange,
}: {
  density: GridDensity;
  onChange: (d: GridDensity) => void;
}) {
  const options: { value: GridDensity; label: string }[] = [
    { value: "compact", label: "S" },
    { value: "normal", label: "M" },
    { value: "large", label: "L" },
  ];

  return (
    <div className="flex rounded border border-steam-border/50 overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`min-h-11 min-w-10 px-2 text-xs font-bold transition-colors ${
            density === opt.value
              ? "bg-steam-green text-steam-bg-dark"
              : "bg-steam-bg-dark/50 text-steam-text-muted hover:text-steam-text"
          }`}
          aria-label={`Densidad ${opt.label}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
