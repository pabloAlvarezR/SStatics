import { describe, it, expect } from "vitest";
import { filterPointsByHoursRange, getHoursRangeCutoff } from "@/lib/hours-range";

const NOW = new Date("2026-09-01T15:00:00.000Z");

describe("getHoursRangeCutoff", () => {
  it("usa días UTC de constants (7 / 30 / 180)", () => {
    expect(getHoursRangeCutoff("7d", NOW)).toBe("2026-08-25");
    expect(getHoursRangeCutoff("1m", NOW)).toBe("2026-08-02");
    expect(getHoursRangeCutoff("6m", NOW)).toBe("2026-03-05");
  });
});

describe("filterPointsByHoursRange", () => {
  it("recorta a la ventana y arrastra el último valor previo", () => {
    const ranged = filterPointsByHoursRange(
      [
        { date: "2026-08-20", hours: 10 },
        { date: "2026-08-27", hours: 12 },
        { date: "2026-09-01", hours: 14 },
      ],
      "7d",
      NOW,
    );

    expect(ranged[0]).toEqual({ date: "2026-08-25", hours: 10 });
    expect(ranged).toContainEqual({ date: "2026-08-27", hours: 12 });
    expect(ranged[ranged.length - 1]).toEqual({ date: "2026-09-01", hours: 14 });
  });

  it("si no hay actividad en el periodo, deja una línea plana hasta hoy", () => {
    const ranged = filterPointsByHoursRange(
      [{ date: "2026-01-10", hours: 40 }],
      "7d",
      NOW,
    );

    expect(ranged).toEqual([
      { date: "2026-08-25", hours: 40 },
      { date: "2026-09-01", hours: 40 },
    ]);
  });

  it("devuelve vacío si no hay puntos", () => {
    expect(filterPointsByHoursRange([], "1m", NOW)).toEqual([]);
  });
});
