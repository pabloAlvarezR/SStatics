import { describe, it, expect } from "vitest";

describe("friends invite URL", () => {
  it("builds invite path from code", () => {
    const code = "abc123";
    const path = `/api/invite/${code}`;
    expect(path).toBe("/api/invite/abc123");
  });

  it("identifies platform friends", () => {
    const friends = [
      { steamId: "1", isOnPlatform: true },
      { steamId: "2", isOnPlatform: false },
    ];
    const onPlatform = friends.filter((f) => f.isOnPlatform);
    expect(onPlatform).toHaveLength(1);
  });
});
