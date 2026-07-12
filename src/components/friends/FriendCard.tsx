"use client";

import Link from "next/link";
import { useState } from "react";
import { AvatarImage } from "@/components/ui/AvatarImage";
import type { Friend } from "@/lib/validators/api";

interface FriendCardProps {
  friend: Friend;
  inviteUrl: string;
}

export function FriendCard({ friend, inviteUrl }: FriendCardProps) {
  const [copied, setCopied] = useState(false);

  const handleInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="steam-card flex items-center gap-3 p-4 sm:gap-4">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded sm:h-14 sm:w-14">
        <AvatarImage
          src={friend.avatarUrl}
          alt={friend.personaName}
          fallbackLetter={friend.personaName}
          sizes="56px"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-steam-text">{friend.personaName}</p>
        {friend.isOnPlatform ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-steam-green/20 px-2 py-0.5 text-[10px] font-bold uppercase text-steam-green">
              En SStatics
            </span>
            {friend.totalHours !== null && (
              <span className="text-xs text-steam-text-muted">
                {friend.totalHours} h · {friend.totalGames} juegos
              </span>
            )}
          </div>
        ) : (
          <p className="mt-1 text-xs text-steam-text-muted">No está en la plataforma</p>
        )}
      </div>

      <div className="shrink-0">
        {friend.isOnPlatform && friend.sstaticsSteamId && friend.isProfilePublic ? (
          <Link
            href={`/u/${friend.sstaticsSteamId}`}
            className="steam-btn-secondary min-h-11 px-3 text-xs sm:text-sm"
          >
            Ver perfil
          </Link>
        ) : friend.isOnPlatform ? (
          <span className="text-xs text-steam-text-muted">Perfil privado</span>
        ) : (
          <button
            type="button"
            onClick={handleInvite}
            className="steam-btn-primary min-h-11 px-3 text-xs sm:text-sm"
          >
            {copied ? "¡Copiado!" : "Invitar"}
          </button>
        )}
      </div>
    </div>
  );
}
