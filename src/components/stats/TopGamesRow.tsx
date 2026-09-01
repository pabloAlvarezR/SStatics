"use client";

import Link from "next/link";
import { HoursRangeSelector } from "@/components/charts/HoursRangeSelector";
import { SparklineChart } from "@/components/charts/SparklineChart";
import { GameCoverImage } from "@/components/ui/GameCoverImage";
import type { StatsResponse } from "@/lib/validators/api";

interface TopGamesRowProps {
  games: StatsResponse["topGames"];
}

function formatHours(h: number): string {
  return h.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

export function TopGamesRow({ games }: TopGamesRowProps) {
  return (
    <div className="steam-panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-steam-border/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-steam-text-muted">
            Top 5 juegos
          </h3>
          <p className="mt-1 text-xs text-steam-text-muted">Por horas totales en tu biblioteca</p>
        </div>
        <HoursRangeSelector />
      </div>

      <div className="divide-y divide-steam-border/20">
        {games.map((game, i) => (
          <Link
            key={game.appId}
            href={`/game/${game.appId}`}
            className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-steam-bg-dark/40 sm:gap-5 sm:px-8"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-steam-green/15 text-sm font-bold text-steam-green">
              {i + 1}
            </span>

            <div className="relative h-14 w-28 shrink-0 overflow-hidden rounded-lg border border-steam-border/30 shadow-md sm:h-16 sm:w-32">
              <GameCoverImage
                appId={game.appId}
                name={game.name}
                className="transition-transform duration-300 group-hover:scale-105"
                sizes="128px"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-steam-text group-hover:text-steam-green sm:text-base">
                {game.name}
              </p>
              <p className="mt-0.5 text-lg font-bold text-steam-green">
                {formatHours(game.totalHours)} h
              </p>
            </div>

            <div className="hidden w-28 shrink-0 md:block">
              <SparklineChart data={game.sparkline} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
