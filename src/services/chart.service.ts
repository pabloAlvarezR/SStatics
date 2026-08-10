import { ensureSqliteOptimizations } from "@/lib/prisma";
import { MIN_SNAPSHOTS_FOR_CHART } from "@/lib/constants";
import { calculatePlaytimeProgress } from "@/lib/playtime-progress";
import type { ChartPoint, GameHistory, LibraryGame } from "@/lib/validators/api";
import {
  countUserSnapshots,
  getGameSnapshotHistory,
  getLatestSnapshotsForLibrary,
  getSparklineDataForLibrary,
} from "@/repositories/snapshot.repository";
import { minutesToHours } from "@/services/steam.service";
import { prisma } from "@/lib/prisma";

function buildChartPoints(
  snapshots: { capturedAt: Date; captureDate?: string; playtimeMinutes: number }[],
): ChartPoint[] {
  const sorted = [...snapshots].sort(
    (a, b) => a.capturedAt.getTime() - b.capturedAt.getTime(),
  );

  return sorted.map((s) => ({
    date: s.captureDate ?? s.capturedAt.toISOString().split("T")[0],
    hours: minutesToHours(s.playtimeMinutes),
  }));
}

function buildLibraryGame(
  latest: {
    appId: number;
    name: string;
    imgIconUrl: string | null;
    imgLogoUrl: string | null;
    playtimeMinutes: number;
    playtime2weeksMinutes: number | null;
    lastPlayedAt: Date | null;
  },
  sparklineSnapshots: { capturedAt: Date; playtimeMinutes: number }[],
): LibraryGame {
  const sparkline = buildChartPoints(sparklineSnapshots);
  const hasChartData = sparklineSnapshots.length >= MIN_SNAPSHOTS_FOR_CHART;

  return {
    appId: latest.appId,
    name: latest.name,
    imgIconUrl: latest.imgIconUrl,
    imgLogoUrl: latest.imgLogoUrl,
    totalHours: minutesToHours(latest.playtimeMinutes),
    hours2weeks: latest.playtime2weeksMinutes
      ? minutesToHours(latest.playtime2weeksMinutes)
      : null,
    lastPlayedAt: latest.lastPlayedAt?.toISOString() ?? null,
    hasChartData,
    progress: hasChartData ? calculatePlaytimeProgress(sparkline) : null,
    sparkline,
  };
}

export async function getLibraryForUser(userId: string): Promise<{
  games: LibraryGame[];
  lastSyncAt: string | null;
  needsSync: boolean;
}> {
  await ensureSqliteOptimizations();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastSyncAt: true },
  });

  if (!user) {
    return { games: [], lastSyncAt: null, needsSync: true };
  }

  const snapshotCount = await countUserSnapshots(userId);

  if (snapshotCount === 0) {
    return {
      games: [],
      lastSyncAt: user.lastSyncAt?.toISOString() ?? null,
      needsSync: true,
    };
  }

  const latestSnapshots = await getLatestSnapshotsForLibrary(userId);
  const appIds = latestSnapshots.map((s) => s.appId);
  const sparklineMap = await getSparklineDataForLibrary(userId, appIds);

  const games: LibraryGame[] = latestSnapshots.map((latest) => {
    const sparklineData = sparklineMap.get(latest.appId) ?? [
      { appId: latest.appId, capturedAt: latest.capturedAt, playtimeMinutes: latest.playtimeMinutes },
    ];
    return buildLibraryGame(latest, sparklineData);
  });

  return {
    games,
    lastSyncAt: user.lastSyncAt?.toISOString() ?? null,
    needsSync: false,
  };
}

export async function getGameHistory(userId: string, appId: number): Promise<GameHistory | null> {
  await ensureSqliteOptimizations();

  const game = await prisma.game.findUnique({ where: { appId } });
  if (!game) return null;

  const snapshots = await getGameSnapshotHistory(userId, appId);
  if (snapshots.length === 0) return null;

  const latest = snapshots[snapshots.length - 1];
  const points = buildChartPoints(snapshots);
  const hasChartData = snapshots.length >= MIN_SNAPSHOTS_FOR_CHART;

  return {
    appId,
    name: game.name,
    imgIconUrl: game.imgIconUrl,
    imgLogoUrl: game.imgLogoUrl,
    totalHours: minutesToHours(latest.playtimeMinutes),
    lastPlayedAt: latest.lastPlayedAt?.toISOString() ?? null,
    hasChartData,
    progress: hasChartData ? calculatePlaytimeProgress(points) : null,
    points,
  };
}
