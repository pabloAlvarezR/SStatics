import { TIER_DAILY_SCANS, type UserTier } from "@/lib/constants";

/** Persona legacy (dev); en producción preferir OWNER_STEAM_IDS */
export const OWNER_PERSONA_NAME = "batondejesus";

function getOwnerSteamIds(): Set<string> {
  const fromEnv = process.env.OWNER_STEAM_IDS?.split(",").map((id) => id.trim()).filter(Boolean) ?? [];
  return new Set(fromEnv);
}

export function isOwnerTier(tier: string): boolean {
  return tier === "owner";
}

export function isOwnerPersona(personaName: string): boolean {
  return personaName.trim().toLowerCase() === OWNER_PERSONA_NAME.toLowerCase();
}

export function isOwnerSteamId(steamId: string): boolean {
  return getOwnerSteamIds().has(steamId);
}

export function resolveUserTier(
  personaName: string,
  currentTier?: string | null,
  steamId?: string,
): string {
  if (
    currentTier === "owner" ||
    isOwnerPersona(personaName) ||
    (steamId && isOwnerSteamId(steamId))
  ) {
    return "owner";
  }
  return currentTier ?? "free";
}

export function getScanLimitForTier(tier: string): number {
  if (isOwnerTier(tier)) return Number.POSITIVE_INFINITY;
  const normalized = tier as UserTier;
  return TIER_DAILY_SCANS[normalized] ?? TIER_DAILY_SCANS.free;
}

export function formatScanRemaining(remaining: number, limit: number, unlimited: boolean): string {
  if (unlimited) return "Escaneos maxximos :D";
  return `${remaining}/${limit} escaneos hoy`;
}

/** Texto compacto para mostrar dentro del botón de sync/scan */
export function formatScanButtonSubtext(usage: { remaining: number; limit: number; unlimited: boolean } | undefined): string | null {
  if (!usage) return null;
  if (usage.unlimited) return "Ilimitado";
  return `${usage.remaining}/${usage.limit} hoy`;
}
