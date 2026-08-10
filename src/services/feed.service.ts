import type { FeedResponse } from "@/lib/validators/api";
import { getLibraryForUser } from "@/services/chart.service";
import { getFriendActivitySnippets } from "@/services/social.service";
import { prisma } from "@/lib/prisma";

const DEFAULT_FEED_LIMIT = 8;

export async function getRecentGamesFeed(
  userId: string,
  limit = DEFAULT_FEED_LIMIT,
): Promise<FeedResponse> {
  const library = await getLibraryForUser(userId);

  const withLastPlayed = library.games.filter((g) => g.lastPlayedAt !== null);

  const recent = [...withLastPlayed]
    .sort(
      (a, b) =>
        new Date(b.lastPlayedAt!).getTime() - new Date(a.lastPlayedAt!).getTime(),
    )
    .slice(0, limit);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { steamId: true },
  });

  const friendActivity = user
    ? await getFriendActivitySnippets(userId, user.steamId, 3)
    : [];

  return {
    games: recent,
    lastSyncAt: library.lastSyncAt,
    generatedAt: new Date().toISOString(),
    totalRecent: withLastPlayed.length,
    friendActivity,
  };
}
