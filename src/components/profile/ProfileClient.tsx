"use client";

import Image from "next/image";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import type { ProfileResponse, ProfileUpdate } from "@/lib/validators/api";

const ACCENT_COLORS = [
  "#a4d007",
  "#66c0f4",
  "#c4e830",
  "#ff6b6b",
  "#b388ff",
  "#ffd54f",
];

interface ProfileClientProps {
  initialData: ProfileResponse;
}

type ProfileFormState = {
  bio: string;
  isProfilePublic: boolean;
  defaultView: "grid" | "list";
  gridDensity: "compact" | "normal" | "large";
  accentColor: string | null;
  showStatsOnProfile: boolean;
};

function toFormState(data: ProfileResponse): ProfileFormState {
  return {
    bio: data.bio ?? "",
    isProfilePublic: data.isProfilePublic,
    defaultView: data.defaultView,
    gridDensity: data.gridDensity,
    accentColor: data.accentColor,
    showStatsOnProfile: data.showStatsOnProfile,
  };
}

async function fetchProfile(): Promise<ProfileResponse> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error("Error al cargar perfil");
  return res.json();
}

async function updateProfile(updates: ProfileUpdate): Promise<ProfileResponse> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Error al guardar");
  return res.json();
}

export function ProfileClient({ initialData }: ProfileClientProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<ProfileFormState>(() => toFormState(initialData));
  const [savedForm, setSavedForm] = useState<ProfileFormState>(() => toFormState(initialData));

  const { data } = useQuery<ProfileResponse>({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    initialData,
  });

  useEffect(() => {
    const next = toFormState(data);
    setForm(next);
    setSavedForm(next);
  }, [data]);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm],
  );

  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    if (!isDirty) return;

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) return;
      if (!window.confirm("Tienes cambios sin guardar. ¿Salir sin guardar?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [isDirty]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile"], updated);
      const next = toFormState(updated);
      setForm(next);
      setSavedForm(next);
    },
  });

  const updateField = useCallback(<K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = () => {
    mutation.mutate({
      bio: form.bio,
      isProfilePublic: form.isProfilePublic,
      defaultView: form.defaultView,
      gridDensity: form.gridDensity,
      accentColor: form.accentColor,
      showStatsOnProfile: form.showStatsOnProfile,
    });
  };

  const handleDiscard = () => {
    if (
      isDirty &&
      !window.confirm("¿Descartar los cambios sin guardar?")
    ) {
      return;
    }
    setForm(savedForm);
  };

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/invite/${data.inviteCode}`
      : `/api/invite/${data.inviteCode}`;

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-steam-text sm:text-3xl">Mi Perfil</h1>
        <p className="mt-2 text-sm text-steam-text-muted">
          Personaliza cómo te ven otros jugadores en SStatics.
        </p>
      </div>

      <div className="steam-panel overflow-hidden">
        <div className="border-b border-steam-border/30 bg-steam-bg-dark/40 px-5 py-6 sm:px-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            {data.avatarUrl && (
              <Image
                src={data.avatarUrl}
                alt={data.personaName}
                width={96}
                height={96}
                className="rounded-lg border-2 border-steam-border/50 shadow-lg"
              />
            )}
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-steam-text">{data.personaName}</h2>
              <p className="mt-1 text-sm text-steam-text-muted">Steam ID: {data.steamId}</p>
              <span
                className={`mt-2 inline-flex capitalize ${
                  data.tier === "owner" ? "steam-tier-badge-owner" : "steam-tier-badge"
                }`}
              >
                {data.tier === "owner" ? "Owner" : data.tier}
              </span>
              {data.profileUrl && (
                <a
                  href={data.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-sm text-steam-link hover:underline"
                >
                  Ver perfil en Steam →
                </a>
              )}
              <p className="mt-2 text-xs text-steam-text-muted">
                Miembro desde {new Date(data.createdAt).toLocaleDateString("es-ES")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 p-5 sm:p-8">
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-steam-text">Sobre ti</h3>
              <p className="text-sm text-steam-text-muted">Visible en tu perfil público.</p>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-steam-text-muted">Bio</span>
              <textarea
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                maxLength={300}
                rows={4}
                className="mt-2 w-full rounded-lg border border-steam-border/50 bg-steam-bg-dark/50 px-4 py-3 text-sm text-steam-text focus:border-steam-green/50 focus:outline-none focus:ring-1 focus:ring-steam-green/30"
                placeholder="Cuéntanos sobre ti, tus juegos favoritos..."
              />
              <span className="mt-1 block text-right text-xs text-steam-text-muted">
                {form.bio.length}/300
              </span>
            </label>
          </section>

          <section className="space-y-4 border-t border-steam-border/20 pt-8">
            <div>
              <h3 className="text-lg font-semibold text-steam-text">Privacidad</h3>
            </div>
            <Toggle
              label="Perfil público"
              description="Otros usuarios pueden ver tu perfil en /u/[steamId]"
              checked={form.isProfilePublic}
              onChange={(v) => updateField("isProfilePublic", v)}
            />
            <Toggle
              label="Mostrar estadísticas en perfil público"
              checked={form.showStatsOnProfile}
              onChange={(v) => updateField("showStatsOnProfile", v)}
            />
          </section>

          <section className="space-y-5 border-t border-steam-border/20 pt-8">
            <div>
              <h3 className="text-lg font-semibold text-steam-text">Preferencias de biblioteca</h3>
              <p className="text-sm text-steam-text-muted">Se aplican al abrir tu biblioteca.</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-steam-text-muted">Vista por defecto</span>
                <select
                  value={form.defaultView}
                  onChange={(e) =>
                    updateField("defaultView", e.target.value as "grid" | "list")
                  }
                  className="mt-2 min-h-11 w-full rounded-lg border border-steam-border/50 bg-steam-bg-dark/50 px-3 py-2 text-sm text-steam-text"
                >
                  <option value="grid">Cuadrícula</option>
                  <option value="list">Lista</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-steam-text-muted">Densidad</span>
                <select
                  value={form.gridDensity}
                  onChange={(e) =>
                    updateField(
                      "gridDensity",
                      e.target.value as "compact" | "normal" | "large",
                    )
                  }
                  className="mt-2 min-h-11 w-full rounded-lg border border-steam-border/50 bg-steam-bg-dark/50 px-3 py-2 text-sm text-steam-text"
                >
                  <option value="compact">Compacta</option>
                  <option value="normal">Normal</option>
                  <option value="large">Grande</option>
                </select>
              </label>
            </div>

            <div>
              <span className="text-sm font-medium text-steam-text-muted">Color de acento</span>
              <div className="mt-3 flex flex-wrap gap-3">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => updateField("accentColor", color)}
                    className={`h-11 w-11 rounded-full border-2 transition-transform hover:scale-110 ${
                      form.accentColor === color ? "border-white shadow-lg" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Color ${color}`}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => updateField("accentColor", null)}
                  className="min-h-11 rounded-lg border border-steam-border/50 px-4 text-xs text-steam-text-muted hover:text-steam-text"
                >
                  Por defecto
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t border-steam-border/20 pt-8">
            <h3 className="text-lg font-semibold text-steam-text">Invitar amigos</h3>
            <p className="break-all rounded-lg bg-steam-bg-dark/50 px-4 py-3 text-xs text-steam-text-muted">
              {inviteUrl}
            </p>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="steam-btn-secondary min-h-11"
            >
              {copied ? "¡Enlace copiado!" : "Copiar enlace de invitación"}
            </button>
          </section>
        </div>
      </div>

      {isDirty && (
        <div className="sticky bottom-4 z-40 mx-auto max-w-3xl">
          <div className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-steam-bg-medium/95 p-4 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-amber-200">
              Tienes cambios sin guardar
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDiscard}
                className="steam-btn-secondary min-h-11 flex-1 sm:flex-none"
              >
                Descartar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={mutation.isPending}
                className="steam-btn-primary min-h-11 flex-1 sm:flex-none disabled:opacity-60"
              >
                {mutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Guardando...
                  </span>
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isDirty && mutation.isSuccess && (
        <p className="text-center text-sm font-medium text-steam-green">
          Cambios guardados correctamente
        </p>
      )}

      {mutation.isError && (
        <p className="text-center text-sm text-red-300">Error al guardar. Inténtalo de nuevo.</p>
      )}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 rounded-lg border border-steam-border/20 bg-steam-bg-dark/30 px-4 py-3">
      <div>
        <span className="text-sm font-medium text-steam-text">{label}</span>
        {description && <p className="text-xs text-steam-text-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-steam-green" : "bg-steam-bg-light"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
