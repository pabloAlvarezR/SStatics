import { MIN_USERS_FOR_PERCENTILES } from "@/lib/constants";
import type { StatsResponse } from "@/lib/validators/api";
import { prisma } from "@/lib/prisma";
import {
  getAllUsersLibraryTotals,
  getDailyActivityDeltas,
  getLatestSnapshotsForLibrary,
  getSparklineDataForLibrary,
  getUserHoursDelta,
} from "@/repositories/snapshot.repository";
import { minutesToHours } from "@/services/steam.service";

function calcPercentile(userValue: number, allValues: number[]): number | null {
  if (allValues.length < MIN_USERS_FOR_PERCENTILES) return null;
  const sorted = [...allValues].sort((a, b) => b - a);
  const rank = sorted.findIndex((v) => userValue >= v);
  const percentile = ((sorted.length - rank) / sorted.length) * 100;
  return Math.round(percentile);
}

function calcActivityStreak(heatmap: { date: string; hours: number }[]): number {
  let streak = 0;
  for (let i = heatmap.length - 1; i >= 0; i--) {
    if (heatmap[i].hours > 0) streak++;
    else break;
  }
  return streak;
}

export async function getUserStats(userId: string): Promise<StatsResponse> {
  const [user, latestGames, allTotals, platformUserCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, lastSyncAt: true },
    }),
    getLatestSnapshotsForLibrary(userId),
    getAllUsersLibraryTotals(),
    prisma.user.count(),
  ]);

  const totalMinutes = latestGames.reduce((sum, g) => sum + g.playtimeMinutes, 0);
  const totalHours = minutesToHours(totalMinutes);
  const totalGames = latestGames.length;
  const gamesWithHours = latestGames.filter((g) => g.playtimeMinutes > 0).length;
  const gamesUnplayed = totalGames - gamesWithHours;
  const backlogCount = latestGames.filter(
    (g) => g.playtimeMinutes === 0 || !g.lastPlayedAt,
  ).length;

  const [hours48m, hours7m, hours14m, hours30m] = await Promise.all([
    getUserHoursDelta(userId, 2),
    getUserHoursDelta(userId, 7),
    getUserHoursDelta(userId, 14),
    getUserHoursDelta(userId, 30),
  ]);

  const hours2weeksSteam = minutesToHours(
    latestGames.reduce((sum, g) => sum + (g.playtime2weeksMinutes ?? 0), 0),
  );

  const avgHoursPerGame = totalGames > 0 ? Math.round((totalHours / totalGames) * 10) / 10 : 0;

  const sortedByHours = [...latestGames].sort((a, b) => b.playtimeMinutes - a.playtimeMinutes);
  const topGameRaw = sortedByHours[0];
  const topGame = topGameRaw
    ? {
        appId: topGameRaw.appId,
        name: topGameRaw.name,
        totalHours: minutesToHours(topGameRaw.playtimeMinutes),
      }
    : null;

  const sortedByRecent = [...latestGames]
    .filter((g) => g.lastPlayedAt)
    .sort((a, b) => b.lastPlayedAt!.getTime() - a.lastPlayedAt!.getTime());
  const recentGameRaw = sortedByRecent[0];
  const recentGame = recentGameRaw?.lastPlayedAt
    ? {
        appId: recentGameRaw.appId,
        name: recentGameRaw.name,
        lastPlayedAt: recentGameRaw.lastPlayedAt.toISOString(),
      }
    : null;

  const top5 = sortedByHours.slice(0, 5);
  const topAppIds = top5.map((g) => g.appId);
  const sparklineMap = await getSparklineDataForLibrary(userId, topAppIds);

  const topGames = top5.map((g) => ({
    appId: g.appId,
    name: g.name,
    totalHours: minutesToHours(g.playtimeMinutes),
    sparkline: (sparklineMap.get(g.appId) ?? []).map((s) => ({
      date: s.capturedAt.toISOString().split("T")[0],
      hours: minutesToHours(s.playtimeMinutes),
    })),
  }));

  const activityHeatmap = await getDailyActivityDeltas(userId, 30);
  const activityStreak = calcActivityStreak(activityHeatmap);

  const hours7d = minutesToHours(hours7m);
  const hours14dPrev = minutesToHours(hours14m - hours7m);
  const weeklyGrowthPercent =
    hours14dPrev > 0
      ? Math.round(((hours7d - hours14dPrev) / hours14dPrev) * 100)
      : hours7d > 0
        ? 100
        : null;

  const userTotals = allTotals.find((t) => t.userId === userId);
  const allHours = allTotals.map((t) => minutesToHours(t.totalMinutes));
  const allGameCounts = allTotals.map((t) => t.gameCount);

  const allHours7d = await Promise.all(
    allTotals.map(async (t) => minutesToHours(await getUserHoursDelta(t.userId, 7))),
  );

  const percentilesAvailable = platformUserCount >= MIN_USERS_FOR_PERCENTILES;

  const accountAgeDays = user
    ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const daysSinceSync = user?.lastSyncAt
    ? Math.floor((Date.now() - user.lastSyncAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    totalHours,
    totalGames,
    gamesWithHours,
    gamesUnplayed,
    hours48h: minutesToHours(hours48m),
    hours7d,
    hours14d: minutesToHours(hours14m),
    hours30d: minutesToHours(hours30m),
    hours2weeksSteam,
    avgHoursPerGame,
    backlogCount,
    activityStreak,
    weeklyGrowthPercent,
    topGame,
    recentGame,
    topGames,
    activityHeatmap,
    percentiles: {
      available: percentilesAvailable,
      hoursTotal: userTotals
        ? calcPercentile(minutesToHours(userTotals.totalMinutes), allHours)
        : null,
      gamesCount: userTotals
        ? calcPercentile(userTotals.gameCount, allGameCounts)
        : null,
      hours7d: userTotals
        ? calcPercentile(hours7d, allHours7d)
        : null,
    },
    accountAgeDays,
    daysSinceSync,
    platformUserCount,
  };
}

export async function getPublicUserStats(userId: string): Promise<StatsResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isProfilePublic: true, showStatsOnProfile: true },
  });

  if (!user?.isProfilePublic || !user.showStatsOnProfile) return null;

  return getUserStats(userId);
}
