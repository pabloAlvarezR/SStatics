import { MIN_SNAPSHOTS_FOR_CHART, STEAM_FRIEND_GAME_CACHE_TTL_MS } from "@/lib/constants";
import { calculatePlaytimeProgress } from "@/lib/playtime-progress";
import type { GameFriendComparison, GameFriendsComparisonResponse } from "@/lib/validators/api";
import { prisma } from "@/lib/prisma";
import { getGameSnapshotHistoryForUsers } from "@/repositories/snapshot.repository";
import {
  getCachedSteamFriendGames,
  refreshStaleSteamFriendGames,
} from "@/services/steam-friend-game-cache.service";
import { minutesToHours } from "@/services/steam.service";

function buildChartPoints(
  snapshots: { capturedAt: Date; playtimeMinutes: number }[],
) {
  return snapshots.map((s) => ({
    date: s.capturedAt.toISOString().split("T")[0],
    hours: minutesToHours(s.playtimeMinutes),
  }));
}

function buildEmptyFriend(
  friend: { friendSteamId: string; personaName: string; avatarUrl: string | null },
  platformUser?: { isProfilePublic: boolean },
): GameFriendComparison {
  return {
    steamId: friend.friendSteamId,
    personaName: friend.personaName,
    avatarUrl: friend.avatarUrl,
    isOnPlatform: !!platformUser,
    hasGameData: false,
    isProfilePublic: platformUser?.isProfilePublic ?? null,
    hoursSource: null,
    totalHours: null,
    hasChartData: false,
    canCompareOnChart: false,
    progress: null,
    points: [],
  };
}

function applySteamCacheToFriend(
  friend: GameFriendComparison,
  cached: { hasData: boolean; playtimeMinutes: number | null },
): void {
  if (friend.hasGameData || !cached.hasData || cached.playtimeMinutes == null) return;

  friend.hasGameData = true;
  friend.hoursSource = "steam";
  friend.totalHours = minutesToHours(cached.playtimeMinutes);
}

export async function getFriendsGameComparison(
  userId: string,
  appId: number,
  options: { cacheOnly?: boolean } = {},
): Promise<GameFriendsComparisonResponse> {
  const cached = await prisma.steamFriendCache.findMany({
    where: { userId },
    orderBy: { personaName: "asc" },
  });

  if (cached.length === 0) {
    return {
      appId,
      friends: [],
      friendsOnPlatform: 0,
      friendsWithData: 0,
      steamRefreshPending: 0,
    };
  }

  const steamIds = cached.map((f) => f.friendSteamId);
  const platformUsers = await prisma.user.findMany({
    where: { steamId: { in: steamIds } },
    select: { id: true, steamId: true, isProfilePublic: true },
  });
  const platformMap = new Map(platformUsers.map((u) => [u.steamId, u]));

  const historiesMap = await getGameSnapshotHistoryForUsers(
    platformUsers.map((u) => u.id),
    appId,
  );

  const friends: GameFriendComparison[] = cached.map((friend) => {
    const platformUser = platformMap.get(friend.friendSteamId);
    const snapshots = platformUser ? (historiesMap.get(platformUser.id) ?? []) : [];

    if (snapshots.length === 0) {
      return buildEmptyFriend(friend, platformUser);
    }

    const latest = snapshots[snapshots.length - 1];
    const points = buildChartPoints(snapshots);
    const hasChartData = snapshots.length >= MIN_SNAPSHOTS_FOR_CHART;
    const canShareHistory = platformUser!.isProfilePublic;

    return {
      steamId: friend.friendSteamId,
      personaName: friend.personaName,
      avatarUrl: friend.avatarUrl,
      isOnPlatform: true,
      hasGameData: true,
      isProfilePublic: platformUser!.isProfilePublic,
      hoursSource: "sstatics",
      totalHours: minutesToHours(latest.playtimeMinutes),
      hasChartData,
      canCompareOnChart: hasChartData && canShareHistory,
      progress: hasChartData && canShareHistory ? calculatePlaytimeProgress(points) : null,
      points: canShareHistory ? points : [],
    };
  });

  const needsSteamLookup = friends
    .filter((f) => !f.hasGameData)
    .map((f) => f.steamId);

  let steamRefreshPending = 0;

  if (needsSteamLookup.length > 0) {
    const steamCache = await getCachedSteamFriendGames(userId, appId, needsSteamLookup);

    for (const friend of friends) {
      if (friend.hasGameData) continue;
      const entry = steamCache.get(friend.steamId);
      if (entry) applySteamCacheToFriend(friend, entry);
    }

    if (!options.cacheOnly) {
      const stillMissing = friends
        .filter((f) => !f.hasGameData)
        .map((f) => f.steamId);

      const { pending } = await refreshStaleSteamFriendGames(
        userId,
        appId,
        stillMissing,
        steamCache,
      );
      steamRefreshPending = pending;

      for (const friend of friends) {
        if (friend.hasGameData) continue;
        const entry = steamCache.get(friend.steamId);
        if (entry) applySteamCacheToFriend(friend, entry);
      }
    } else {
      const now = Date.now();
      steamRefreshPending = needsSteamLookup.filter((steamId) => {
        const entry = steamCache.get(steamId);
        return !entry || now - entry.fetchedAt.getTime() >= STEAM_FRIEND_GAME_CACHE_TTL_MS;
      }).length;
    }
  }

  friends.sort((a, b) => {
    if (a.hasGameData !== b.hasGameData) return a.hasGameData ? -1 : 1;
    return (b.totalHours ?? 0) - (a.totalHours ?? 0);
  });

  return {
    appId,
    friends,
    friendsOnPlatform: friends.filter((f) => f.isOnPlatform).length,
    friendsWithData: friends.filter((f) => f.hasGameData).length,
    steamRefreshPending,
  };
}
