import { describe, expect, it } from "vitest";
import {
  collectArtificialEntryIds,
  isArtificialEntryPair,
  nextCaptureDateAfter,
  omitArtificialLeadingEntry,
} from "@/lib/artificial-entry-snapshots";

describe("artificial-entry-snapshots", () => {
  it("calculates the next UTC capture date", () => {
    expect(nextCaptureDateAfter("2026-03-01")).toBe("2026-03-02");
    expect(nextCaptureDateAfter("2026-12-31")).toBe("2027-01-01");
  });

  it("detects the artificial 0h + next-day pair", () => {
    expect(
      isArtificialEntryPair(
        { captureDate: "2026-03-01", playtimeMinutes: 0 },
        { captureDate: "2026-03-02", playtimeMinutes: 120 },
      ),
    ).toBe(true);

    expect(
      isArtificialEntryPair(
        { captureDate: "2026-03-01", playtimeMinutes: 0 },
        { captureDate: "2026-03-02", playtimeMinutes: 0 },
      ),
    ).toBe(true);

    expect(
      isArtificialEntryPair(
        { captureDate: "2026-03-01", playtimeMinutes: 0 },
        { captureDate: "2026-03-05", playtimeMinutes: 120 },
      ),
    ).toBe(false);

    expect(
      isArtificialEntryPair(
        { captureDate: "2026-03-01", playtimeMinutes: 30 },
        { captureDate: "2026-03-02", playtimeMinutes: 120 },
      ),
    ).toBe(false);
  });

  it("omits the leading artificial entry from a sorted series", () => {
    const series = [
      { captureDate: "2026-03-01", playtimeMinutes: 0 },
      { captureDate: "2026-03-02", playtimeMinutes: 600 },
      { captureDate: "2026-03-03", playtimeMinutes: 620 },
    ];

    expect(omitArtificialLeadingEntry(series)).toEqual([
      { captureDate: "2026-03-02", playtimeMinutes: 600 },
      { captureDate: "2026-03-03", playtimeMinutes: 620 },
    ]);
  });

  it("keeps a real leading zero when the next snapshot is not the following day", () => {
    const series = [
      { captureDate: "2026-03-01", playtimeMinutes: 0 },
      { captureDate: "2026-03-10", playtimeMinutes: 90 },
    ];

    expect(omitArtificialLeadingEntry(series)).toEqual(series);
  });

  it("collects artificial entry ids per app", () => {
    const ids = collectArtificialEntryIds([
      {
        id: "a0",
        appId: 1,
        captureDate: "2026-03-01",
        playtimeMinutes: 0,
      },
      {
        id: "a1",
        appId: 1,
        captureDate: "2026-03-02",
        playtimeMinutes: 100,
      },
      {
        id: "b0",
        appId: 2,
        captureDate: "2026-03-01",
        playtimeMinutes: 50,
      },
      {
        id: "b1",
        appId: 2,
        captureDate: "2026-03-02",
        playtimeMinutes: 60,
      },
      {
        id: "c0",
        appId: 3,
        captureDate: "2026-03-01",
        playtimeMinutes: 0,
      },
      {
        id: "c1",
        appId: 3,
        captureDate: "2026-03-02",
        playtimeMinutes: 0,
      },
    ]);

    expect(ids).toEqual(["a0", "c0"]);
  });
});
