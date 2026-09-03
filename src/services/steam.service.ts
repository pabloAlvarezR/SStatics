import { sleepMs, waitForSteamApiSlot } from "@/lib/steam-api-guard";

const STEAM_API_BASE = "https://api.steampowered.com";

export interface SteamOwnedGame {
  appid: number;
  name?: string;
  playtime_forever: number;
  playtime_2weeks?: number;
  rtime_last_played?: number;
  img_icon_url?: string;
  img_logo_url?: string;
}

export interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatarfull: string;
}

export interface SteamFriend {
  steamid: string;
  relationship: string;
  friend_since: number;
}

export class SteamApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public steamResponse?: unknown,
  ) {
    super(message);
    this.name = "SteamApiError";
  }
}

function getApiKey(): string {
  const key = process.env.STEAM_API_KEY;
  if (!key || key === "your_steam_api_key_here") {
    throw new SteamApiError("STEAM_API_KEY no está configurada en .env.local");
  }
  return key;
}

export async function getOwnedGames(steamId: string): Promise<SteamOwnedGame[]> {
  const params = new URLSearchParams({
    key: getApiKey(),
    steamid: steamId,
    include_appinfo: "1",
    include_played_free_games: "1",
    include_free_sub: "1",
    format: "json",
  });

  const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?${params}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    const body = await response.text();
    throw new SteamApiError(
      `Steam API respondió con error ${response.status}`,
      response.status,
      body,
    );
  }

  const data = await response.json();
  const responseMeta = data?.response;

  if (!responseMeta) {
    throw new SteamApiError("Respuesta inválida de Steam API", undefined, data);
  }

  const games = responseMeta.games;

  if (!games || !Array.isArray(games)) {
    console.warn(`[Steam] Biblioteca vacía para steamId ${steamId}. Respuesta:`, data);
    return [];
  }

  return games as SteamOwnedGame[];
}

/** Steam da `playtime_forever` en minutos. 0 = nunca jugado; no merece snapshot. */
export function hasSteamPlaytime(playtimeForever?: number | null): boolean {
  return (playtimeForever ?? 0) > 0;
}

export function filterPlayedOwnedGames<T extends { playtime_forever?: number | null }>(
  games: T[],
): T[] {
  return games.filter((game) => hasSteamPlaytime(game.playtime_forever));
}

export interface SteamGamePlaytime {
  playtimeMinutes: number;
  playtime2weeksMinutes: number | null;
  lastPlayedAt: string | null;
}

/** Horas de un juego concreto si la biblioteca Steam del usuario es pública */
export async function getOwnedGamePlaytime(
  steamId: string,
  appId: number,
): Promise<SteamGamePlaytime | null> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await waitForSteamApiSlot();

    const params = new URLSearchParams({
      key: getApiKey(),
      steamid: steamId,
      include_appinfo: "0",
      include_played_free_games: "1",
      appids_filter: String(appId),
      format: "json",
    });

    const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?${params}`;
    const response = await fetch(url, { cache: "no-store" });

    if (response.status === 429) {
      const retryAfterSec = Number.parseInt(response.headers.get("Retry-After") ?? "5", 10);
      const delayMs = Number.isFinite(retryAfterSec) ? retryAfterSec * 1000 : 5000;
      console.warn(`[Steam] Rate limit 429 para ${steamId}, reintento en ${delayMs}ms`);
      if (attempt < maxAttempts) {
        await sleepMs(delayMs);
        continue;
      }
      throw new SteamApiError("Steam API rate limit (429)", 429);
    }

    if (!response.ok) {
      throw new SteamApiError(
        `Steam API respondió con error ${response.status}`,
        response.status,
      );
    }

    const data = await response.json();
    const games = data?.response?.games as SteamOwnedGame[] | undefined;

    if (!games?.length) return null;

    const game = games.find((g) => Number(g.appid) === appId);
    if (!game || !hasSteamPlaytime(game.playtime_forever)) return null;

    return {
      playtimeMinutes: game.playtime_forever,
      playtime2weeksMinutes: game.playtime_2weeks ?? null,
      lastPlayedAt: unixToIso(game.rtime_last_played),
    };
  }

  return null;
}

export async function getPlayerSummary(steamId: string): Promise<SteamPlayerSummary | null> {
  const summaries = await getPlayerSummaries([steamId]);
  return summaries[0] ?? null;
}

export async function getPlayerSummaries(steamIds: string[]): Promise<SteamPlayerSummary[]> {
  if (steamIds.length === 0) return [];

  const results: SteamPlayerSummary[] = [];

  for (let i = 0; i < steamIds.length; i += 100) {
    const batch = steamIds.slice(i, i + 100);
    const params = new URLSearchParams({
      key: getApiKey(),
      steamids: batch.join(","),
      format: "json",
    });

    const response = await fetch(
      `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?${params}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new SteamApiError(`Steam API respondió con error ${response.status}`, response.status);
    }

    const data = await response.json();
    const players = data?.response?.players ?? [];
    results.push(...(players as SteamPlayerSummary[]));
  }

  return results;
}

export async function getFriendList(steamId: string): Promise<SteamFriend[]> {
  const params = new URLSearchParams({
    key: getApiKey(),
    steamid: steamId,
    relationship: "friend",
    format: "json",
  });

  const response = await fetch(
    `${STEAM_API_BASE}/ISteamUser/GetFriendList/v1/?${params}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new SteamApiError(`Steam API respondió con error ${response.status}`, response.status);
  }

  const data = await response.json();
  const friends = data?.friendslist?.friends;

  if (!friends || !Array.isArray(friends)) {
    return [];
  }

  return friends as SteamFriend[];
}

export function getSteamIconUrl(
  appId: number,
  iconHash: string | undefined | null,
): string | null {
  if (!iconHash) return null;
  return `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`;
}

export function getSteamHeaderUrl(appId: number): string {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
}

export function minutesToHours(minutes: number | bigint | null | undefined): number {
  if (minutes == null) return 0;
  const value = typeof minutes === "bigint" ? Number(minutes) : minutes;
  if (!Number.isFinite(value)) return 0;
  return Math.round((value / 60) * 10) / 10;
}

export function unixToIso(timestamp: number | undefined | null): string | null {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString();
}
