import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { singleGameSyncResponseSchema } from "@/lib/validators/api";
import { SyncError, syncSingleGame } from "@/services/sync.service";
import { SteamApiError } from "@/services/steam.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.steamId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { appId: appIdParam } = await params;
    const appId = parseInt(appIdParam, 10);
    if (isNaN(appId)) {
      return NextResponse.json({ error: "AppID inválido" }, { status: 400 });
    }

    const result = await syncSingleGame(session.user.id, session.user.steamId, appId);

    return NextResponse.json(
      singleGameSyncResponseSchema.parse({
        success: true,
        syncedAt: result.syncedAt.toISOString(),
        gameName: result.gameName,
        scansUsedToday: result.scansUsedToday,
        scansLimit: result.scansLimit,
        scansRemaining: result.scansRemaining,
        message: `${result.gameName} actualizado. Te quedan ${result.scansRemaining} escaneo(s) hoy.`,
      }),
    );
  } catch (error) {
    if (error instanceof SyncError) {
      const status =
        error.code === "SCAN_LIMIT"
          ? 429
          : error.code === "GAME_NOT_FOUND"
            ? 404
            : error.code === "CONFIG"
              ? 500
              : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }

    if (error instanceof SteamApiError) {
      return NextResponse.json(
        { error: `Error de Steam: ${error.message}`, code: "STEAM_API" },
        { status: 502 },
      );
    }

    console.error("Single game sync error:", error);
    return NextResponse.json({ error: "Error al sincronizar juego" }, { status: 500 });
  }
}
