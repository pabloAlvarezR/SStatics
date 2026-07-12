import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncResponseSchema } from "@/lib/validators/api";
import { SyncError, syncUserLibrary } from "@/services/sync.service";
import { SteamApiError } from "@/services/steam.service";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.steamId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    console.log(`[Sync] Iniciando sync para userId: ${session.user.id}`);

    const result = await syncUserLibrary(session.user.id, session.user.steamId);

    return NextResponse.json(
      syncResponseSchema.parse({
        success: true,
        gamesCount: result.gamesCount,
        syncedAt: result.syncedAt.toISOString(),
        message: `${result.gamesCount} juegos sincronizados correctamente`,
      }),
    );
  } catch (error) {
    if (error instanceof SyncError) {
      const status =
        error.code === "COOLDOWN"
          ? 429
          : error.code === "PRIVATE_LIBRARY"
            ? 403
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
