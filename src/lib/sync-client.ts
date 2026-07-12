import { SYNC_CHUNK_SIZE } from "@/lib/constants";
import type { SyncResponse } from "@/lib/validators/api";

export async function runChunkedLibrarySync(
  onProgress?: (processed: number, total: number) => void,
): Promise<SyncResponse> {
  let offset = 0;

  while (true) {
    const res = await fetch(
      `/api/sync?offset=${offset}&limit=${SYNC_CHUNK_SIZE}`,
      { method: "POST" },
    );
    const data = (await res.json()) as SyncResponse & { error?: string };

    if (!res.ok) {
      throw new Error(data.error ?? "Error al sincronizar");
    }

    const processedSoFar = offset + (data.processed ?? SYNC_CHUNK_SIZE);
    onProgress?.(
      Math.min(processedSoFar, data.total ?? data.gamesCount),
      data.total ?? data.gamesCount,
    );

    if (data.done) {
      return data;
    }

    if ((data.processed ?? 0) === 0) {
      throw new Error("Sync interrumpido sin progreso");
    }

    offset += data.processed ?? SYNC_CHUNK_SIZE;
  }
}
