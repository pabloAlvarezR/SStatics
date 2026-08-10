import { describe, it, expect } from "vitest";
import { TIER_DAILY_SCANS } from "@/lib/constants";
import { getScanLimitForTier } from "@/lib/tier";

describe("getScanLimitForTier", () => {
  it("defines tier limits from constants", () => {
    expect(TIER_DAILY_SCANS.free).toBe(3);
    expect(TIER_DAILY_SCANS.pro).toBe(6);
    expect(TIER_DAILY_SCANS.master).toBe(15);
  });

  it("defaults unknown tier to free limit", () => {
    expect(getScanLimitForTier("unknown")).toBe(3);
    expect(getScanLimitForTier("pro")).toBe(6);
  });

  it("owner tier has unlimited scans", () => {
    expect(getScanLimitForTier("owner")).toBe(Number.POSITIVE_INFINITY);
  });
});
