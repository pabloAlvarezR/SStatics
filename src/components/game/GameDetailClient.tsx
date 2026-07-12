"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCompleteFriendsComparison } from "@/hooks/useCompleteFriendsComparison";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PlaytimeChart } from "@/components/charts/PlaytimeChart";
import {
  FriendsGameComparison,
  useFriendChartComparison,
} from "@/components/game/FriendsGameComparison";
import { ProgressBadge } from "@/components/stats/ProgressBadge";
import { GameCoverImage } from "@/components/ui/GameCoverImage";
import { formatScanButtonSubtext } from "@/lib/tier";
import { MAX_FRIENDS_CHART_COMPARE } from "@/lib/constants";
import type {
  GameHistory,
  ScanUsage,
  SingleGameSyncResponse,
} from "@/lib/validators/api";

interface GameDetailClientProps {
  appId: number;
  initialData: GameHistory;
  initialScanUsage: ScanUsage;
}

function formatHours(hours: number): string {
  return hours.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

function formatDate(iso: string | null): string {
  if (!iso) return "Sin registro";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GameDetailClient({
  appId,
  initialData,
  initialScanUsage,
}: GameDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedFriendSteamIds, setSelectedFriendSteamIds] = useState<string[]>([]);
  const [syncMessage, setSyncMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setSelectedFriendSteamIds([]);
    setSyncMessage(null);
  }, [appId]);

  const { data } = useQuery<GameHistory>({
    queryKey: ["game", appId],
    queryFn: async () => {
      const res = await fetch(`/api/games/${appId}/history`);
      if (!res.ok) throw new Error("Error al cargar historial");
      return res.json();
    },
    initialData,
  });

  const { data: scanUsage } = useQuery<ScanUsage>({
    queryKey: ["scans"],
    queryFn: async () => {
      const res = await fetch("/api/scans");
      if (!res.ok) throw new Error("Error al cargar escaneos");
      return res.json();
    },
    initialData: initialScanUsage,
  });

  const {
    data: friendsComparison,
    isLoading: friendsLoading,
    message: friendsLoadingMessage,
  } = useCompleteFriendsComparison(appId);

  const compareSeries = useFriendChartComparison(friendsComparison ?? undefined, selectedFriendSteamIds);

  const toggleFriendOnChart = (steamId: string) => {
    setSelectedFriendSteamIds((prev) => {
      if (prev.includes(steamId)) return prev.filter((id) => id !== steamId);
      if (prev.length >= MAX_FRIENDS_CHART_COMPARE) return prev;
      return [...prev, steamId];
    });
  };

  const syncMutation = useMutation({
    mutationFn: async (): Promise<SingleGameSyncResponse> => {
      const res = await fetch(`/api/games/${appId}/sync`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Error al sincronizar");
      return body;
    },
    onSuccess: async (result) => {
      setSyncMessage({ type: "success", text: result.message ?? "Juego actualizado" });
      await queryClient.invalidateQueries({ queryKey: ["game", appId] });
      await queryClient.invalidateQueries({ queryKey: ["scans"] });
      await queryClient.invalidateQueries({ queryKey: ["library"] });
      await queryClient.invalidateQueries({ queryKey: ["stats"] });
      router.refresh();
    },
    onError: (error) => {
      setSyncMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error al sincronizar",
      });
    },
  });

  const canScan = scanUsage.unlimited || scanUsage.remaining > 0;
  const scanSubtext = formatScanButtonSubtext(scanUsage);

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-2 text-sm text-steam-text-muted">
        <Link href="/library" className="transition-colors hover:text-steam-link">
          Biblioteca
        </Link>
        <span>/</span>
        <span className="truncate text-steam-text">{data.name}</span>
      </nav>

      <div className="steam-panel overflow-hidden">
        <div className="relative aspect-[920/430] w-full max-h-72 overflow-hidden bg-steam-bg-light/30 sm:max-h-96">
          <GameCoverImage
            appId={appId}
            name={data.name}
            imgIconUrl={data.imgIconUrl}
            imgLogoUrl={data.imgLogoUrl}
            priority
            sizes="(max-width: 768px) 100vw, 920px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-steam-bg-medium via-steam-bg-medium/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-lg sm:text-4xl">
              {data.name}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 sm:p-8">
          <StatBox label="Horas totales" value={formatHours(data.totalHours)} highlight />
          <StatBox label="Última sesión" value={formatDate(data.lastPlayedAt)} small />
          <StatBox label="Puntos de datos" value={String(data.points.length)} />
          {data.hasChartData && data.progress ? (
            <div className="rounded-xl border border-steam-green/30 bg-steam-green/5 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-steam-text-muted">
                Progreso registrado
              </p>
              <div className="mt-3">
                <ProgressBadge progress={data.progress} showRecent />
              </div>
              {data.progress.percentChange !== null && (
                <p className="mt-2 text-xs text-steam-text-muted">
                  {data.progress.percentChange > 0 ? "Incremento" : "Cambio"} del{" "}
                  {Math.abs(data.progress.percentChange)}% en {data.progress.periodDays} día
                  {data.progress.periodDays !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          ) : (
            <StatBox label="Progreso" value="—" small sub="Necesitas 2 escaneos" />
          )}
        </div>
      </div>

      <div className="steam-panel p-5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-steam-text">Evolución de horas</h2>
            <p className="mt-1 text-sm text-steam-text-muted">
              {data.hasChartData
                ? selectedFriendSteamIds.length > 0
                  ? `Comparando con ${selectedFriendSteamIds.length} amigo${selectedFriendSteamIds.length !== 1 ? "s" : ""}.`
                  : "Historial basado en snapshots de sincronización."
                : "Datos insuficientes. Escanea este juego para acumular más puntos."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => syncMutation.mutate()}
            disabled={!canScan || syncMutation.isPending}
            className="steam-btn-primary flex min-h-11 flex-col items-center justify-center gap-0.5 px-5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncMutation.isPending ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Escaneando...
              </span>
            ) : (
              <>
                <span>Escanear este juego</span>
                {scanSubtext && (
                  <span className="text-[10px] font-normal leading-none opacity-80">
                    {scanSubtext}
                  </span>
                )}
              </>
            )}
          </button>
        </div>

        {syncMessage && (
          <div
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              syncMessage.type === "success"
                ? "border-steam-green/40 bg-steam-green/10 text-steam-green"
                : "border-red-500/40 bg-red-500/10 text-red-300"
            }`}
          >
            {syncMessage.text}
          </div>
        )}

        <div className="mt-6">
          <PlaytimeChart data={data.points} compareSeries={compareSeries} />
        </div>
      </div>

      <FriendsGameComparison
        data={friendsComparison ?? undefined}
        isLoading={friendsLoading}
        loadingMessage={friendsLoadingMessage}
        selectedFriendSteamIds={selectedFriendSteamIds}
        onToggleFriend={toggleFriendOnChart}
        onClearFriends={() => setSelectedFriendSteamIds([])}
      />
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight,
  small,
  sub,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  small?: boolean;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-steam-border/30 bg-steam-bg-dark/40 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-steam-text-muted">
        {label}
      </p>
      <p
        className={`mt-2 font-bold ${
          highlight
            ? "text-3xl text-steam-green sm:text-4xl"
            : small
              ? "text-sm text-steam-text sm:text-base"
              : "text-3xl text-steam-text sm:text-4xl"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-steam-text-muted">{sub}</p>}
    </div>
  );
}
