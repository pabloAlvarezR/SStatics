"use client";

import { GameCard } from "@/components/library/GameCard";
import { LibraryListItem } from "@/components/library/LibraryListItem";
import { LibraryToolbar } from "@/components/library/LibraryToolbar";
import { Ps1PeekImage } from "@/components/ps1/Ps1PeekImage";
import {
  GRID_COLS,
  useFilteredGames,
  useLibraryPreferences,
} from "@/hooks/useLibraryPreferences";
import type { LibraryGame } from "@/lib/validators/api";

interface LibraryViewProps {
  games: LibraryGame[];
  serverDefaults?: {
    defaultView?: "grid" | "list";
    gridDensity?: "compact" | "normal" | "large";
  };
}

export function LibraryView({ games, serverDefaults }: LibraryViewProps) {
  const { prefs, updatePrefs } = useLibraryPreferences(serverDefaults);
  const filteredGames = useFilteredGames(games, prefs);

  return (
    <div className="space-y-4">
      <LibraryToolbar
        prefs={prefs}
        onChange={updatePrefs}
        totalCount={games.length}
        filteredCount={filteredGames.length}
      />

      {filteredGames.length === 0 ? (
        <div className="steam-panel space-y-6 px-6 py-12 text-center">
          <p className="text-steam-text-muted">Ningún juego coincide con los filtros.</p>
          <div className="mx-auto max-w-[180px]">
            <Ps1PeekImage
              src="/branding/silent_bomber.png"
              hint="¿Buscando algo que no está?"
              className="opacity-80"
            />
          </div>
          <p className="text-[11px] text-steam-text-muted/60">
            Prueba otro filtro — o pulsa ✕ para cancelar la búsqueda.
          </p>
        </div>
      ) : prefs.viewMode === "list" ? (
        <div className="space-y-2">
          {filteredGames.map((game) => (
            <LibraryListItem key={game.appId} game={game} />
          ))}
        </div>
      ) : (
        <div className={`grid gap-4 ${GRID_COLS[prefs.gridDensity]}`}>
          {filteredGames.map((game) => (
            <GameCard key={game.appId} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
