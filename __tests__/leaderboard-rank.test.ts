import { describe, expect, it } from "vitest";
import { rankFriendsLeaderboardEntries } from "@/lib/leaderboard-rank";

describe("rankFriendsLeaderboardEntries", () => {
  it("ranks by hours gained then total hours", () => {
    const ranks = rankFriendsLeaderboardEntries([
      { steamId: "a", personaName: "Ana", hoursGained7d: 2, totalHours: 100 },
      { steamId: "b", personaName: "Bob", hoursGained7d: 5, totalHours: 40 },
      { steamId: "c", personaName: "Cata", hoursGained7d: 5, totalHours: 90 },
    ]);

    expect(ranks.map((r) => r.steamId)).toEqual(["c", "b", "a"]);
    expect(ranks.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("breaks remaining ties by persona name", () => {
    const ranks = rankFriendsLeaderboardEntries([
      { steamId: "z", personaName: "Zoe", hoursGained7d: 1, totalHours: 10 },
      { steamId: "a", personaName: "Ada", hoursGained7d: 1, totalHours: 10 },
    ]);

    expect(ranks.map((r) => r.steamId)).toEqual(["a", "z"]);
  });

  it("handles an empty list", () => {
    expect(rankFriendsLeaderboardEntries([])).toEqual([]);
  });
});
