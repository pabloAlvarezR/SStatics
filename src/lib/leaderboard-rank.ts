/** Pure helpers for friends leaderboard ordering (tests + service). */
export function rankFriendsLeaderboardEntries(
  entries: {
    steamId: string;
    personaName: string;
    hoursGained7d: number;
    totalHours: number;
  }[],
): { steamId: string; rank: number }[] {
  const sorted = [...entries].sort(
    (a, b) =>
      b.hoursGained7d - a.hoursGained7d ||
      b.totalHours - a.totalHours ||
      a.personaName.localeCompare(b.personaName, "es"),
  );
  return sorted.map((e, i) => ({ steamId: e.steamId, rank: i + 1 }));
}
