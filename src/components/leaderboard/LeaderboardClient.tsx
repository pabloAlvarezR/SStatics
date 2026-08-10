"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AvatarImage } from "@/components/ui/AvatarImage";
import type { LeaderboardResponse } from "@/lib/validators/api";

interface LeaderboardClientProps {
  initialData: LeaderboardResponse;
}

function formatHours(h: number): string {
  return h.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const res = await fetch("/api/leaderboard", { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar leaderboard");
  return res.json();
}

export function LeaderboardClient({ initialData }: LeaderboardClientProps) {
  const { data } = useQuery({
    queryKey: ["leaderboard", "friends"],
    queryFn: fetchLeaderboard,
    initialData,
    staleTime: 60_000,
  });

  if (data.entries.length <= 1) {
    return (
      <div className="steam-panel px-6 py-12 text-center">
        <p className="text-lg font-medium text-steam-text">Aún no hay amigos en SStatics</p>
        <p className="mt-2 text-sm text-steam-text-muted">
          Invita a tus amigos de Steam para comparar horas ganadas esta semana.
        </p>
        {data.inviteCode && (
          <p className="mt-4 text-xs text-steam-text-muted">
            Código de invitación:{" "}
            <span className="font-mono text-steam-link">{data.inviteCode}</span>
          </p>
        )}
        <Link href="/friends" className="steam-btn-primary mt-6 inline-flex min-h-11">
          Ir a amigos
        </Link>
      </div>
    );
  }

  return (
    <div className="steam-panel overflow-hidden">
      <div className="hidden grid-cols-[3rem_1fr_6rem_6rem] gap-2 border-b border-steam-border/40 px-4 py-3 text-xs uppercase tracking-wide text-steam-text-muted sm:grid">
        <span>#</span>
        <span>Jugador</span>
        <span className="text-right">+7d</span>
        <span className="text-right">Total</span>
      </div>
      <ul className="divide-y divide-steam-border/30">
        {data.entries.map((entry) => {
          const content = (
            <div className="grid grid-cols-[3rem_1fr] items-center gap-2 px-4 py-3 sm:grid-cols-[3rem_1fr_6rem_6rem]">
              <span className="text-sm font-semibold text-steam-text-muted">{entry.rank}</span>
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-sm border border-steam-border/50">
                  <AvatarImage
                    src={entry.avatarUrl}
                    alt={entry.personaName}
                    className="rounded-sm"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-steam-text">
                    {entry.personaName}
                    {entry.isCurrentUser && (
                      <span className="ml-2 text-xs text-steam-green">tú</span>
                    )}
                  </p>
                  <p className="text-xs text-steam-text-muted sm:hidden">
                    +{formatHours(entry.hoursGained7d)} h · {formatHours(entry.totalHours)} h
                    total
                  </p>
                </div>
              </div>
              <span className="hidden text-right text-sm font-semibold text-steam-green sm:block">
                +{formatHours(entry.hoursGained7d)} h
              </span>
              <span className="hidden text-right text-sm text-steam-text-muted sm:block">
                {formatHours(entry.totalHours)} h
              </span>
            </div>
          );

          return (
            <li
              key={entry.steamId}
              className={entry.isCurrentUser ? "bg-steam-green/5" : undefined}
            >
              {entry.isProfilePublic ? (
                <Link href={`/u/${entry.steamId}`} className="block hover:bg-steam-bg-light/30">
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
