"use client";

import { useState } from "react";

interface ShareProfileButtonProps {
  steamId: string;
}

export function ShareProfileButton({ steamId }: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/u/${steamId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={copy} className="steam-btn-secondary min-h-11 text-sm">
      {copied ? "Enlace copiado" : "Compartir perfil"}
    </button>
  );
}
