import { FRIENDS_CACHE_TTL_MS } from "@/lib/constants";
import type { FriendsResponse, Friend } from "@/lib/validators/api";
import { prisma } from "@/lib/prisma";
import { getLatestSnapshotsForLibrary } from "@/repositories/snapshot.repository";
import { getFriendList, getPlayerSummaries } from "@/services/steam.service";
import { minutesToHours } from "@/services/steam.service";

async function getCachedFriends(userId: string) {
  return prisma.steamFriendCache.findMany({
    where: { userId },
    orderBy: { personaName: "asc" },
  });
}

async function isCacheFresh(userId: string): Promise<boolean> {
  const latest = await prisma.steamFriendCache.findFirst({
    where: { userId },
    orderBy: { fetchedAt: "desc" },
    select: { fetchedAt: true },
  });

  if (!latest) return false;
  return Date.now() - latest.fetchedAt.getTime() < FRIENDS_CACHE_TTL_MS;
}

export async function syncFriendsFromSteam(
  userId: string,
  steamId: string,
): Promise<void> {
  const friendList = await getFriendList(steamId);

  if (friendList.length === 0) {
    await prisma.steamFriendCache.deleteMany({ where: { userId } });
    return;
  }

  const friendSteamIds = friendList.map((f) => f.steamid);
  const summaries = await getPlayerSummaries(friendSteamIds);
  const summaryMap = new Map(summaries.map((s) => [s.steamid, s]));
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.steamFriendCache.deleteMany({ where: { userId } });

    for (const friend of friendList) {
      const summary = summaryMap.get(friend.steamid);
      await tx.steamFriendCache.create({
        data: {
          userId,
          friendSteamId: friend.steamid,
          personaName: summary?.personaname ?? `Usuario ${friend.steamid.slice(-4)}`,
          avatarUrl: summary?.avatarfull ?? null,
          fetchedAt: now,
        },
      });
    }
  });
}

async function enrichFriends(cached: Awaited<ReturnType<typeof getCachedFriends>>): Promise<Friend[]> {
  const steamIds = cached.map((f) => f.friendSteamId);

  const platformUsers = await prisma.user.findMany({
    where: { steamId: { in: steamIds } },
    select: {
      id: true,
      steamId: true,
      isProfilePublic: true,
    },
  });

  const platformMap = new Map(platformUsers.map((u) => [u.steamId, u]));

  const enriched: Friend[] = [];

  for (const friend of cached) {
    const platformUser = platformMap.get(friend.friendSteamId);
    let totalHours: number | null = null;
    let totalGames: number | null = null;

    if (platformUser) {
      const snapshots = await getLatestSnapshotsForLibrary(platformUser.id);
      totalGames = snapshots.length;
      totalHours = minutesToHours(
        snapshots.reduce((sum, g) => sum + g.playtimeMinutes, 0),
      );
    }

    enriched.push({
      steamId: friend.friendSteamId,
      personaName: friend.personaName,
      avatarUrl: friend.avatarUrl,
      isOnPlatform: !!platformUser,
      sstaticsUserId: platformUser?.id ?? null,
      sstaticsSteamId: platformUser?.steamId ?? null,
      totalHours,
      totalGames,
      isProfilePublic: platformUser?.isProfilePublic ?? null,
    });
  }

  return enriched;
}

export async function getFriendsForUser(
  userId: string,
  steamId: string,
  options: { forceSync?: boolean } = {},
): Promise<FriendsResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { inviteCode: true },
  });

  if (!user) {
    return { friends: [], lastFetchedAt: null, isPrivate: false, inviteCode: "" };
  }

  const cacheFresh = await isCacheFresh(userId);

  if (options.forceSync || !cacheFresh) {
    try {
      await syncFriendsFromSteam(userId, steamId);
    } catch {
      // If sync fails, use cached data if available
    }
  }

  const cached = await getCachedFriends(userId);
  const lastFetched = cached[0]?.fetchedAt ?? null;

  if (cached.length === 0 && !cacheFresh) {
    return {
      friends: [],
      lastFetchedAt: null,
      isPrivate: true,
      inviteCode: user.inviteCode,
    };
  }

  const friends = await enrichFriends(cached);

  return {
    friends,
    lastFetchedAt: lastFetched?.toISOString() ?? null,
    isPrivate: false,
    inviteCode: user.inviteCode,
  };
}
