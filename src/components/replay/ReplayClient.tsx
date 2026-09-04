"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { startNavigation } from "@/lib/navigation-loading";
import type { ReplayResponse } from "@/lib/validators/api";

interface ReplayClientProps {
  initialData: ReplayResponse;
}

function formatHours(h: number): string {
  return h.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

export function ReplayClient({ initialData }: ReplayClientProps) {
  const data = initialData;
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}${data.sharePath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function shiftMonth(delta: number) {
    const date = new Date(Date.UTC(data.year, data.month - 1 + delta, 1));
    const href = `/replay?year=${date.getUTCFullYear()}&month=${date.getUTCMonth() + 1}`;
    startNavigation(href);
    router.push(href);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="steam-btn-secondary min-h-11 text-sm"
        >
          Mes anterior
        </button>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="steam-btn-secondary min-h-11 text-sm"
        >
          Mes siguiente
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="steam-panel p-5">
          <p className="text-steam-text-muted text-xs tracking-wide uppercase">Horas ganadas</p>
          <p className="text-steam-green mt-2 text-3xl font-bold">
            +{formatHours(data.hoursGained)} h
          </p>
          {data.prevMonthHoursGained != null && (
            <p className="text-steam-text-muted mt-2 text-xs">
              Mes anterior: +{formatHours(data.prevMonthHoursGained)} h
            </p>
          )}
        </div>
        <div className="steam-panel p-5">
          <p className="text-steam-text-muted text-xs tracking-wide uppercase">Juegos tocados</p>
          <p className="text-steam-text mt-2 text-3xl font-bold">{data.gamesTouched}</p>
        </div>
        <div className="steam-panel p-5">
          <p className="text-steam-text-muted text-xs tracking-wide uppercase">Día más activo</p>
          {data.mostActiveDay ? (
            <>
              <p className="text-steam-text mt-2 text-lg font-semibold">
                {new Date(`${data.mostActiveDay.date}T12:00:00Z`).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
              <p className="text-steam-green text-sm">+{formatHours(data.mostActiveDay.hours)} h</p>
            </>
          ) : (
            <p className="text-steam-text-muted mt-2 text-sm">Sin actividad registrada</p>
          )}
        </div>
      </div>

      <div className="steam-panel p-5">
        <h2 className="text-steam-text text-lg font-semibold">Top del mes</h2>
        {data.topGames.length === 0 ? (
          <p className="text-steam-text-muted mt-3 text-sm">
            No hay subidas de horas este mes. Sincroniza o escanea para construir el replay.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.topGames.map((game, index) => (
              <li key={game.appId}>
                <Link
                  href={`/game/${game.appId}`}
                  className="hover:bg-steam-bg-light/30 flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 py-2"
                >
                  <span className="text-steam-text min-w-0 truncate text-sm">
                    {index + 1}. {game.name}
                  </span>
                  <span className="text-steam-green shrink-0 text-sm font-semibold">
                    +{formatHours(game.hoursGained)} h
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-center">
        <button type="button" onClick={share} className="steam-btn-primary min-h-11">
          {copied ? "Enlace copiado" : "Compartir mes"}
        </button>
      </div>
    </div>
  );
}
