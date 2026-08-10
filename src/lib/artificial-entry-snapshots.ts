/**
 * El sync antiguo insertaba «ayer = 0 h» al detectar un juego nuevo.
 * Patrón: primer snapshot a 0 min y el del día siguiente ya existe.
 */

export function nextCaptureDateAfter(captureDate: string): string {
  const nextDay = new Date(`${captureDate}T12:00:00.000Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return nextDay.toISOString().split("T")[0];
}

export function isArtificialEntryPair(
  first: { captureDate: string; playtimeMinutes: number },
  second: { captureDate: string; playtimeMinutes: number },
): boolean {
  return (
    first.playtimeMinutes === 0 &&
    second.captureDate === nextCaptureDateAfter(first.captureDate)
  );
}

/** Omite el primer punto si encaja con el patrón artificial (serie ya ordenada por fecha). */
export function omitArtificialLeadingEntry<
  T extends { captureDate: string; playtimeMinutes: number },
>(sortedSnapshots: T[]): T[] {
  if (sortedSnapshots.length < 2) return sortedSnapshots;
  if (isArtificialEntryPair(sortedSnapshots[0], sortedSnapshots[1])) {
    return sortedSnapshots.slice(1);
  }
  return sortedSnapshots;
}

/**
 * IDs del snapshot artificial por juego (primer 0 h + día siguiente presente).
 * `snapshots` debe estar ordenado por appId y captureDate ascendente.
 */
export function collectArtificialEntryIds(
  snapshots: { id: string; appId: number; captureDate: string; playtimeMinutes: number }[],
): string[] {
  const ids: string[] = [];
  let i = 0;

  while (i < snapshots.length) {
    const first = snapshots[i];
    let j = i + 1;
    while (j < snapshots.length && snapshots[j].appId === first.appId) j++;

    const second = i + 1 < j ? snapshots[i + 1] : null;
    if (second && isArtificialEntryPair(first, second)) {
      ids.push(first.id);
    }

    i = j;
  }

  return ids;
}
