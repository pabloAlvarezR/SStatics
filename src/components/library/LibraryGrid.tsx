"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LibraryView } from "@/components/library/LibraryView";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SyncProgressBar } from "@/components/ui/SyncProgressBar";
import { useScanUsage } from "@/hooks/useScanUsage";
import { LARGE_LIBRARY_THRESHOLD } from "@/lib/constants";
import { runChunkedLibrarySync } from "@/lib/sync-client";
import { formatScanButtonSubtext } from "@/lib/tier";
import type { LibraryResponse, ScanUsage } from "@/lib/validators/api";

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

function estimateSyncMinutes(total: number): string {
  if (total < LARGE_LIBRARY_THRESHOLD) return "menos de un minuto";
  const chunks = Math.ceil(total / 60);
  const seconds = chunks * 8;
  if (seconds < 60) return "alrededor de 1 minuto";
  return `1–${Math.ceil(seconds / 60)} minutos`;
}

async function fetchLibrary(): Promise<LibraryResponse> {
  const res = await fetch("/api/games", { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar biblioteca");
  return res.json();
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
  const [syncProgress, setSyncProgress] = useState<{ processed: number; total: number } | null>(
    null,
  );
  const [autoSyncAttempted, setAutoSyncAttempted] = useState(false);

  const { data, isFetching, refetch } = useQuery<LibraryResponse>({
    queryKey: ["library"],
    queryFn: fetchLibrary,
    initialData,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const refreshLibrary = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["library"] });
    await refetch();
  }, [queryClient, refetch]);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncProgress(null);
    setSyncMessage({ type: "info", text: "Conectando con Steam..." });

    try {
      const result = await runChunkedLibrarySync({
        onProgress: (processed, total) => {
          setSyncProgress({ processed, total });
          const hint =
            total >= LARGE_LIBRARY_THRESHOLD
              ? ` Puede tardar ${estimateSyncMinutes(total)}; los juegos aparecerán a medida que se importen.`
              : "";
          setSyncMessage({
            type: "info",
            text: `Importando juegos (${processed}/${total})...${hint}`,
          });
        },
        onChunkComplete: refreshLibrary,
      });
      setSyncMessage({ type: "success", text: result.message ?? "Sincronizado" });
      await queryClient.invalidateQueries({ queryKey: ["stats"] });
      await queryClient.invalidateQueries({ queryKey: ["scans"] });
      await refreshLibrary();
      router.refresh();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Error al sincronizar";
      setSyncMessage({ type: "error", text });
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  }, [queryClient, refreshLibrary, router]);

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
              {syncProgress
                ? `${syncProgress.processed}/${syncProgress.total}`
                : "Sincronizando..."}
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

      {isSyncing && syncProgress && (
        <div className="steam-panel px-4 py-4">
          <SyncProgressBar processed={syncProgress.processed} total={syncProgress.total} />
          {syncProgress.total >= LARGE_LIBRARY_THRESHOLD && (
            <p className="mt-3 text-xs text-steam-text-muted sm:text-sm">
              Biblioteca grande detectada ({syncProgress.total} juegos). Puedes seguir navegando;
              los títulos se irán mostrando conforme se importen.
            </p>
          )}
        </div>
      )}

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

      {isSyncing && games.length === 0 && !syncProgress && (
        <div className="steam-panel">
          <LoadingPanel message="Conectando con Steam e importando tu biblioteca..." minHeight="min-h-64" />
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
        <div className="space-y-3">
          <LibraryView games={games} serverDefaults={serverDefaults} />
          {isFetching && (
            <div className="flex items-center gap-2 text-xs text-steam-text-muted sm:text-sm">
              <LoadingSpinner size="xs" />
              Actualizando lista de juegos...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
