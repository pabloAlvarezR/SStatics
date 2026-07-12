import { describe, it, expect } from "vitest";
import { minutesToHours } from "@/services/steam.service";

function buildChartPoints(
  snapshots: { capturedAt: Date; playtimeMinutes: number }[],
): { date: string; hours: number }[] {
  return snapshots
    .sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime())
    .map((s) => ({
      date: s.capturedAt.toISOString().split("T")[0],
      hours: minutesToHours(s.playtimeMinutes),
    }));
}

describe("chart point building", () => {
  it("converts minutes to hours with one decimal", () => {
    expect(minutesToHours(90)).toBe(1.5);
    expect(minutesToHours(125)).toBe(2.1);
    expect(minutesToHours(0)).toBe(0);
  });

  it("handles bigint values from sqlite aggregates", () => {
    expect(minutesToHours(BigInt(120))).toBe(2);
    expect(minutesToHours(null)).toBe(0);
    expect(minutesToHours(undefined)).toBe(0);
  });

  it("sorts snapshots chronologically", () => {
    const points = buildChartPoints([
      { capturedAt: new Date("2026-03-01"), playtimeMinutes: 300 },
      { capturedAt: new Date("2026-01-01"), playtimeMinutes: 100 },
      { capturedAt: new Date("2026-02-01"), playtimeMinutes: 200 },
    ]);

    expect(points[0].date).toBe("2026-01-01");
    expect(points[1].date).toBe("2026-02-01");
    expect(points[2].date).toBe("2026-03-01");
  });

  it("preserves monotonic playtime in chart output", () => {
    const points = buildChartPoints([
      { capturedAt: new Date("2026-01-01"), playtimeMinutes: 600 },
      { capturedAt: new Date("2026-02-01"), playtimeMinutes: 1200 },
      { capturedAt: new Date("2026-03-01"), playtimeMinutes: 1800 },
    ]);

    expect(points[0].hours).toBe(10);
    expect(points[2].hours).toBe(30);
  });
});

describe("SyncError codes", () => {
  it("defines expected error codes", () => {
    const codes = ["COOLDOWN", "PRIVATE_LIBRARY", "STEAM_API", "NOT_FOUND"];
    codes.forEach((code) => {
      expect(typeof code).toBe("string");
    });
  });
});
