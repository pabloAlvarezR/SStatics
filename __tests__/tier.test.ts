import { describe, expect, it } from "vitest";
import { hasUnlimitedScans, isAssignableTier, getScanLimitForTier } from "@/lib/tier";
import { TIER_DAILY_SCANS } from "@/lib/constants";

describe("hasUnlimitedScans", () => {
  it("is true for owner tier regardless of flag", () => {
    expect(hasUnlimitedScans("owner", false)).toBe(true);
    expect(hasUnlimitedScans("owner", true)).toBe(true);
  });

  it("is true for non-owner when unlimitedScans flag is set", () => {
    expect(hasUnlimitedScans("free", true)).toBe(true);
    expect(hasUnlimitedScans("master", true)).toBe(true);
  });

  it("is false for assignable tiers without the flag", () => {
    expect(hasUnlimitedScans("free", false)).toBe(false);
    expect(hasUnlimitedScans("pro", false)).toBe(false);
    expect(hasUnlimitedScans("master", false)).toBe(false);
  });
});

describe("assignable tiers and limits", () => {
  it("only allows free/pro/master via UI", () => {
    expect(isAssignableTier("free")).toBe(true);
    expect(isAssignableTier("owner")).toBe(false);
  });

  it("keeps scan limits from constants", () => {
    expect(getScanLimitForTier("pro")).toBe(TIER_DAILY_SCANS.pro);
    expect(getScanLimitForTier("master")).toBe(TIER_DAILY_SCANS.master);
  });
});
