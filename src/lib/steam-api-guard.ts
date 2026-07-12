import { STEAM_API_MIN_INTERVAL_MS } from "@/lib/constants";

let lastSteamApiCallAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Espera el intervalo mínimo entre llamadas a Steam (conservador ~1 req/s). */
export async function waitForSteamApiSlot(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastSteamApiCallAt;
  if (elapsed < STEAM_API_MIN_INTERVAL_MS) {
    await sleep(STEAM_API_MIN_INTERVAL_MS - elapsed);
  }
  lastSteamApiCallAt = Date.now();
}

export async function sleepMs(ms: number): Promise<void> {
  return sleep(ms);
}
