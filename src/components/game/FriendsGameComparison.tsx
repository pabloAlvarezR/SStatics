"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ProgressBadge } from "@/components/stats/ProgressBadge";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { MAX_FRIENDS_CHART_COMPARE } from "@/lib/constants";
import type { ChartComparisonSeries } from "@/lib/chart-merge";
import type { GameFriendComparison, GameFriendsComparisonResponse } from "@/lib/validators/api";

const FRIEND_CHART_COLORS = [
  "#66c0f4",
  "#c77dff",
  "#ffb347",
  "#ff6b6b",
  "#4ecdc4",
  "#a8e6cf",
  "#dda0dd",
];

interface FriendsGameComparisonProps {
  data: GameFriendsComparisonResponse | undefined;
  isLoading?: boolean;
  loadingMessage?: string;
  selectedFriendSteamIds: string[];
  onToggleFriend: (steamId: string) => void;
  onClearFriends: () => void;
}

function formatHours(hours: number): string {
  return hours.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

export function FriendsGameComparison({
  data,
  isLoading = false,
  loadingMessage = "Cargando amigos...",
  selectedFriendSteamIds,
  onToggleFriend,
  onClearFriends,
}: FriendsGameComparisonProps) {
  const atCompareLimit = selectedFriendSteamIds.length >= MAX_FRIENDS_CHART_COMPARE;

  if (isLoading) {
    return (
      <div className="steam-panel p-5 sm:p-8">
        <h2 className="text-lg font-semibold text-steam-text">Amigos en este juego</h2>
        <LoadingPanel message={loadingMessage} minHeight="min-h-56" />
      </div>
    );
  }

  if (!data || data.friends.length === 0) {
    return (
      <div className="steam-panel p-5 sm:p-8">
        <h2 className="text-lg font-semibold text-steam-text">Amigos en este juego</h2>
        <p className="mt-2 text-sm text-steam-text-muted">
          No tienes amigos sincronizados.{" "}
          <Link href="/friends" className="text-steam-link hover:underline">
            Sincroniza tu lista de Steam
          </Link>{" "}
          para comparar horas.
        </p>
      </div>
    );
  }

  return (
    <div className="steam-panel p-5 sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-steam-text">Amigos en este juego</h2>
          <p className="mt-1 text-sm text-steam-text-muted">
            {data.friendsWithData} de {data.friends.length} amigo
            {data.friends.length !== 1 ? "s" : ""} con horas en este juego
            {selectedFriendSteamIds.length > 0 && (
              <> · {selectedFriendSteamIds.length} en el gráfico</>
            )}
          </p>
        </div>
        {selectedFriendSteamIds.length > 0 && (
          <button
            type="button"
            onClick={onClearFriends}
            className="text-sm text-steam-link hover:underline"
          >
            Quitar todos del gráfico
          </button>
        )}
      </div>

      {atCompareLimit && (
        <p className="mt-3 text-xs text-steam-text-muted">
          Máximo {MAX_FRIENDS_CHART_COMPARE} amigos en el gráfico. Quita uno para añadir otro.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {data.friends.map((friend, index) => (
          <FriendComparisonRow
            key={friend.steamId}
            friend={friend}
            colorHint={FRIEND_CHART_COLORS[index % FRIEND_CHART_COLORS.length]}
            isSelected={selectedFriendSteamIds.includes(friend.steamId)}
            compareDisabled={
              !friend.canCompareOnChart ||
              (atCompareLimit && !selectedFriendSteamIds.includes(friend.steamId))
            }
            onToggleCompare={() => onToggleFriend(friend.steamId)}
          />
        ))}
      </div>
    </div>
  );
}

function FriendComparisonRow({
  friend,
  colorHint,
  isSelected,
  compareDisabled,
  onToggleCompare,
}: {
  friend: GameFriendComparison;
  colorHint: string;
  isSelected: boolean;
  compareDisabled: boolean;
  onToggleCompare: () => void;
}) {
  const showProgress =
    friend.hoursSource === "sstatics" &&
    friend.isProfilePublic &&
    friend.hasChartData &&
    friend.progress !== null;

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
        isSelected
          ? "border-steam-link/50 bg-steam-link/5"
          : "border-steam-border/30 bg-steam-bg-dark/30"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-steam-bg-light/30">
          <AvatarImage
            src={friend.avatarUrl}
            alt={friend.personaName}
            fallbackLetter={friend.personaName}
            sizes="40px"
          />
          {isSelected && (
            <span
              className="absolute bottom-0 right-0 z-10 h-2.5 w-2.5 rounded-full border-2 border-steam-bg-dark"
              style={{ backgroundColor: colorHint }}
              aria-hidden
            />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate font-medium text-steam-text">{friend.personaName}</p>
          <FriendStatus friend={friend} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        {friend.hasGameData && friend.totalHours !== null && (
          <div className="text-right">
            <p className="text-lg font-bold text-steam-green">
              {formatHours(friend.totalHours)} h
            </p>
            {showProgress && <ProgressBadge progress={friend.progress} size="sm" />}
            {friend.hoursSource === "steam" && (
              <p className="mt-1 text-[10px] text-steam-text-muted">Biblioteca pública Steam</p>
            )}
            {friend.hoursSource === "sstatics" && !friend.isProfilePublic && (
              <p className="mt-1 text-[10px] text-steam-text-muted">Solo horas totales</p>
            )}
          </div>
        )}

        {friend.canCompareOnChart ? (
          <button
            type="button"
            onClick={onToggleCompare}
            disabled={compareDisabled && !isSelected}
            className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
              isSelected
                ? "border-steam-link bg-steam-link/20 text-steam-link"
                : compareDisabled
                  ? "cursor-not-allowed border-steam-border/30 text-steam-text-muted/50"
                  : "border-steam-border/50 text-steam-text-muted hover:border-steam-link/40 hover:text-steam-link"
            }`}
          >
            {isSelected ? "En el gráfico" : "Añadir al gráfico"}
          </button>
        ) : friend.hasGameData && friend.hoursSource === "steam" ? (
          <span className="rounded-full border border-steam-border/40 px-2.5 py-1 text-xs text-steam-text-muted">
            Solo Steam
          </span>
        ) : friend.hasGameData && friend.hoursSource === "sstatics" && !friend.isProfilePublic ? (
          <span className="rounded-full border border-steam-border/40 px-2.5 py-1 text-xs text-steam-text-muted">
            Perfil privado
          </span>
        ) : friend.isOnPlatform && !friend.hasGameData ? (
          <span className="text-xs text-steam-text-muted">Sin datos públicos</span>
        ) : !friend.isOnPlatform && !friend.hasGameData ? (
          <span className="text-xs text-steam-text-muted">Sin datos públicos</span>
        ) : null}
      </div>
    </div>
  );
}

function FriendStatus({ friend }: { friend: GameFriendComparison }) {
  if (friend.hoursSource === "steam") {
    return (
      <p className="text-xs text-steam-text-muted">
        {friend.isOnPlatform ? "En SStatics · " : "No usa SStatics · "}
        horas desde biblioteca pública de Steam
      </p>
    );
  }
  if (!friend.isOnPlatform) {
    return <p className="text-xs text-steam-text-muted">No usa SStatics</p>;
  }
  if (!friend.hasGameData) {
    return (
      <p className="text-xs text-steam-text-muted">
        En SStatics · biblioteca privada o sin este juego
      </p>
    );
  }
  if (!friend.isProfilePublic) {
    return (
      <p className="text-xs text-steam-text-muted">
        Perfil privado · horas visibles, sin curva en el gráfico
      </p>
    );
  }
  if (friend.hasChartData && friend.progress) {
    return <p className="text-xs text-steam-text-muted">Progresión registrada en la plataforma</p>;
  }
  return <p className="text-xs text-steam-text-muted">1 escaneo · necesita otro para ver progreso</p>;
}

export function useFriendChartComparison(
  friendsData: GameFriendsComparisonResponse | undefined,
  selectedFriendSteamIds: string[],
): ChartComparisonSeries[] {
  return useMemo(() => {
    if (!friendsData || selectedFriendSteamIds.length === 0) return [];

    return selectedFriendSteamIds
      .map((steamId) => {
        const index = friendsData.friends.findIndex((f) => f.steamId === steamId);
        const friend = friendsData.friends[index];
        if (!friend?.canCompareOnChart || friend.points.length === 0) return null;

        return {
          key: `friend_${friend.steamId}`,
          label: friend.personaName.split(" ")[0],
          color: FRIEND_CHART_COLORS[index % FRIEND_CHART_COLORS.length],
          points: friend.points,
        };
      })
      .filter((series): series is ChartComparisonSeries => series !== null);
  }, [friendsData, selectedFriendSteamIds]);
}
