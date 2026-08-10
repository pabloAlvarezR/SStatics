"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { SparklineChart } from "@/components/charts/SparklineChart";
import { ProgressBadge } from "@/components/stats/ProgressBadge";
import { GameCoverImage } from "@/components/ui/GameCoverImage";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { FeedResponse } from "@/lib/validators/api";

interface HomeFeedProps {
  initialData: FeedResponse;
  userName?: string | null;
}

function formatHours(h: number): string {
  return h.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Sin fecha";
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Hace un momento";
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function formatSyncTime(iso: string | null): string {
  if (!iso) return "nunca";
  return formatRelative(iso);
}

async function fetchFeed(): Promise<FeedResponse> {
  const res = await fetch("/api/feed", { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar feed");
  return res.json();
}

export function HomeFeed({ initialData, userName }: HomeFeedProps) {
  const { data, isFetching, isLoading } = useQuery<FeedResponse>({
    queryKey: ["feed"],
    queryFn: fetchFeed,
    initialData,
    staleTime: 60_000,
  });

  const greeting = getGreeting();
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wider text-steam-green">
          Tu resumen diario
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-steam-text sm:text-4xl">
          {greeting}
          {userName ? `, ${userName.split(" ")[0]}` : ""}
        </h1>
        <p className="max-w-2xl text-sm text-steam-text-muted sm:text-base">
          {today.charAt(0).toUpperCase() + today.slice(1)} · Última sync{" "}
          {formatSyncTime(data.lastSyncAt)}
          {isFetching && !isLoading && (
            <span className="ml-2 inline-flex items-center gap-1.5 text-steam-link">
              <LoadingSpinner size="xs" />
              Actualizando...
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/share/week" className="steam-btn-secondary min-h-11 text-sm">
            Compartir mi semana
          </Link>
          <Link href="/replay" className="steam-btn-secondary min-h-11 text-sm">
            Replay del mes
          </Link>
        </div>
      </header>

      {isLoading ? (
        <div className="steam-panel relative min-h-48">
          <LoadingOverlay message="Cargando tu resumen..." />
        </div>
      ) : data.games.length === 0 ? (
        <div className="steam-panel flex flex-col items-center px-6 py-16 text-center">
          <p className="text-lg font-medium text-steam-text">Sin actividad reciente</p>
          <p className="mt-2 max-w-md text-sm text-steam-text-muted">
            Sincroniza tu biblioteca o escanea juegos individuales para ver aquí tu evolución
            diaria.
          </p>
          <Link href="/library" className="steam-btn-primary mt-6 min-h-11">
            Ir a la biblioteca
          </Link>
        </div>
      ) : (
        <section className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-steam-text sm:text-xl">
                Últimos juegos jugados
              </h2>
              <p className="text-sm text-steam-text-muted">
                {data.games.length} de {data.totalRecent} con actividad reciente
              </p>
            </div>
            <Link
              href="/library"
              className="text-sm font-medium text-steam-link hover:underline"
            >
              Ver biblioteca completa →
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {data.games.map((game) => (
              <RecentGameCard key={game.appId} game={game} />
            ))}
          </div>
        </section>
      )}

      {data.friendActivity && data.friendActivity.length > 0 && (
        <section className="steam-panel space-y-3 p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-steam-text">Amigos esta semana</h2>
              <p className="text-sm text-steam-text-muted">Horas ganadas en los últimos 7 días</p>
            </div>
            <Link href="/leaderboard" className="text-sm font-medium text-steam-link hover:underline">
              Ver leaderboard →
            </Link>
          </div>
          <ul className="space-y-2">
            {data.friendActivity.map((friend) => (
              <li key={friend.steamId}>
                <Link
                  href={`/u/${friend.steamId}`}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-steam-bg-light/30"
                >
                  <span className="truncate text-sm text-steam-text">{friend.personaName}</span>
                  <span className="shrink-0 text-sm font-semibold text-steam-green">
                    +{formatHours(friend.hoursGained7d)} h
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink
          href="/library"
          title="Biblioteca"
          desc="Todos tus juegos con filtros y vistas"
        />
        <QuickLink href="/friends" title="Amigos" desc="Quién de tu lista usa SStatics" />
        <QuickLink
          href="/leaderboard"
          title="Leaderboard"
          desc="Horas ganadas esta semana entre amigos"
        />
        <QuickLink href="/replay" title="Replay" desc="Resumen del mes con tus snapshots" />
      </section>
    </div>
  );
}

function RecentGameCard({ game }: { game: FeedResponse["games"][number] }) {
  return (
    <Link
      href={`/game/${game.appId}`}
      className="steam-panel group flex flex-col overflow-hidden transition-all hover:border-steam-green/30 sm:flex-row"
    >
      <div className="relative aspect-[460/215] w-full shrink-0 overflow-hidden sm:aspect-auto sm:h-auto sm:w-44 md:w-52">
        <GameCoverImage
          appId={game.appId}
          name={game.name}
          imgIconUrl={game.imgIconUrl}
          imgLogoUrl={game.imgLogoUrl}
          className="transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, 208px"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-steam-bg-medium/90 via-transparent to-transparent sm:bg-gradient-to-r" />
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base font-bold text-steam-text group-hover:text-steam-green sm:text-lg">
              {game.name}
            </h3>
            <span className="shrink-0 text-xs text-steam-text-muted">
              {formatRelative(game.lastPlayedAt)}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-steam-green">
            {formatHours(game.totalHours)}
            <span className="ml-1 text-sm font-normal text-steam-text-muted">h totales</span>
          </p>
        </div>

        <div className="space-y-3">
          {game.hasChartData ? (
            <>
              <ProgressBadge progress={game.progress} showRecent />
              <div className="rounded-lg border border-steam-border/20 bg-steam-bg-dark/40 p-2">
                <SparklineChart data={game.sparkline} />
              </div>
            </>
          ) : (
            <p className="text-xs text-steam-text-muted">
              Escanea de nuevo para ver el progreso entre puntos de datos.
            </p>
          )}
          {game.hours2weeks !== null && game.hours2weeks > 0 && (
            <p className="text-xs text-steam-link">
              +{formatHours(game.hours2weeks)} h en las últimas 2 semanas (Steam)
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function QuickLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="steam-panel block p-5 transition-colors hover:border-steam-green/30"
    >
      <h3 className="font-semibold text-steam-text">{title}</h3>
      <p className="mt-1 text-sm text-steam-text-muted">{desc}</p>
    </Link>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}
