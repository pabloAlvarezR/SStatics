import {
  STEAM_FRIEND_GAME_CACHE_TTL_MS,
  STEAM_FRIEND_GAME_REFRESH_MAX,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getOwnedGamePlaytime, type SteamGamePlaytime } from "@/services/steam.service";

export interface CachedSteamFriendGame {
  friendSteamId: string;
  playtimeMinutes: number | null;
  hasData: boolean;
  fetchedAt: Date;
}

function isCacheFresh(fetchedAt: Date): boolean {
  return Date.now() - fetchedAt.getTime() < STEAM_FRIEND_GAME_CACHE_TTL_MS;
}

export async function getCachedSteamFriendGames(
  userId: string,
  appId: number,
  friendSteamIds: string[],
): Promise<Map<string, CachedSteamFriendGame>> {
  const map = new Map<string, CachedSteamFriendGame>();
  if (friendSteamIds.length === 0) return map;

  const rows = await prisma.steamFriendGameCache.findMany({
    where: {
      userId,
      appId,
      friendSteamId: { in: friendSteamIds },
    },
  });

  for (const row of rows) {
    map.set(row.friendSteamId, {
      friendSteamId: row.friendSteamId,
      playtimeMinutes: row.playtimeMinutes,
      hasData: row.hasData,
      fetchedAt: row.fetchedAt,
    });
  }

  return map;
}

async function upsertSteamFriendGameCache(
  userId: string,
  friendSteamId: string,
  appId: number,
  playtime: SteamGamePlaytime | null,
): Promise<void> {
  const hasData = playtime !== null;
  const now = new Date();

  await prisma.steamFriendGameCache.upsert({
    where: {
      userId_friendSteamId_appId: { userId, friendSteamId, appId },
    },
    create: {
      userId,
      friendSteamId,
      appId,
      playtimeMinutes: playtime?.playtimeMinutes ?? null,
      hasData,
      fetchedAt: now,
    },
    update: {
      playtimeMinutes: playtime?.playtimeMinutes ?? null,
      hasData,
      fetchedAt: now,
    },
  });
}

/**
 * Refresca entradas caducadas o inexistentes con límite por petición.
 * Devuelve cuántas entradas siguen pendientes de refresco.
 */
export async function refreshStaleSteamFriendGames(
  userId: string,
  appId: number,
  friendSteamIds: string[],
  cached: Map<string, CachedSteamFriendGame>,
): Promise<{ refreshed: number; pending: number }> {
  const staleOrMissing = friendSteamIds.filter((steamId) => {
    const entry = cached.get(steamId);
    return !entry || !isCacheFresh(entry.fetchedAt);
  });

  if (staleOrMissing.length === 0) {
    return { refreshed: 0, pending: 0 };
  }

  const toRefresh = staleOrMissing.slice(0, STEAM_FRIEND_GAME_REFRESH_MAX);
  let refreshed = 0;

  for (const friendSteamId of toRefresh) {
    try {
      const playtime = await getOwnedGamePlaytime(friendSteamId, appId);
      await upsertSteamFriendGameCache(userId, friendSteamId, appId, playtime);
      cached.set(friendSteamId, {
        friendSteamId,
        playtimeMinutes: playtime?.playtimeMinutes ?? null,
        hasData: playtime !== null,
        fetchedAt: new Date(),
      });
      refreshed++;
    } catch (error) {
      console.warn(
        `[Steam] Cache refresh falló para ${friendSteamId} app ${appId}:`,
        error,
      );
    }
  }

  return {
    refreshed,
    pending: Math.max(0, staleOrMissing.length - toRefresh.length),
  };
}
