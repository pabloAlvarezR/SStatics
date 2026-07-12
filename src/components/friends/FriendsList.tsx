"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FriendCard } from "@/components/friends/FriendCard";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Ps1PeekImage } from "@/components/ps1/Ps1PeekImage";
import type { FriendsResponse } from "@/lib/validators/api";

interface FriendsListProps {
  initialData: FriendsResponse;
}

type FilterType = "all" | "platform" | "pending";

async function fetchFriends(): Promise<FriendsResponse> {
  const res = await fetch("/api/friends");
  if (!res.ok) throw new Error("Error al cargar amigos");
  return res.json();
}

export function FriendsList({ initialData }: FriendsListProps) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const { data, isFetching, isLoading } = useQuery<FriendsResponse>({
    queryKey: ["friends"],
    queryFn: fetchFriends,
    initialData,
  });

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/invite/${data.inviteCode}`
      : `/api/invite/${data.inviteCode}`;

  const filtered = useMemo(() => {
    let list = data.friends;

    if (filter === "platform") list = list.filter((f) => f.isOnPlatform);
    if (filter === "pending") list = list.filter((f) => !f.isOnPlatform);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.personaName.toLowerCase().includes(q));
    }

    return list;
  }, [data.friends, filter, search]);

  const onPlatformCount = data.friends.filter((f) => f.isOnPlatform).length;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/friends", { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["friends"] });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-steam-text sm:text-3xl">Amigos</h1>
          <p className="mt-1 text-sm text-steam-text-muted">
            {data.friends.length} amigos de Steam · {onPlatformCount} en SStatics
            {isFetching && !isSyncing && (
              <span className="ml-2 inline-flex items-center gap-1.5 text-steam-link">
                <LoadingSpinner size="xs" />
                Actualizando...
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing}
          className="steam-btn-primary min-h-11 px-4 text-sm disabled:opacity-60"
        >
          {isSyncing ? (
            <span className="inline-flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Sincronizando...
            </span>
          ) : (
            "Actualizar desde Steam"
          )}
        </button>
      </div>

      {isLoading && (
        <div className="steam-panel">
          <LoadingPanel message="Cargando lista de amigos..." />
        </div>
      )}

      {!isLoading && data.isPrivate && data.friends.length === 0 && (
        <div className="steam-panel px-6 py-12 text-center">
          <p className="text-lg font-medium text-steam-text">Lista de amigos no disponible</p>
          <p className="mt-2 max-w-lg mx-auto text-sm text-steam-text-muted">
            Tu lista de amigos de Steam puede ser privada. Ve a Steam → Perfil → Editar perfil →
            Privacidad y asegúrate de que tu lista de amigos sea visible.
          </p>
        </div>
      )}

      {!isLoading && data.friends.length > 0 && (
        <div className="relative space-y-6">
          <div className="steam-panel space-y-4 p-4">
            <input
              type="search"
              placeholder="Buscar amigos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-11 w-full rounded border border-steam-border/50 bg-steam-bg-dark/50 px-4 py-2 text-sm text-steam-text placeholder:text-steam-text-muted focus:border-steam-green/50 focus:outline-none sm:max-w-xs"
            />
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "all", label: "Todos" },
                  { value: "platform", label: "En SStatics" },
                  { value: "pending", label: "Pendientes" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilter(opt.value)}
                  className={`min-h-11 rounded px-4 text-sm font-medium transition-colors ${
                    filter === opt.value
                      ? "bg-steam-green text-steam-bg-dark"
                      : "border border-steam-border/50 text-steam-text-muted hover:text-steam-text"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map((friend) => (
              <FriendCard key={friend.steamId} friend={friend} inviteUrl={inviteUrl} />
            ))}
            {filtered.length === 0 && (
              <div className="space-y-4 py-8 text-center">
                <p className="text-steam-text-muted">Ningún amigo coincide con los filtros.</p>
                <div className="mx-auto max-w-[180px]">
                  <Ps1PeekImage
                    src="/branding/regina_dino_crisis.png"
                    hint="Regina también busca supervivientes..."
                  />
                </div>
              </div>
            )}
          </div>
          {isSyncing && <LoadingOverlay message="Sincronizando amigos desde Steam..." />}
        </div>
      )}
    </div>
  );
}
