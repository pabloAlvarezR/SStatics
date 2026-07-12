import { describe, it, expect } from "vitest";
import { getChartYMax, mergeChartSeries } from "@/lib/chart-merge";

describe("mergeChartSeries", () => {
  it("merges user and friend series by date", () => {
    const merged = mergeChartSeries(
      [
        { date: "2026-01-01", hours: 10 },
        { date: "2026-01-05", hours: 15 },
      ],
      [
        {
          key: "friend_a",
          label: "Amigo",
          color: "#66c0f4",
          points: [
            { date: "2026-01-02", hours: 8 },
            { date: "2026-01-05", hours: 12 },
          ],
        },
      ],
    );

    expect(merged).toHaveLength(3);
    expect(merged[1]).toMatchObject({ date: "2026-01-02", hours: 10, friend_a: 8 });
    expect(merged[2]).toMatchObject({ date: "2026-01-05", hours: 15, friend_a: 12 });
  });

  it("calculates ymax across all series", () => {
    const merged = mergeChartSeries(
      [{ date: "2026-01-01", hours: 10 }],
      [
        {
          key: "friend_a",
          label: "Amigo",
          color: "#66c0f4",
          points: [{ date: "2026-01-01", hours: 20 }],
        },
      ],
    );

    expect(getChartYMax(merged, ["hours", "friend_a"])).toBe(22);
  });

  it("merges multiple friend series", () => {
    const merged = mergeChartSeries(
      [{ date: "2026-01-01", hours: 5 }],
      [
        {
          key: "friend_a",
          label: "A",
          color: "#66c0f4",
          points: [{ date: "2026-01-03", hours: 10 }],
        },
        {
          key: "friend_b",
          label: "B",
          color: "#c77dff",
          points: [{ date: "2026-01-02", hours: 8 }],
        },
      ],
    );

    expect(merged).toHaveLength(3);
    expect(merged[2]).toMatchObject({
      date: "2026-01-03",
      hours: 5,
      friend_a: 10,
      friend_b: 8,
    });
  });
});
