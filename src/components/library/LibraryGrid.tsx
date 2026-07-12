"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LibraryView } from "@/components/library/LibraryView";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useScanUsage } from "@/hooks/useScanUsage";
import { formatScanButtonSubtext } from "@/lib/tier";
import type { LibraryResponse, ScanUsage, SyncResponse } from "@/lib/validators/api";

interface LibraryGridProps {
  initialData: LibraryResponse;
  initialScanUsage?: ScanUsage;
  serverDefaults?: {
    defaultView?: "grid" | "list";
    gridDensity?: "compact" | "normal" | "large";
  };
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Hace un momento";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

async function fetchLibrary(): Promise<LibraryResponse> {
  const res = await fetch("/api/games", { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar biblioteca");
  return res.json();
}

async function runSync(): Promise<SyncResponse> {
  const res = await fetch("/api/sync", { method: "POST" });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Error al sincronizar");
  }
  return data;
}

export function LibraryGrid({ initialData, initialScanUsage, serverDefaults }: LibraryGridProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: scanUsage } = useScanUsage(initialScanUsage);
  const [syncMessage, setSyncMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSyncAttempted, setAutoSyncAttempted] = useState(false);

  const { data, isFetching, refetch } = useQuery<LibraryResponse>({
    queryKey: ["library"],
    queryFn: fetchLibrary,
    initialData,
    staleTime: 0,
  });

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncMessage({ type: "info", text: "Sincronizando con Steam..." });

    try {
      const result = await runSync();
      setSyncMessage({ type: "success", text: result.message ?? "Sincronizado" });
      await queryClient.invalidateQueries({ queryKey: ["library"] });
      await queryClient.invalidateQueries({ queryKey: ["stats"] });
      await queryClient.invalidateQueries({ queryKey: ["scans"] });
      await refetch();
      router.refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Error al sincronizar";
      setSyncMessage({ type: "error", text });
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient, refetch, router]);

  useEffect(() => {
    if (data.needsSync && !autoSyncAttempted && !isSyncing) {
      setAutoSyncAttempted(true);
      handleSync();
    }
  }, [data.needsSync, autoSyncAttempted, isSyncing, handleSync]);

  const games = data.games;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-steam-text sm:text-3xl">
            Mi Biblioteca
          </h1>
          <p className="mt-1 text-sm text-steam-text-muted">
            {games.length} juego{games.length !== 1 ? "s" : ""}
            <> · Última sync: {formatRelativeTime(data.lastSyncAt)}</>
            {isFetching && !isSyncing && (
              <span className="ml-2 inline-flex items-center gap-1.5 text-steam-link">
                <LoadingSpinner size="xs" />
                Actualizando...
              </span>
            )}
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="steam-btn-primary flex min-h-11 flex-col items-center justify-center gap-0.5 px-4 py-2 text-sm disabled:opacity-60"
        >
          {isSyncing ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Sincronizando...
            </span>
          ) : (
            <>
              <span>Sincronizar Steam</span>
              {formatScanButtonSubtext(scanUsage) && (
                <span className="text-[10px] font-normal leading-none opacity-80">
                  {formatScanButtonSubtext(scanUsage)}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {syncMessage && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            syncMessage.type === "success"
              ? "border-steam-green/40 bg-steam-green/10 text-steam-green"
              : syncMessage.type === "error"
                ? "border-red-500/40 bg-red-500/10 text-red-300"
                : "border-steam-link/40 bg-steam-link/10 text-steam-link"
          }`}
        >
          {syncMessage.text}
        </div>
      )}

      {isSyncing && games.length === 0 && (
        <div className="steam-panel">
          <LoadingPanel message="Sincronizando tu biblioteca con Steam..." minHeight="min-h-64" />
        </div>
      )}

      {!isSyncing && games.length === 0 && (
        <div className="steam-panel flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-lg font-medium text-steam-text">Biblioteca vacía</p>
          <p className="mt-2 max-w-lg text-sm text-steam-text-muted">
            Pulsa «Sincronizar Steam» para importar tus juegos. Si ya lo hiciste y sigue vacío,
            comprueba que en Steam tu perfil tenga los{" "}
            <strong className="text-steam-text">detalles de los juegos en Público</strong>.
          </p>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="steam-btn-primary mt-6 min-h-11"
          >
            Sincronizar ahora
          </button>
        </div>
      )}

      {games.length > 0 && (
        <div className="relative">
          <LibraryView games={games} serverDefaults={serverDefaults} />
          {(isSyncing || isFetching) && (
            <LoadingOverlay
              message={
                isSyncing ? "Sincronizando biblioteca..." : "Actualizando biblioteca..."
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
