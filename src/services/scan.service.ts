import { prisma } from "@/lib/prisma";
import { getCaptureDate } from "@/repositories/snapshot.repository";
import { getScanLimitForTier, hasUnlimitedScans } from "@/lib/tier";

export function getScanDate(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

export async function getDailyScanUsage(userId: string, date: Date = new Date()) {
  const scanDate = getScanDate(date);
  const usedToday = await prisma.gameScan.count({
    where: { userId, scanDate },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, unlimitedScans: true },
  });

  const tier = user?.tier ?? "free";
  const unlimited = hasUnlimitedScans(tier, user?.unlimitedScans ?? false);
  const limit = unlimited ? 0 : getScanLimitForTier(tier);

  return {
    usedToday,
    limit,
    remaining: unlimited ? Number.POSITIVE_INFINITY : Math.max(0, limit - usedToday),
    tier,
    unlimited,
  };
}

export async function recordGameScan(userId: string, appId: number, scannedAt: Date = new Date()) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, unlimitedScans: true },
  });

  const tier = user?.tier ?? "free";
  if (hasUnlimitedScans(tier, user?.unlimitedScans ?? false)) return;

  await prisma.gameScan.create({
    data: {
      userId,
      appId,
      scannedAt,
      scanDate: getCaptureDate(scannedAt),
    },
  });
}

export async function canUserScan(userId: string): Promise<boolean> {
  const usage = await getDailyScanUsage(userId);
  return usage.unlimited || usage.remaining > 0;
}
