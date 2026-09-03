import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SYNC_CHUNK_SIZE } from "@/lib/constants";
import { syncResponseSchema } from "@/lib/validators/api";
import { SyncError, syncUserLibrary } from "@/services/sync.service";
import { SteamApiError } from "@/services/steam.service";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.steamId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset") ?? "0"));
    const limit = Math.max(
      1,
      Number(request.nextUrl.searchParams.get("limit") ?? String(SYNC_CHUNK_SIZE)),
    );

    console.log(
      `[Sync] Chunk offset=${offset} limit=${limit} userId=${session.user.id}`,
    );

    const result = await syncUserLibrary(session.user.id, session.user.steamId, {
      offset,
      limit,
    });

    const processedSoFar = offset + result.processed;

    return NextResponse.json(
      syncResponseSchema.parse({
        success: true,
        gamesCount: result.total,
        syncedAt: result.syncedAt?.toISOString(),
        done: result.done,
        processed: result.processed,
        total: result.total,
        message: result.done
          ? `${result.total} juegos sincronizados correctamente`
          : `Sincronizados ${processedSoFar} de ${result.total} juegos...`,
      }),
    );
  } catch (error) {
    if (error instanceof SyncError) {
      const status =
        error.code === "COOLDOWN"
          ? 429
          : error.code === "PRIVATE_LIBRARY"
            ? 403
            : error.code === "SYNC_SESSION_EXPIRED"
              ? 409
              : error.code === "NO_PLAYTIME"
            ? 422
            : error.code === "CONFIG"
                ? 500
                : 400;
      console.error(`[Sync] Error (${error.code}):`, error.message);
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }

    if (error instanceof SteamApiError) {
      console.error("[Sync] Steam API error:", error.message, error.steamResponse);
      return NextResponse.json(
        { error: `Error de Steam: ${error.message}`, code: "STEAM_API" },
        { status: 502 },
      );
    }

    console.error("Sync API error:", error);
    return NextResponse.json(
      { error: "Error al sincronizar. Inténtalo de nuevo más tarde." },
      { status: 500 },
    );
  }
}
