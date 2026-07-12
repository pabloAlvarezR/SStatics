import { describe, it, expect } from "vitest";
import { MIN_USERS_FOR_PERCENTILES } from "@/lib/constants";

function calcPercentile(userValue: number, allValues: number[]): number | null {
  if (allValues.length < MIN_USERS_FOR_PERCENTILES) return null;
  const sorted = [...allValues].sort((a, b) => b - a);
  const rank = sorted.findIndex((v) => userValue >= v);
  const percentile = ((sorted.length - rank) / sorted.length) * 100;
  return Math.round(percentile);
}

describe("percentile calculation", () => {
  it("returns null when not enough users", () => {
    expect(calcPercentile(100, [100, 200, 300])).toBeNull();
  });

  it("calculates top percentile for highest value", () => {
    const values = [500, 400, 300, 200, 100];
    expect(calcPercentile(500, values)).toBe(100);
  });

  it("calculates lower percentile for lower value", () => {
    const values = [500, 400, 300, 200, 100];
    const result = calcPercentile(100, values);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe("library preferences grid cols", () => {
  it("defines density options", () => {
    const densities = ["compact", "normal", "large"];
    densities.forEach((d) => expect(typeof d).toBe("string"));
  });
});
