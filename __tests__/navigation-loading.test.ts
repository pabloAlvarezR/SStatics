import { describe, expect, it } from "vitest";
import {
  navigationLocationKey,
  shouldTrackHref,
  startNavigation,
  subscribeNavigationStart,
} from "@/lib/navigation-loading";

const current = {
  origin: "http://localhost:3000",
  pathname: "/library",
  search: "",
  hash: "",
};

describe("navigationLocationKey", () => {
  it("normaliza search con y sin interrogación", () => {
    expect(navigationLocationKey("/replay", "year=2026&month=9")).toBe("/replay?year=2026&month=9");
    expect(navigationLocationKey("/replay", "?year=2026&month=9")).toBe(
      "/replay?year=2026&month=9",
    );
    expect(navigationLocationKey("/library", "")).toBe("/library");
  });
});

describe("shouldTrackHref", () => {
  it("acepta un enlace interno a otra ruta", () => {
    expect(shouldTrackHref("/friends", current)).toBe(true);
    expect(shouldTrackHref("http://localhost:3000/profile", current)).toBe(true);
    expect(shouldTrackHref("/u/76561198000000000", current)).toBe(true);
  });

  it("acepta el mismo path con query distinta (Replay)", () => {
    const replay = {
      ...current,
      pathname: "/replay",
      search: "?year=2026&month=8",
    };
    expect(shouldTrackHref("/replay?year=2026&month=9", replay)).toBe(true);
  });

  it("rechaza la URL actual (mismo path + search)", () => {
    expect(shouldTrackHref("/library", current)).toBe(false);
    expect(shouldTrackHref("http://localhost:3000/library", current)).toBe(false);
    expect(shouldTrackHref("/library?", current)).toBe(false);
  });

  it("rechaza cambios solo de hash", () => {
    expect(shouldTrackHref("#top", current)).toBe(false);
    expect(shouldTrackHref("/library#seccion", current)).toBe(false);
  });

  it("rechaza rutas /api/* (login Steam)", () => {
    expect(shouldTrackHref("/api/auth/steam", current)).toBe(false);
    expect(shouldTrackHref("/api/auth/callback/steam", current)).toBe(false);
    expect(shouldTrackHref("/api/auth/steam?callbackUrl=%2Flibrary", current)).toBe(false);
  });

  it("rechaza orígenes externos y protocolos no web", () => {
    expect(shouldTrackHref("https://store.steampowered.com/", current)).toBe(false);
    expect(shouldTrackHref("//evil.example/phish", current)).toBe(false);
    expect(shouldTrackHref("mailto:hi@example.com", current)).toBe(false);
  });

  it("rechaza href vacío o inválido", () => {
    expect(shouldTrackHref("", current)).toBe(false);
    expect(shouldTrackHref("http://[not-a-url", current)).toBe(false);
  });
});

describe("startNavigation", () => {
  it("notifica a los suscriptores y deja de hacerlo al cancelar", () => {
    const seen: number[] = [];
    const unsub = subscribeNavigationStart(() => {
      seen.push(1);
    });
    startNavigation();
    expect(seen).toEqual([1]);
    unsub();
    startNavigation();
    expect(seen).toEqual([1]);
  });
});
