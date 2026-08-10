import type { LeaderboardResponse } from "@/lib/validators/api";
import { rankFriendsLeaderboardEntries } from "@/lib/leaderboard-rank";
import { prisma } from "@/lib/prisma";
import { getUserHoursDelta, getLatestSnapshotsForLibrary } from "@/repositories/snapshot.repository";
import { minutesToHours } from "@/services/steam.service";
import { getFriendsForUser } from "@/services/friends.service";

export async function getFriendsLeaderboard(userId: string): Promise<LeaderboardResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      steamId: true,
      personaName: true,
      avatarUrl: true,
      isProfilePublic: true,
      inviteCode: true,
    },
  });

  if (!user) {
    return {
      scope: "friends",
      entries: [],
      generatedAt: new Date().toISOString(),
      inviteCode: null,
    };
  }

  const friendsData = await getFriendsForUser(userId, user.steamId);
  const platformFriends = friendsData.friends.filter(
    (f) => f.isOnPlatform && f.sstaticsUserId,
  );

  const candidates: {
    userId: string;
    steamId: string;
    personaName: string;
    avatarUrl: string | null;
    isProfilePublic: boolean;
    isCurrentUser: boolean;
  }[] = [
    {
      userId: user.id,
      steamId: user.steamId,
      personaName: user.personaName,
      avatarUrl: user.avatarUrl,
      isProfilePublic: user.isProfilePublic,
      isCurrentUser: true,
    },
    ...platformFriends.map((f) => ({
      userId: f.sstaticsUserId!,
      steamId: f.steamId,
      personaName: f.personaName,
      avatarUrl: f.avatarUrl,
      isProfilePublic: f.isProfilePublic ?? false,
      isCurrentUser: false,
    })),
  ];

  const unique = new Map<string, (typeof candidates)[number]>();
  for (const c of candidates) {
    unique.set(c.userId, c);
  }

  const scored = await Promise.all(
    [...unique.values()].map(async (c) => {
      const [hoursGainedMinutes, latest] = await Promise.all([
        getUserHoursDelta(c.userId, 7),
        getLatestSnapshotsForLibrary(c.userId),
      ]);
      const totalMinutes = latest.reduce((sum, g) => sum + g.playtimeMinutes, 0);
      return {
        steamId: c.steamId,
        personaName: c.personaName,
        avatarUrl: c.avatarUrl,
        hoursGained7d: minutesToHours(hoursGainedMinutes),
        totalHours: minutesToHours(totalMinutes),
        isProfilePublic: c.isProfilePublic,
        isCurrentUser: c.isCurrentUser,
      };
    }),
  );

  scored.sort(
    (a, b) =>
      b.hoursGained7d - a.hoursGained7d ||
      b.totalHours - a.totalHours ||
      a.personaName.localeCompare(b.personaName, "es"),
  );

  const ranks = rankFriendsLeaderboardEntries(scored);
  const rankMap = new Map(ranks.map((r) => [r.steamId, r.rank]));

  return {
    scope: "friends",
    entries: scored.map((entry) => ({
      rank: rankMap.get(entry.steamId) ?? 0,
      ...entry,
    })),
    generatedAt: new Date().toISOString(),
    inviteCode: user.inviteCode,
  };
}
