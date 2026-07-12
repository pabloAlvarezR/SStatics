import { SYNC_CHUNK_SIZE } from "@/lib/constants";
import type { SyncResponse } from "@/lib/validators/api";

export interface ChunkedSyncOptions {
  onProgress?: (processed: number, total: number) => void;
  onChunkComplete?: () => void | Promise<void>;
}

export async function runChunkedLibrarySync(
  onProgressOrOptions?: ChunkedSyncOptions | ((processed: number, total: number) => void),
  legacyOnChunkComplete?: () => void | Promise<void>,
): Promise<SyncResponse> {
  const options: ChunkedSyncOptions =
    typeof onProgressOrOptions === "function"
      ? { onProgress: onProgressOrOptions, onChunkComplete: legacyOnChunkComplete }
      : (onProgressOrOptions ?? {});

  let offset = 0;

  while (true) {
    const res = await fetch(
      `/api/sync?offset=${offset}&limit=${SYNC_CHUNK_SIZE}`,
      { method: "POST" },
    );
    const data = (await res.json()) as SyncResponse & { error?: string; code?: string };

    if (!res.ok) {
      throw new Error(data.error ?? "Error al sincronizar");
    }

    const total = data.total ?? data.gamesCount;
    const processedSoFar = Math.min(offset + (data.processed ?? 0), total);
    options.onProgress?.(processedSoFar, total);

    await options.onChunkComplete?.();

    if (data.done) {
      return data;
    }

    if ((data.processed ?? 0) === 0) {
      throw new Error("Sync interrumpido sin progreso");
    }

    offset += data.processed ?? SYNC_CHUNK_SIZE;
  }
}
