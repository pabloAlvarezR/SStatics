"use client";

import { useState } from "react";
import type { WeekShareResponse } from "@/lib/validators/api";

interface WeekShareClientProps {
  initialData: WeekShareResponse;
}

function formatHours(h: number): string {
  return h.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

export function WeekShareClient({ initialData }: WeekShareClientProps) {
  const data = initialData;
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

  return (
    <div className="steam-panel space-y-5 p-6">
      <div>
        <p className="text-sm text-steam-text-muted">{data.personaName}</p>
        <p className="mt-1 text-3xl font-bold text-steam-green">
          +{formatHours(data.hours7d)} h
        </p>
        <p className="text-sm text-steam-text-muted">en los últimos 7 días</p>
      </div>

      {data.topGames.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-steam-text-muted">Top juegos</p>
          <ul className="mt-2 space-y-2">
            {data.topGames.map((game) => (
              <li key={game.appId} className="flex justify-between gap-2 text-sm">
                <span className="truncate text-steam-text">{game.name}</span>
                <span className="shrink-0 text-steam-text-muted">
                  {formatHours(game.totalHours)} h
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" onClick={share} className="steam-btn-primary w-full min-h-11">
        {copied ? "Enlace copiado" : "Copiar enlace"}
      </button>
    </div>
  );
}
