import Link from "next/link";
import { SparklineChart } from "@/components/charts/SparklineChart";
import { ProgressBadge } from "@/components/stats/ProgressBadge";
import { GameCoverImage } from "@/components/ui/GameCoverImage";
import type { LibraryGame } from "@/lib/validators/api";

interface GameCardProps {
  game: LibraryGame;
}

function formatHours(hours: number): string {
  return hours.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

function formatLastPlayed(iso: string | null): string {
  if (!iso) return "Sin registro";
  const date = new Date(iso);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Link href={`/game/${game.appId}`} className="steam-card group block overflow-hidden">
      <div className="relative aspect-[460/215] w-full overflow-hidden bg-steam-bg-light/30">
        <GameCoverImage
          appId={game.appId}
          name={game.name}
          imgIconUrl={game.imgIconUrl}
          imgLogoUrl={game.imgLogoUrl}
          className="transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-steam-bg-medium via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-steam-text transition-colors group-hover:text-steam-green sm:text-base">
            {game.name}
          </h3>
          <p className="mt-1 text-xs text-steam-text-muted">
            Última sesión: {formatLastPlayed(game.lastPlayedAt)}
          </p>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl font-bold tracking-tight text-steam-green sm:text-3xl">
              {formatHours(game.totalHours)}
            </p>
            <p className="text-xs text-steam-text-muted">horas totales</p>
          </div>
          {game.hasChartData && game.progress && (
            <ProgressBadge progress={game.progress} size="sm" />
          )}
        </div>

        <div className="border-t border-steam-border/30 pt-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-steam-text-muted">
            Evolución
          </p>
          {game.hasChartData ? (
            <SparklineChart data={game.sparkline} />
          ) : (
            <p className="text-[10px] text-steam-text-muted">
              Escanea de nuevo para ver progreso %
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
