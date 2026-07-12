"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { getSteamCoverUrlCandidates } from "@/lib/steam-images";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface GameCoverImageProps {
  appId: number;
  name: string;
  imgIconUrl?: string | null;
  imgLogoUrl?: string | null;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
}

export function GameCoverImage({
  appId,
  name,
  imgIconUrl,
  imgLogoUrl,
  className = "",
  imageClassName = "object-cover",
  sizes = "100vw",
  priority = false,
  fill = true,
  width,
  height,
}: GameCoverImageProps) {
  const candidates = useMemo(
    () => getSteamCoverUrlCandidates(appId, imgIconUrl, imgLogoUrl),
    [appId, imgIconUrl, imgLogoUrl],
  );

  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const exhausted = index >= candidates.length;
  const src = candidates[index];

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  const fillClass = fill ? "absolute inset-0 h-full w-full" : "";

  if (exhausted) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-steam-bg-light/60 to-steam-bg-dark/80 ${fillClass} ${className}`}
        aria-label={`Sin carátula para ${name}`}
      >
        <span className="px-3 text-center text-sm font-bold text-steam-text-muted">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  const imageProps = fill
    ? { fill: true as const }
    : { width: width ?? 460, height: height ?? 215 };

  return (
    <>
      {!loaded && (
        <div
          className={`steam-shimmer flex items-center justify-center ${fillClass} ${className}`}
          aria-hidden
        >
          <LoadingSpinner size="sm" />
        </div>
      )}
      <Image
        {...imageProps}
        src={src}
        alt={name}
        unoptimized
        className={`${imageClassName} ${fillClass} ${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        sizes={sizes}
        priority={priority}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(false);
          setIndex((prev) => prev + 1);
        }}
      />
    </>
  );
}
