"use client";

import Image from "next/image";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface AvatarImageProps {
  src: string | null | undefined;
  alt: string;
  fallbackLetter?: string;
  className?: string;
  sizes?: string;
}

export function AvatarImage({
  src,
  alt,
  fallbackLetter,
  className = "",
  sizes = "56px",
}: AvatarImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const letter = (fallbackLetter ?? alt).charAt(0).toUpperCase();

  if (!src || failed) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-steam-bg-light/50 text-sm font-bold text-steam-text-muted ${className}`}
      >
        {letter}
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-steam-bg-light/40">
          <LoadingSpinner size="xs" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        className={`object-cover transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </>
  );
}
