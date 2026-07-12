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
  playtimeMinutes: number;
  lastPlayedAt?: Date | null;
}

function toUtcDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getCaptureDate(date: Date = new Date()): string {
  return toUtcDateString(date);
}

export function getPreviousCaptureDate(date: Date = new Date()): string {
  const previous = new Date(date);
  previous.setUTCDate(previous.getUTCDate() - 1);
  return toUtcDateString(previous);
}

/** AppIds que el usuario ya tiene en su historial */
export async function getTrackedAppIds(userId: string): Promise<Set<number>> {
  const rows = await prisma.playtimeSnapshot.findMany({
    where: { userId },
    select: { appId: true },
    distinct: ["appId"],
  });
  return new Set(rows.map((r) => r.appId));
}

function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Último snapshot por juego — incluye juegos con 0 h */
export async function getLatestSnapshotsForLibrary(
  userId: string,
): Promise<LatestGameSnapshot[]> {
  const rows = await prisma.$queryRaw<
    {
      appId: number;
      name: string;
      imgIconUrl: string | null;
      imgLogoUrl: string | null;
      playtimeMinutes: number | bigint;
      playtime2weeksMinutes: number | bigint | null;
      lastPlayedAt: Date | null;
      capturedAt: Date;
    }[]
  >`
    SELECT
      g.appId,
      g.name,
      g.imgIconUrl,
      g.imgLogoUrl,
      ps.playtimeMinutes,
      ps.playtime2weeksMinutes,
      ps.lastPlayedAt,
      ps.capturedAt
    FROM PlaytimeSnapshot ps
    INNER JOIN Game g ON g.appId = ps.appId
    INNER JOIN (
      SELECT appId, MAX(capturedAt) AS maxCaptured
      FROM PlaytimeSnapshot
      WHERE userId = ${userId}
      GROUP BY appId
    ) latest ON ps.appId = latest.appId AND ps.capturedAt = latest.maxCaptured
    WHERE ps.userId = ${userId}
    ORDER BY ps.playtimeMinutes DESC, g.name ASC
  `;

  return rows.map((row) => ({
    appId: toNumber(row.appId),
    name: row.name,
    imgIconUrl: row.imgIconUrl,
    imgLogoUrl: row.imgLogoUrl,
    playtimeMinutes: toNumber(row.playtimeMinutes),
    playtime2weeksMinutes:
      row.playtime2weeksMinutes == null ? null : toNumber(row.playtime2weeksMinutes),
    lastPlayedAt: row.lastPlayedAt,
    capturedAt: row.capturedAt,
  }));
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
    select: { appId: true, capturedAt: true, playtimeMinutes: true },
    orderBy: [{ appId: "asc" }, { capturedAt: "asc" }],
  });

  for (const row of rows) {
    const list = result.get(row.appId) ?? [];
    list.push(row);
    result.set(row.appId, list);
  }

  return result;
}

/** Historial completo para vista detalle de un juego */
export async function getGameSnapshotHistory(
  userId: string,
  appId: number,
): Promise<SnapshotPoint[]> {
  return prisma.playtimeSnapshot.findMany({
    where: { userId, appId },
    select: {
      appId: true,
      capturedAt: true,
      playtimeMinutes: true,
      lastPlayedAt: true,
    },
    orderBy: { capturedAt: "asc" },
  });
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
      playtimeMinutes: true,
      lastPlayedAt: true,
    },
    orderBy: [{ userId: "asc" }, { capturedAt: "asc" }],
  });

  for (const row of rows) {
    const list = result.get(row.userId) ?? [];
    list.push({
      appId: row.appId,
      capturedAt: row.capturedAt,
      playtimeMinutes: row.playtimeMinutes,
      lastPlayedAt: row.lastPlayedAt,
    });
    result.set(row.userId, list);
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
  const rows = await prisma.$queryRaw<
    { userId: string; totalMinutes: number | bigint; gameCount: number | bigint }[]
  >`
    SELECT
      ps.userId,
      SUM(ps.playtimeMinutes) AS totalMinutes,
      COUNT(DISTINCT ps.appId) AS gameCount
    FROM PlaytimeSnapshot ps
    INNER JOIN (
      SELECT userId, appId, MAX(capturedAt) AS maxCaptured
      FROM PlaytimeSnapshot
      GROUP BY userId, appId
    ) latest ON ps.userId = latest.userId
      AND ps.appId = latest.appId
      AND ps.capturedAt = latest.maxCaptured
    GROUP BY ps.userId
  `;

  return rows.map((row) => ({
    userId: row.userId,
    totalMinutes: toNumber(row.totalMinutes),
    gameCount: toNumber(row.gameCount),
  }));
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
    orderBy: [{ captureDate: "asc" }, { appId: "asc" }],
  });

  const byDateApp = new Map<string, Map<number, number>>();
  for (const s of snapshots) {
    if (!byDateApp.has(s.captureDate)) byDateApp.set(s.captureDate, new Map());
    byDateApp.get(s.captureDate)!.set(s.appId, s.playtimeMinutes);
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
