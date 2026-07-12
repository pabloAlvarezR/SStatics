import { prisma, ensureSqliteOptimizations } from "@/lib/prisma";
import {
  SYNC_CACHE_TTL_MS,
  SYNC_CHUNK_SIZE,
  SYNC_COOLDOWN_MS,
  SYNC_PARALLEL_UPSERTS,
} from "@/lib/constants";
import { mapConcurrent } from "@/lib/map-concurrent";
import {
  getCaptureDate,
  getPreviousCaptureDate,
  getTrackedAppIds,
} from "@/repositories/snapshot.repository";
import { getOwnedGames, SteamApiError } from "@/services/steam.service";
import { getDailyScanUsage, recordGameScan } from "@/services/scan.service";
import { isOwnerTier } from "@/lib/tier";

export class SyncError extends Error {
  constructor(
    message: string,
    public code:
      | "COOLDOWN"
      | "PRIVATE_LIBRARY"
      | "STEAM_API"
      | "NOT_FOUND"
      | "CONFIG"
      | "SCAN_LIMIT"
      | "GAME_NOT_FOUND"
      | "SYNC_SESSION_EXPIRED",
  ) {
    super(message);
    this.name = "SyncError";
  }
}

type SteamOwnedGame = {
  appid: number;
  name?: string;
  playtime_forever?: number;
  playtime_2weeks?: number;
  rtime_last_played?: number;
  img_icon_url?: string;
  img_logo_url?: string;
};

type SyncDb = Pick<
  typeof prisma,
  "game" | "playtimeSnapshot" | "user" | "steamLibrarySyncCache"
>;

export interface SyncLibraryResult {
  gamesCount: number;
  syncedAt: Date | null;
  done: boolean;
  processed: number;
  total: number;
}

async function fetchAndCacheGames(userId: string, steamId: string): Promise<SteamOwnedGame[]> {
  const games = await getOwnedGames(steamId);
  const expiresAt = new Date(Date.now() + SYNC_CACHE_TTL_MS);

  await prisma.steamLibrarySyncCache.upsert({
    where: { userId },
    create: { userId, gamesJson: JSON.stringify(games), expiresAt },
    update: { gamesJson: JSON.stringify(games), expiresAt },
  });

  return games;
}

async function getCachedGames(userId: string): Promise<SteamOwnedGame[]> {
  const cache = await prisma.steamLibrarySyncCache.findUnique({ where: { userId } });

  if (!cache || cache.expiresAt < new Date()) {
    throw new SyncError(
      "La sincronización expiró. Pulsa «Sincronizar Steam» de nuevo para continuar.",
      "SYNC_SESSION_EXPIRED",
    );
  }

  return JSON.parse(cache.gamesJson) as SteamOwnedGame[];
}

async function clearSyncCache(userId: string): Promise<void> {
  await prisma.steamLibrarySyncCache.deleteMany({ where: { userId } });
}

async function resolveGamesForChunk(
  userId: string,
  steamId: string,
  offset: number,
): Promise<SteamOwnedGame[]> {
  if (offset === 0) {
    try {
      return await fetchAndCacheGames(userId, steamId);
    } catch (error) {
      if (error instanceof SteamApiError) {
        if (error.message.includes("STEAM_API_KEY")) {
          throw new SyncError(error.message, "CONFIG");
        }
        throw new SyncError(`Error al conectar con Steam: ${error.message}`, "STEAM_API");
      }
      throw error;
    }
  }

  return getCachedGames(userId);
}

export async function syncUserLibrary(
  userId: string,
  steamId: string,
  options: { force?: boolean; offset?: number; limit?: number } = {},
): Promise<SyncLibraryResult> {
  await ensureSqliteOptimizations();

  const offset = Math.max(0, options.offset ?? 0);
  const limit = Math.max(1, options.limit ?? SYNC_CHUNK_SIZE);

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new SyncError("Usuario no encontrado", "NOT_FOUND");
  }

  const userTier = (user as { tier?: string }).tier ?? "free";
  const isOwner = isOwnerTier(userTier);

  if (offset === 0 && !options.force && !isOwner && user.lastSyncAt) {
    const elapsed = Date.now() - user.lastSyncAt.getTime();
    if (elapsed < SYNC_COOLDOWN_MS) {
      const remainingMin = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 60000);
      throw new SyncError(
        `Espera ${remainingMin} minuto(s) antes de sincronizar de nuevo`,
        "COOLDOWN",
      );
    }
  }

  const games = await resolveGamesForChunk(userId, steamId, offset);

  if (games.length === 0) {
    await clearSyncCache(userId);
    throw new SyncError(
      "No se encontraron juegos en tu biblioteca. Ve a Steam → Perfil → Editar perfil → Privacidad y pon «Detalles de los juegos» en Público.",
      "PRIVATE_LIBRARY",
    );
  }

  const syncedAt = new Date();
  const captureDate = getCaptureDate(syncedAt);
  const trackedAppIds = await getTrackedAppIds(userId);
  const slice = games.slice(offset, offset + limit);

  await mapConcurrent(
    slice,
    async (game) => {
      const isNewGame = !trackedAppIds.has(game.appid);
      await upsertGameSnapshot(prisma, userId, game, syncedAt, captureDate, isNewGame);
      if (isNewGame) {
        trackedAppIds.add(game.appid);
      }
    },
    SYNC_PARALLEL_UPSERTS,
  );

  const processedInChunk = slice.length;
  const nextOffset = offset + processedInChunk;
  const done = nextOffset >= games.length;

  if (done) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastSyncAt: syncedAt },
    });
    await clearSyncCache(userId);
    console.log(`[Sync] ${games.length} juegos guardados para userId ${userId}`);
  } else {
    console.log(
      `[Sync] Chunk ${offset}-${nextOffset}/${games.length} para userId ${userId}`,
    );
  }

  return {
    gamesCount: games.length,
    syncedAt: done ? syncedAt : null,
    done,
    processed: processedInChunk,
    total: games.length,
  };
}

