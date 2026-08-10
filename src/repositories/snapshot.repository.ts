import { collectArtificialEntryIds, omitArtificialLeadingEntry } from "@/lib/artificial-entry-snapshots";
import { prisma } from "@/lib/prisma";

export interface LatestGameSnapshot {
  appId: number;
  name: string;
  imgIconUrl: string | null;
  imgLogoUrl: string | null;
  playtimeMinutes: number;
  playtime2weeksMinutes: number | null;
  lastPlayedAt: Date | null;
  capturedAt: Date;
}

export interface SnapshotPoint {
  appId: number;
  capturedAt: Date;
  captureDate: string;
  playtimeMinutes: number;
  lastPlayedAt?: Date | null;
}

function toUtcDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getCaptureDate(date: Date = new Date()): string {
  return toUtcDateString(date);
}

/**
 * Elimina snapshots artificiales «ayer = 0 h» (patrón del sync antiguo).
 * Idempotente; seguro llamarlo al leer biblioteca o al sincronizar.
 */
export async function purgeArtificialEntrySnapshots(
  userId: string,
  appId?: number,
): Promise<number> {
  const snapshots = await prisma.playtimeSnapshot.findMany({
    where: {
      userId,
      ...(appId != null ? { appId } : {}),
    },
    select: { id: true, appId: true, captureDate: true, playtimeMinutes: true },
    orderBy: [{ appId: "asc" }, { captureDate: "asc" }],
  });

  const idsToDelete = collectArtificialEntryIds(snapshots);
  if (idsToDelete.length === 0) return 0;

  await prisma.playtimeSnapshot.deleteMany({
    where: { id: { in: idsToDelete } },
  });
  console.log(
    `[Snapshots] Eliminados ${idsToDelete.length} artificiales (0 h de entrada) para userId ${userId}`,
  );
  return idsToDelete.length;
}

/** Último snapshot por juego — incluye juegos con 0 h (Prisma, compatible PG/SQLite) */
export async function getLatestSnapshotsForLibrary(
  userId: string,
): Promise<LatestGameSnapshot[]> {
  const latestPerApp = await prisma.playtimeSnapshot.groupBy({
    by: ["appId"],
    where: { userId },
    _max: { capturedAt: true },
  });

  if (latestPerApp.length === 0) return [];

  const rows = await prisma.playtimeSnapshot.findMany({
    where: {
      userId,
      OR: latestPerApp.map((entry) => ({
        appId: entry.appId,
        capturedAt: entry._max.capturedAt!,
      })),
    },
    include: {
      game: {
        select: {
          appId: true,
          name: true,
          imgIconUrl: true,
          imgLogoUrl: true,
        },
      },
    },
  });

  return rows
    .map((row) => ({
      appId: row.appId,
      name: row.game.name,
      imgIconUrl: row.game.imgIconUrl,
      imgLogoUrl: row.game.imgLogoUrl,
      playtimeMinutes: row.playtimeMinutes,
      playtime2weeksMinutes: row.playtime2weeksMinutes,
      lastPlayedAt: row.lastPlayedAt,
      capturedAt: row.capturedAt,
    }))
    .sort(
      (a, b) =>
        b.playtimeMinutes - a.playtimeMinutes || a.name.localeCompare(b.name, "es"),
    );
}

/** Historial completo para sparklines de biblioteca */
export async function getSparklineDataForLibrary(
  userId: string,
  appIds: number[],
): Promise<Map<number, SnapshotPoint[]>> {
  const result = new Map<number, SnapshotPoint[]>();
  if (appIds.length === 0) return result;

  const rows = await prisma.playtimeSnapshot.findMany({
    where: { userId, appId: { in: appIds } },
    select: {
      appId: true,
      capturedAt: true,
      captureDate: true,
      playtimeMinutes: true,
    },
    orderBy: [{ appId: "asc" }, { captureDate: "asc" }],
  });

  for (const row of rows) {
    const list = result.get(row.appId) ?? [];
    list.push(row);
    result.set(row.appId, list);
  }

  for (const [appId, list] of result) {
    result.set(appId, omitArtificialLeadingEntry(list));
  }

  return result;
}

/** Historial completo para vista detalle de un juego */
export async function getGameSnapshotHistory(
  userId: string,
  appId: number,
): Promise<SnapshotPoint[]> {
  const rows = await prisma.playtimeSnapshot.findMany({
    where: { userId, appId },
    select: {
      appId: true,
      capturedAt: true,
      captureDate: true,
      playtimeMinutes: true,
      lastPlayedAt: true,
    },
    orderBy: { captureDate: "asc" },
  });

  return omitArtificialLeadingEntry(rows);
}

