import { describe, expect, it } from "vitest";
import { adminUserTierUpdateSchema } from "@/lib/validators/api";
import { isAssignableTier } from "@/lib/tier";

describe("adminUserTierUpdateSchema", () => {
  it("accepts tier and unlimitedScans together", () => {
    const parsed = adminUserTierUpdateSchema.parse({
      tier: "master",
      unlimitedScans: true,
    });
    expect(parsed).toEqual({ tier: "master", unlimitedScans: true });
  });

  it("accepts only unlimitedScans", () => {
    expect(adminUserTierUpdateSchema.parse({ unlimitedScans: false })).toEqual({
      unlimitedScans: false,
    });
  });

  it("rejects empty body", () => {
    expect(() => adminUserTierUpdateSchema.parse({})).toThrow();
  });

  it("rejects owner tier in the assignable schema", () => {
    expect(() => adminUserTierUpdateSchema.parse({ tier: "owner" })).toThrow();
    expect(isAssignableTier("owner")).toBe(false);
  });
});
