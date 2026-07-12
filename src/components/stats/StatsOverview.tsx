"use client";

import Link from "next/link";
import type { StatsResponse } from "@/lib/validators/api";
import { StatCard } from "@/components/stats/StatCard";
import { PercentileBadge } from "@/components/stats/PercentileBadge";
import { TopGamesRow } from "@/components/stats/TopGamesRow";
import { ActivityHeatmap } from "@/components/stats/ActivityHeatmap";
import { GameCoverImage } from "@/components/ui/GameCoverImage";

interface StatsOverviewProps {
  initialData: StatsResponse;
  compact?: boolean;
}

function formatHours(h: number): string {
  return h.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

export function StatsOverview({ initialData, compact = false }: StatsOverviewProps) {
  const data = initialData;

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Horas totales" value={`${formatHours(data.totalHours)} h`} highlight />
        <StatCard label="Juegos" value={String(data.totalGames)} />
        <StatCard label="Últimos 7d" value={`${formatHours(data.hours7d)} h`} />
        <StatCard label="Racha" value={`${data.activityStreak} días`} />
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-steam-text sm:text-3xl">
          Resumen general
        </h2>
        <p className="text-sm text-steam-text-muted">
          {data.platformUserCount} jugador{data.platformUserCount !== 1 ? "es" : ""} en la
          plataforma
          {data.accountAgeDays > 0 && ` · Miembro desde hace ${data.accountAgeDays} días`}
        </p>
      </header>

      {data.percentiles.available && (
        <div className="flex flex-wrap gap-2">
          {data.percentiles.hoursTotal !== null && (
            <PercentileBadge label="horas totales" percentile={data.percentiles.hoursTotal} />
          )}
          {data.percentiles.gamesCount !== null && (
            <PercentileBadge label="juegos" percentile={data.percentiles.gamesCount} />
          )}
          {data.percentiles.hours7d !== null && (
            <PercentileBadge label="horas 7d" percentile={data.percentiles.hours7d} />
          )}
        </div>
      )}

      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-steam-text-muted">
          Métricas clave
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <StatCard label="Horas totales" value={`${formatHours(data.totalHours)} h`} highlight />
          <StatCard label="Juegos totales" value={String(data.totalGames)} />
          <StatCard
            label="Con horas"
            value={String(data.gamesWithHours)}
            subValue={`${data.gamesUnplayed} sin jugar`}
          />
          <StatCard label="Últimas 48h" value={`${formatHours(data.hours48h)} h`} />
          <StatCard
            label="Últimos 7 días"
            value={`${formatHours(data.hours7d)} h`}
            trend={data.weeklyGrowthPercent ?? undefined}
            trendLabel="vs sem. ant."
          />
          <StatCard label="Últimos 14 días" value={`${formatHours(data.hours14d)} h`} />
          <StatCard label="Últimos 30 días" value={`${formatHours(data.hours30d)} h`} />
          <StatCard label="Steam 2 sem." value={`${formatHours(data.hours2weeksSteam)} h`} />
          <StatCard label="Media/juego" value={`${formatHours(data.avgHoursPerGame)} h`} />
          <StatCard label="Backlog" value={String(data.backlogCount)} />
          <StatCard label="Racha activa" value={`${data.activityStreak} días`} />
          <StatCard
            label="Última sync"
            value={data.daysSinceSync !== null ? `Hace ${data.daysSinceSync}d` : "Nunca"}
          />
        </div>
      </div>

      {data.topGame && (
        <TopGameHighlight topGame={data.topGame} recentGame={data.recentGame} />
      )}

      {data.topGames.length > 0 && <TopGamesRow games={data.topGames} />}

      {data.activityHeatmap.length > 0 && (
        <div className="steam-panel p-5 sm:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-steam-text-muted">
            Actividad últimos 30 días
          </h3>
          <p className="mt-1 mb-5 text-xs text-steam-text-muted">
            Horas jugadas por día según tus snapshots
          </p>
          <ActivityHeatmap data={data.activityHeatmap} />
        </div>
      )}
    </section>
  );
}

function TopGameHighlight({
  topGame,
  recentGame,
}: {
  topGame: NonNullable<StatsResponse["topGame"]>;
  recentGame: StatsResponse["recentGame"];
}) {
  return (
    <Link href={`/game/${topGame.appId}`} className="steam-panel group block overflow-hidden">
      <div className="grid sm:grid-cols-[1fr_1.2fr]">
        <div className="relative aspect-[460/215] min-h-[140px] sm:min-h-[180px]">
          <GameCoverImage
            appId={topGame.appId}
            name={topGame.name}
            className="transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 400px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-steam-bg-medium/80 sm:bg-gradient-to-t sm:from-steam-bg-medium sm:via-steam-bg-medium/40 sm:to-transparent" />
        </div>
        <div className="flex flex-col justify-center p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-steam-green">
            Juego más jugado
          </p>
          <h3 className="mt-2 text-xl font-bold text-steam-text group-hover:text-steam-green sm:text-2xl">
            {topGame.name}
          </h3>
          <p className="mt-2 text-3xl font-bold text-steam-green sm:text-4xl">
            {formatHours(topGame.totalHours)} h
          </p>
          {recentGame && (
            <p className="mt-4 text-sm text-steam-text-muted">
              Último jugado:{" "}
              <span className="text-steam-text">{recentGame.name}</span> (
              {new Date(recentGame.lastPlayedAt).toLocaleDateString("es-ES")})
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
