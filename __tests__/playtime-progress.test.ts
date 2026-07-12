import { describe, it, expect } from "vitest";
import {
  calculatePlaytimeProgress,
  formatProgressLabel,
} from "@/lib/playtime-progress";

describe("calculatePlaytimeProgress", () => {
  it("returns null with fewer than 2 points", () => {
    expect(calculatePlaytimeProgress([{ date: "2026-01-01", hours: 10 }])).toBeNull();
    expect(calculatePlaytimeProgress([])).toBeNull();
  });

  it("calculates percent change between two points", () => {
    const progress = calculatePlaytimeProgress([
      { date: "2026-01-01", hours: 10 },
      { date: "2026-01-02", hours: 15 },
    ]);

    expect(progress).not.toBeNull();
    expect(progress!.hoursGained).toBe(5);
    expect(progress!.hoursGainedRecent).toBe(5);
    expect(progress!.percentChange).toBe(50);
    expect(progress!.periodDays).toBe(1);
  });

  it("handles starting from zero hours", () => {
    const progress = calculatePlaytimeProgress([
      { date: "2026-01-01", hours: 0 },
      { date: "2026-01-02", hours: 3.5 },
    ]);

    expect(progress!.percentChange).toBeNull();
    expect(progress!.hoursGained).toBe(3.5);
    expect(formatProgressLabel(progress!)).toBe("+3.5 h");
  });

  it("calculates recent delta with three points", () => {
    const progress = calculatePlaytimeProgress([
      { date: "2026-01-01", hours: 10 },
      { date: "2026-01-05", hours: 12 },
      { date: "2026-01-10", hours: 20 },
    ]);

    expect(progress!.hoursGained).toBe(10);
    expect(progress!.hoursGainedRecent).toBe(8);
    expect(progress!.percentChange).toBe(100);
  });
});
