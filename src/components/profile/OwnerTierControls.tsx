"use client";

import { useState } from "react";
import type { AssignableTier } from "@/lib/tier";
import { ASSIGNABLE_TIERS } from "@/lib/tier";

interface OwnerTierControlsProps {
  steamId: string;
  initialTier: string;
  initialUnlimitedScans: boolean;
}

export function OwnerTierControls({
  steamId,
  initialTier,
  initialUnlimitedScans,
}: OwnerTierControlsProps) {
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<AssignableTier>(
    ASSIGNABLE_TIERS.includes(initialTier as AssignableTier)
      ? (initialTier as AssignableTier)
      : "free",
  );
  const [unlimitedScans, setUnlimitedScans] = useState(initialUnlimitedScans);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(steamId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, unlimitedScans }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo guardar");
      }
      setTier(
        ASSIGNABLE_TIERS.includes(data.tier as AssignableTier)
          ? (data.tier as AssignableTier)
          : tier,
      );
      setUnlimitedScans(Boolean(data.unlimitedScans));
      setMessage("Guardado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="min-h-11 px-1 text-[10px] tracking-widest text-steam-text-muted/25 transition-colors hover:text-steam-text-muted/60 focus-visible:text-steam-text-muted focus-visible:outline-none"
        aria-label="Controles de rol"
        title=" "
      >
        ···
      </button>

      {open && (
        <div className="mt-2 max-w-xs space-y-3 rounded border border-steam-border/40 bg-steam-bg-dark/80 p-3">
          <p className="text-[11px] uppercase tracking-wide text-steam-text-muted/70">
            Rol (solo owner)
          </p>
          <label className="block text-xs text-steam-text-muted">
            Tier
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as AssignableTier)}
              className="mt-1 w-full rounded border border-steam-border bg-steam-bg-medium px-2 py-2 text-sm text-steam-text"
            >
              {ASSIGNABLE_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 text-xs text-steam-text-muted">
            <input
              type="checkbox"
              checked={unlimitedScans}
              onChange={(e) => setUnlimitedScans(e.target.checked)}
              className="h-4 w-4 accent-steam-green"
            />
            Escaneos ilimitados
          </label>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="steam-btn-secondary w-full text-xs disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Aplicar"}
          </button>
          {message && <p className="text-xs text-steam-green">{message}</p>}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