async function upsertGameSnapshot(
  db: SyncDb,
  userId: string,
  game: SteamOwnedGame,
  syncedAt: Date,
  captureDate: string,
  isNewGame: boolean,
) {
  const playtimeMinutes = game.playtime_forever ?? 0;
  const playtime2weeksMinutes = game.playtime_2weeks ?? null;

  await db.game.upsert({
    where: { appId: game.appid },
    create: {
      appId: game.appid,
      name: game.name ?? `Juego ${game.appid}`,
      imgIconUrl: game.img_icon_url ?? null,
      imgLogoUrl: game.img_logo_url ?? null,
    },
    update: {
      name: game.name ?? `Juego ${game.appid}`,
      imgIconUrl: game.img_icon_url ?? null,
      imgLogoUrl: game.img_logo_url ?? null,
    },
  });

  if (isNewGame) {
    const previousDate = getPreviousCaptureDate(syncedAt);
    const previousCapturedAt = new Date(syncedAt);
    previousCapturedAt.setUTCDate(previousCapturedAt.getUTCDate() - 1);
    previousCapturedAt.setUTCHours(12, 0, 0, 0);

    await db.playtimeSnapshot.upsert({
      where: {
        userId_appId_captureDate: {
          userId,
          appId: game.appid,
          captureDate: previousDate,
        },
      },
      create: {
        userId,
        appId: game.appid,
        playtimeMinutes: 0,
        lastPlayedAt: null,
        capturedAt: previousCapturedAt,
        captureDate: previousDate,
      },
      update: { playtimeMinutes: 0 },
    });
  }

  await db.playtimeSnapshot.upsert({
    where: {
      userId_appId_captureDate: {
        userId,
        appId: game.appid,
        captureDate,
      },
    },
    create: {
      userId,
      appId: game.appid,
      playtimeMinutes,
      playtime2weeksMinutes,
      lastPlayedAt: game.rtime_last_played
        ? new Date(game.rtime_last_played * 1000)
        : null,
      capturedAt: syncedAt,
      captureDate,
    },
    update: {
      playtimeMinutes,
      playtime2weeksMinutes,
      lastPlayedAt: game.rtime_last_played
        ? new Date(game.rtime_last_played * 1000)
        : null,
      capturedAt: syncedAt,
    },
  });
}

export async function syncSingleGame(
  userId: string,
  steamId: string,
  appId: number,
): Promise<{
  syncedAt: Date;
  gameName: string;
  scansUsedToday: number;
  scansLimit: number;
  scansRemaining: number;
}> {
  await ensureSqliteOptimizations();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new SyncError("Usuario no encontrado", "NOT_FOUND");
  }

  const scanUsage = await getDailyScanUsage(userId);
  if (!scanUsage.unlimited && scanUsage.remaining <= 0) {
    throw new SyncError(
      `Has alcanzado el límite de ${scanUsage.limit} escaneos diarios (plan ${scanUsage.tier}). Mejora tu plan para más escaneos.`,
      "SCAN_LIMIT",
    );
  }

  let games;
  try {
    games = await getOwnedGames(steamId);
  } catch (error) {
    if (error instanceof SteamApiError) {
      if (error.message.includes("STEAM_API_KEY")) {
        throw new SyncError(error.message, "CONFIG");
      }
      throw new SyncError(`Error al conectar con Steam: ${error.message}`, "STEAM_API");
    }
    throw error;
  }

  const game = games.find((g) => g.appid === appId);
  if (!game) {
    throw new SyncError(
      "Juego no encontrado en tu biblioteca de Steam o biblioteca privada.",
      "GAME_NOT_FOUND",
    );
  }

  const syncedAt = new Date();
  const captureDate = getCaptureDate(syncedAt);
  const trackedAppIds = await getTrackedAppIds(userId);
  const isNewGame = !trackedAppIds.has(appId);

  await upsertGameSnapshot(prisma, userId, game, syncedAt, captureDate, isNewGame);

  await recordGameScan(userId, appId, syncedAt);

  const updatedUsage = await getDailyScanUsage(userId);

  console.log(`[Sync] Juego ${appId} sincronizado para userId ${userId}`);

  return {
    syncedAt,
    gameName: game.name ?? `Juego ${appId}`,
    scansUsedToday: updatedUsage.usedToday,
    scansLimit: updatedUsage.unlimited ? -1 : updatedUsage.limit,
    scansRemaining: updatedUsage.unlimited ? -1 : updatedUsage.remaining,
  };
}

export async function syncAllUsers(): Promise<number> {
  const users = await prisma.user.findMany({
    where: { steamId: { not: "" } },
    select: { id: true, steamId: true },
  });

  let synced = 0;
  for (const user of users) {
    try {
      let offset = 0;
      let done = false;
      while (!done) {
        const result = await syncUserLibrary(user.id, user.steamId, {
          force: true,
          offset,
        });
        offset += result.processed;
        done = result.done;
      }
      synced++;
    } catch {
      // Skip users that fail
    }
  }

  return synced;
}
