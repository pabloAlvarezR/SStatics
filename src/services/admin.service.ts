import { prisma } from "@/lib/prisma";
import {
  isAssignableTier,
  isOwnerSteamId,
  isOwnerTier,
  type AssignableTier,
} from "@/lib/tier";

export class AdminError extends Error {
  constructor(
    message: string,
    public code: "FORBIDDEN" | "NOT_FOUND" | "INVALID_TIER" | "PROTECTED_OWNER",
  ) {
    super(message);
    this.name = "AdminError";
  }
}

export async function assertCallerIsOwner(callerUserId: string): Promise<void> {
  const caller = await prisma.user.findUnique({
    where: { id: callerUserId },
    select: { tier: true, steamId: true },
  });

  if (!caller || (!isOwnerTier(caller.tier) && !isOwnerSteamId(caller.steamId))) {
    throw new AdminError("Solo el owner puede gestionar roles", "FORBIDDEN");
  }
}

export async function getUserTierForAdmin(steamId: string): Promise<{
  steamId: string;
  personaName: string;
  tier: string;
  unlimitedScans: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { steamId },
    select: {
      steamId: true,
      personaName: true,
      tier: true,
      unlimitedScans: true,
    },
  });

  if (!user) {
    throw new AdminError("Usuario no encontrado en SStatics", "NOT_FOUND");
  }

  return user;
}

export async function updateUserTierBySteamId(
  callerUserId: string,
  targetSteamId: string,
  updates: { tier?: AssignableTier; unlimitedScans?: boolean },
): Promise<{
  steamId: string;
  personaName: string;
  tier: string;
  unlimitedScans: boolean;
}> {
  await assertCallerIsOwner(callerUserId);

  const target = await prisma.user.findUnique({
    where: { steamId: targetSteamId },
    select: {
      id: true,
      steamId: true,
      personaName: true,
      tier: true,
      unlimitedScans: true,
    },
  });

  if (!target) {
    throw new AdminError("Usuario no encontrado en SStatics", "NOT_FOUND");
  }

  if (isOwnerTier(target.tier) || isOwnerSteamId(target.steamId)) {
    throw new AdminError(
      "No se puede modificar el tier de una cuenta owner",
      "PROTECTED_OWNER",
    );
  }

  if (updates.tier != null && !isAssignableTier(updates.tier)) {
    throw new AdminError("Tier no válido (free, pro o master)", "INVALID_TIER");
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: {
      ...(updates.tier != null ? { tier: updates.tier } : {}),
      ...(updates.unlimitedScans != null ? { unlimitedScans: updates.unlimitedScans } : {}),
    },
    select: {
      steamId: true,
      personaName: true,
      tier: true,
      unlimitedScans: true,
    },
  });

  return updated;
}
