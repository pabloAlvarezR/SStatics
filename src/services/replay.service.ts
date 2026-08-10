import type { ReplayResponse, WeekShareResponse } from "@/lib/validators/api";
import { prisma } from "@/lib/prisma";
import {
  getDailyActivityDeltas,
  getLatestSnapshotsForLibrary,
  getUserHoursDelta,
} from "@/repositories/snapshot.repository";
import { minutesToHours } from "@/services/steam.service";

function monthBounds(year: number, month: number): { start: Date; end: Date; label: string } {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  const label = start.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { start, end, label: label.charAt(0).toUpperCase() + label.slice(1) };
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / 86400000));
}

export async function getMonthlyReplay(
  userId: string,
  year: number,
  month: number,
): Promise<ReplayResponse | null> {
  if (month < 1 || month > 12) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { steamId: true },
  });
  if (!user) return null;

  const { start, end, label } = monthBounds(year, month);
  const daysBack = daysBetween(start, new Date());
  const heatmap = await getDailyActivityDeltas(userId, Math.max(daysBack + 5, 40));

  const inMonth = heatmap.filter((d) => {
    const t = new Date(`${d.date}T12:00:00.000Z`);
    return t >= start && t <= end;
  });

  const hoursGained =
    Math.round(inMonth.reduce((sum, d) => sum + d.hours, 0) * 10) / 10;

  let prevMonthHoursGained: number | null = null;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prev = monthBounds(prevYear, prevMonth);
  const prevDays = daysBetween(prev.start, new Date());
  if (prevDays > 0) {
    const prevHeat = await getDailyActivityDeltas(userId, Math.max(prevDays + 5, 70));
    const inPrev = prevHeat.filter((d) => {
      const t = new Date(`${d.date}T12:00:00.000Z`);
      return t >= prev.start && t <= prev.end;
    });
    prevMonthHoursGained =
      Math.round(inPrev.reduce((sum, d) => sum + d.hours, 0) * 10) / 10;
  }

  const mostActiveDay =
    inMonth.length === 0
      ? null
      : [...inMonth].sort((a, b) => b.hours - a.hours)[0] ?? null;

  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];

  const snapshots = await prisma.playtimeSnapshot.findMany({
    where: {
      userId,
      captureDate: { gte: startStr, lte: endStr },
    },
    select: {
      appId: true,
      captureDate: true,
      playtimeMinutes: true,
      game: { select: { name: true } },
    },
    orderBy: [{ appId: "asc" }, { captureDate: "asc" }],
  });

  const byApp = new Map<
    number,
    { name: string; first: number; last: number }
  >();
  for (const s of snapshots) {
    const entry = byApp.get(s.appId);
    if (!entry) {
      byApp.set(s.appId, {
        name: s.game.name,
        first: s.playtimeMinutes,
        last: s.playtimeMinutes,
      });
    } else {
      entry.last = s.playtimeMinutes;
    }
  }

  const topGames = [...byApp.entries()]
    .map(([appId, g]) => ({
      appId,
      name: g.name,
      hoursGained: minutesToHours(Math.max(0, g.last - g.first)),
      totalHours: minutesToHours(g.last),
    }))
    .filter((g) => g.hoursGained > 0)
    .sort((a, b) => b.hoursGained - a.hoursGained)
    .slice(0, 5);

  return {
    year,
    month,
    label,
    hoursGained,
    prevMonthHoursGained,
    topGames,
    mostActiveDay: mostActiveDay
      ? { date: mostActiveDay.date, hours: mostActiveDay.hours }
      : null,
    gamesTouched: topGames.length,
    sharePath: `/replay?year=${year}&month=${month}`,
  };
}

export async function getWeekShare(userId: string): Promise<WeekShareResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { steamId: true, personaName: true },
  });
  if (!user) return null;

  const [hours7m, latest] = await Promise.all([
    getUserHoursDelta(userId, 7),
    getLatestSnapshotsForLibrary(userId),
  ]);

  const topGames = [...latest]
    .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes)
    .slice(0, 3)
    .map((g) => ({
      appId: g.appId,
      name: g.name,
      totalHours: minutesToHours(g.playtimeMinutes),
    }));

  return {
    hours7d: minutesToHours(hours7m),
    topGames,
    personaName: user.personaName,
    steamId: user.steamId,
    sharePath: `/share/week`,
  };
}
