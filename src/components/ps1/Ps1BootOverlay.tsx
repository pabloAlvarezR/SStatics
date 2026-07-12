"use client";

import { useEffect } from "react";

interface Ps1BootOverlayProps {
  onDone: () => void;
}

/** Recreación visual de la secuencia de arranque de PS1 */
export function Ps1BootOverlay({ onDone }: Ps1BootOverlayProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 4200);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="ps1-boot-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black"
      role="presentation"
      aria-hidden="true"
    >
      <div className="ps1-boot-sequence flex flex-col items-center gap-8 px-6 text-center">
        <p className="ps1-boot-sony text-sm font-medium tracking-[0.35em] text-white/90 sm:text-base">
          Sony Computer Entertainment
        </p>

        <div className="ps1-boot-logo relative flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36">
          <span className="ps1-boot-p absolute text-6xl font-black italic text-blue-500 sm:text-7xl">
            P
          </span>
          <span className="ps1-boot-s absolute text-6xl font-black italic text-red-500 sm:text-7xl">
            S
          </span>
        </div>

        <p className="ps1-boot-tagline text-[10px] uppercase tracking-[0.5em] text-white/50 sm:text-xs">
          it&apos;s time to play
        </p>
      </div>
    </div>
  );
}
