"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface Ps1PeekImageProps {
  src: string;
  alt?: string;
  className?: string;
  hint?: string;
}

/** Muestra solo la parte superior de una imagen; al hover/tap revela la completa */
export function Ps1PeekImage({
  src,
  alt = "",
  className = "",
  hint,
}: Ps1PeekImageProps) {
  const [expanded, setExpanded] = useState(false);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  const heightClass = canHover
    ? "h-7 hover:h-56 sm:hover:h-64"
    : expanded
      ? "h-56 sm:h-64"
      : "h-7";

  return (
    <button
      type="button"
      onClick={() => {
        if (!canHover) setExpanded((v) => !v);
      }}
      className={`relative mx-auto block w-full max-w-xs overflow-hidden rounded-lg border border-steam-border/30 bg-steam-bg-dark/60 transition-[height] duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-steam-green/40 hover:border-steam-green/30 ${heightClass} ${className}`}
      aria-label={hint ?? "Imagen oculta de PS1"}
      aria-expanded={expanded}
    >
      <Image
        src={src}
        alt={alt}
        width={320}
        height={240}
        className="absolute bottom-0 left-1/2 w-full -translate-x-1/2 object-contain object-bottom"
      />
      {!expanded && hint && (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-steam-bg-dark/90 to-transparent py-1 text-[9px] text-steam-text-muted/70">
          {hint}
        </span>
      )}
    </button>
  );
}
