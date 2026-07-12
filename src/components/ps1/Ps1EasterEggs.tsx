"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Ps1BootOverlay } from "./Ps1BootOverlay";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
] as const;

type PopupKind = "crash" | "regina" | "silent" | null;

export function Ps1EasterEggs() {
  const [booting, setBooting] = useState(false);
  const [popup, setPopup] = useState<PopupKind>(null);
  const konamiIndex = useRef(0);
  const logoClicks = useRef(0);
  const logoTimer = useRef<number | null>(null);
  const typedBuffer = useRef("");

  const showPopup = useCallback((kind: PopupKind) => {
    setPopup(kind);
    window.setTimeout(() => setPopup(null), 2800);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const expected = KONAMI[konamiIndex.current];
      if (e.code === expected) {
        konamiIndex.current += 1;
        if (konamiIndex.current === KONAMI.length) {
          konamiIndex.current = 0;
          setBooting(true);
        }
        return;
      }
      konamiIndex.current = e.code === KONAMI[0] ? 1 : 0;

      if (e.key.length === 1) {
        typedBuffer.current = (typedBuffer.current + e.key.toLowerCase()).slice(-12);
        if (typedBuffer.current.endsWith("wark")) showPopup("crash");
        if (typedBuffer.current.endsWith("regina")) showPopup("regina");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showPopup]);

  useEffect(() => {
    const onLogoClick = () => {
      logoClicks.current += 1;
      if (logoTimer.current) window.clearTimeout(logoTimer.current);
      logoTimer.current = window.setTimeout(() => {
        logoClicks.current = 0;
      }, 1200);

      if (logoClicks.current >= 5) {
        logoClicks.current = 0;
        showPopup("crash");
      }
    };

    const logos = document.querySelectorAll("[data-ps1-logo]");
    logos.forEach((el) => el.addEventListener("click", onLogoClick));
    return () => logos.forEach((el) => el.removeEventListener("click", onLogoClick));
  }, [showPopup]);

  return (
    <>
      {booting && <Ps1BootOverlay onDone={() => setBooting(false)} />}

      {popup && (
        <div
          className="ps1-popup fixed bottom-24 left-1/2 z-[150] -translate-x-1/2 px-4 sm:bottom-28"
          role="status"
          aria-live="polite"
        >
          <div className="relative overflow-hidden rounded-lg border border-steam-border/50 bg-steam-bg-dark/95 p-3 shadow-2xl backdrop-blur-md">
            <Image
              src={
                popup === "crash"
                  ? "/branding/Crash_bandicoot.png"
                  : popup === "regina"
                    ? "/branding/regina_dino_crisis.png"
                    : "/branding/silent_bomber.png"
              }
              alt=""
              width={280}
              height={200}
              className="mx-auto h-auto w-48 object-contain sm:w-56"
            />
            <p className="mt-2 text-center text-sm font-bold text-steam-green">
              {popup === "crash"
                ? "¡WOAH!"
                : popup === "regina"
                  ? "Regina · that's disgusting."
                  : "Silent Bomber · ¡Jutah!"}
            </p>
            <p className="mt-0.5 text-center text-[10px] text-steam-text-muted">
              {popup === "crash"
                ? "Crash Bandicoot · 1996"
                : popup === "regina"
                  ? "Dino Crisis · 1999"
                  : "Silent Bomber · 199"}
            </p>
          </div>
        </div>
      )}

      {/* Esquina inferior izquierda: pixel casi invisible que revela Silent Bomber */}
      <button
        type="button"
        className="ps1-corner-egg group fixed bottom-2 left-2 z-40 h-8 w-8 opacity-[0.07] transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-steam-green/50 sm:h-10 sm:w-10"
        aria-label="Easter egg oculto"
        onClick={() => showPopup("silent")}
      >
        <span className="block h-full w-full rounded-sm bg-steam-green/30" />
        <span className="pointer-events-none absolute -top-1 left-full ml-2 hidden w-36 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100 sm:block">
          <Image
            src="/branding/silent_bomber.png"
            alt=""
            width={144}
            height={144}
            className="rounded border border-steam-border/40 shadow-lg"
          />
        </span>
      </button>
    </>
  );
}
