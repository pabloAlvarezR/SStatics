import { describe, it, expect } from "vitest";
import { minutesToHours } from "@/services/steam.service";

describe("minutesToHours", () => {
  it("converts minutes to hours with one decimal", () => {
    expect(minutesToHours(90)).toBe(1.5);
    expect(minutesToHours(125)).toBe(2.1);
    expect(minutesToHours(0)).toBe(0);
  });

  it("handles bigint and empty values", () => {
    expect(minutesToHours(BigInt(120))).toBe(2);
    expect(minutesToHours(null)).toBe(0);
    expect(minutesToHours(undefined)).toBe(0);
  });
});