/** Historial de un juego para varios usuarios (comparación con amigos) */
export async function getGameSnapshotHistoryForUsers(
  userIds: string[],
  appId: number,
): Promise<Map<string, SnapshotPoint[]>> {
  const result = new Map<string, SnapshotPoint[]>();
  if (userIds.length === 0) return result;

  const rows = await prisma.playtimeSnapshot.findMany({
    where: { userId: { in: userIds }, appId },
    select: {
      userId: true,
      appId: true,
      capturedAt: true,
      captureDate: true,
      playtimeMinutes: true,
      lastPlayedAt: true,
    },
    orderBy: [{ userId: "asc" }, { captureDate: "asc" }],
  });

  for (const row of rows) {
    const list = result.get(row.userId) ?? [];
    list.push({
      appId: row.appId,
      capturedAt: row.capturedAt,
      captureDate: row.captureDate,
      playtimeMinutes: row.playtimeMinutes,
      lastPlayedAt: row.lastPlayedAt,
    });
    result.set(row.userId, list);
  }

  for (const [userId, list] of result) {
    result.set(userId, omitArtificialLeadingEntry(list));
  }

  return result;
}

export async function countUserSnapshots(userId: string): Promise<number> {
  return prisma.playtimeSnapshot.count({ where: { userId } });
}

export async function getUserLatestSnapshots(userId: string) {
  return getLatestSnapshotsForLibrary(userId);
}

export async function getAllUsersLibraryTotals(): Promise<
  { userId: string; totalMinutes: number; gameCount: number }[]
> {
  const users = await prisma.user.findMany({
    select: { id: true },
  });

  const totals = await Promise.all(
    users.map(async (user) => {
      const latest = await getLatestSnapshotsForLibrary(user.id);
      return {
        userId: user.id,
        totalMinutes: latest.reduce((sum, g) => sum + g.playtimeMinutes, 0),
        gameCount: latest.length,
      };
    }),
  );

  return totals.filter((t) => t.gameCount > 0);
}

export async function getUserHoursDelta(userId: string, daysAgo: number): Promise<number> {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - daysAgo);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const latest = await getLatestSnapshotsForLibrary(userId);
  if (latest.length === 0) return 0;

  const appIds = latest.map((g) => g.appId);

  const pastSnapshots = await prisma.playtimeSnapshot.findMany({
    where: {
      userId,
      appId: { in: appIds },
      captureDate: { lte: cutoffStr },
    },
    select: { appId: true, playtimeMinutes: true, capturedAt: true },
    orderBy: { capturedAt: "desc" },
  });

  const pastMap = new Map<number, number>();
  for (const s of pastSnapshots) {
    if (!pastMap.has(s.appId)) {
      pastMap.set(s.appId, s.playtimeMinutes);
    }
  }

  let deltaMinutes = 0;
  for (const game of latest) {
    const pastMinutes = pastMap.get(game.appId) ?? game.playtimeMinutes;
    deltaMinutes += Math.max(0, game.playtimeMinutes - pastMinutes);
  }

  return deltaMinutes;
}

export async function getDailyActivityDeltas(
  userId: string,
  days: number,
): Promise<{ date: string; hours: number }[]> {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);

  const snapshots = await prisma.playtimeSnapshot.findMany({
    where: { userId, capturedAt: { gte: cutoff } },
    select: { appId: true, captureDate: true, playtimeMinutes: true },
    orderBy: [{ appId: "asc" }, { captureDate: "asc" }],
  });

  const byApp = new Map<number, { captureDate: string; playtimeMinutes: number }[]>();
  for (const s of snapshots) {
    const list = byApp.get(s.appId) ?? [];
    list.push({ captureDate: s.captureDate, playtimeMinutes: s.playtimeMinutes });
    byApp.set(s.appId, list);
  }

  const byDateApp = new Map<string, Map<number, number>>();
  for (const [appId, list] of byApp) {
    for (const s of omitArtificialLeadingEntry(list)) {
      if (!byDateApp.has(s.captureDate)) byDateApp.set(s.captureDate, new Map());
      byDateApp.get(s.captureDate)!.set(appId, s.playtimeMinutes);
    }
  }

  const dates = [...byDateApp.keys()].sort();
  const result: { date: string; hours: number }[] = [];

  for (let i = 1; i < dates.length; i++) {
    const prev = byDateApp.get(dates[i - 1])!;
    const curr = byDateApp.get(dates[i])!;
    let deltaMinutes = 0;
    for (const [appId, minutes] of curr) {
      const prevMinutes = prev.get(appId) ?? minutes;
      deltaMinutes += Math.max(0, minutes - prevMinutes);
    }
    result.push({ date: dates[i], hours: Math.round((deltaMinutes / 60) * 10) / 10 });
  }

  return result;
}

export async function getUserHours7dDelta(userId: string): Promise<number> {
  return getUserHoursDelta(userId, 7);
}
