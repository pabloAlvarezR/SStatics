"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Ps1FaceButtons } from "./Ps1FaceButtons";

export function Ps1Footer() {
  const [expanded, setExpanded] = useState(false);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  const toggle = useCallback(() => {
    if (!canHover) setExpanded((v) => !v);
  }, [canHover]);

  useEffect(() => {
    if (!expanded || canHover) return;
    const close = () => setExpanded(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [expanded, canHover]);

  return (
    <footer className="relative mt-8 border-t border-steam-border/20 bg-steam-bg-dark/80">
      {/* Mando PS1: asoma por arriba y se revela al pasar el cursor */}
      <div className="flex justify-center px-4 pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          className={`group relative mx-auto w-full max-w-md overflow-hidden transition-[height] duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-steam-green/50 ${
            canHover
              ? "h-7 cursor-default hover:h-52 sm:hover:h-60"
              : expanded
                ? "h-52 sm:h-60"
                : "h-7"
          }`}
          aria-label="Easter egg: mando de PlayStation"
          aria-expanded={canHover ? undefined : expanded}
        >
          <Image
            src="/branding/mando_ps1_orig.png"
            alt=""
            width={480}
            height={360}
            className="pointer-events-none absolute bottom-0 left-1/2 w-full max-w-sm -translate-x-1/2 object-contain object-bottom drop-shadow-[0_-4px_20px_rgba(0,0,0,0.6)]"
          />
          {!canHover && !expanded && (
            <span className="absolute inset-x-0 bottom-0 text-center text-[9px] text-steam-text-muted/60">
              Toca para ver el mando
            </span>
          )}
        </button>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-5 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <div className="space-y-1">
          <p className="text-xs text-steam-text-muted">
            SStatics · Estadísticas de Steam
          </p>
          <p className="text-[10px] leading-relaxed text-steam-text-muted/50">
            Hecho con nostalgia de los 32 bits
            <span className="mx-1.5 hidden sm:inline">·</span>
            <span className="block sm:inline">
              Licensed by{" "}
              <span className="italic text-steam-text-muted/70">Sony Computer Entertainment</span>*
            </span>
          </p>
          <p className="text-[9px] text-steam-text-muted/35">
            *Parodia nostálgica. SStatics no está afiliado a Sony ni PlayStation.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 sm:items-end">
          <Ps1FaceButtons className="opacity-40" />
          <p className="text-[10px] text-steam-text-muted/40">
            △ Start &nbsp; ○ Select &nbsp; ✕ Cancel &nbsp; □ Confirm
          </p>
        </div>
      </div>
    </footer>
  );
}
