import Link from "next/link";
import { SparklineChart } from "@/components/charts/SparklineChart";
import { ProgressBadge } from "@/components/stats/ProgressBadge";
import { GameCoverImage } from "@/components/ui/GameCoverImage";
import type { LibraryGame } from "@/lib/validators/api";

interface LibraryListItemProps {
  game: LibraryGame;
}

function formatHours(hours: number): string {
  return hours.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

function formatLastPlayed(iso: string | null): string {
  if (!iso) return "Sin registro";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

export function LibraryListItem({ game }: LibraryListItemProps) {
  return (
    <Link
      href={`/game/${game.appId}`}
      className="steam-card group flex items-center gap-3 p-3 sm:gap-4 sm:p-4"
    >
      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded sm:h-16 sm:w-28">
        <GameCoverImage
          appId={game.appId}
          name={game.name}
          imgIconUrl={game.imgIconUrl}
          imgLogoUrl={game.imgLogoUrl}
          sizes="112px"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-steam-text group-hover:text-steam-green sm:text-base">
          {game.name}
        </h3>
        <p className="text-xs text-steam-text-muted">
          Última sesión: {formatLastPlayed(game.lastPlayedAt)}
        </p>
      </div>

      <div className="hidden w-20 shrink-0 sm:block">
        {game.hasChartData ? (
          <SparklineChart data={game.sparkline} />
        ) : (
          <p className="text-[10px] text-steam-text-muted">—</p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className="text-lg font-bold text-steam-green sm:text-xl">
          {formatHours(game.totalHours)}
        </p>
        <p className="text-[10px] text-steam-text-muted">horas</p>
        {game.hasChartData && game.progress && (
          <div className="mt-1 flex justify-end">
            <ProgressBadge progress={game.progress} size="sm" />
          </div>
        )}
        {!game.hasChartData && game.hours2weeks !== null && game.hours2weeks > 0 && (
          <p className="text-[10px] text-steam-link">+{formatHours(game.hours2weeks)} 2sem</p>
        )}
      </div>
    </Link>
  );
}
