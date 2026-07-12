"use client";

import { useEffect, useState } from "react";
import type { GameFriendsComparisonResponse } from "@/lib/validators/api";

const MAX_STEAM_REFRESH_ROUNDS = 50;

async function fetchFriends(
  appId: number,
  cacheOnly: boolean,
): Promise<GameFriendsComparisonResponse> {
  const url = cacheOnly
    ? `/api/games/${appId}/friends?cacheOnly=1`
    : `/api/games/${appId}/friends`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al cargar datos de amigos");
  return res.json();
}

/**
 * Carga la comparación de amigos y espera a completar todos los lotes de Steam
 * antes de exponer los datos (evita listas parciales).
 */
export function useCompleteFriendsComparison(appId: number) {
  const [data, setData] = useState<GameFriendsComparisonResponse | null>(null);
  const [loadedAppId, setLoadedAppId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("Cargando amigos...");
  const [error, setError] = useState<Error | null>(null);

  const isStale = data !== null && data.appId !== appId;
  const safeData = data?.appId === appId ? data : null;

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setIsLoading(true);
      setLoadedAppId(null);
      setError(null);
      setData(null);
      setMessage("Cargando amigos...");

      try {
        let result = await fetchFriends(appId, true);
        if (cancelled) return;

        let rounds = 0;
        while ((result.steamRefreshPending ?? 0) > 0 && rounds < MAX_STEAM_REFRESH_ROUNDS) {
          rounds++;
          setMessage(
            `Obteniendo horas desde Steam (${result.steamRefreshPending} amigo${result.steamRefreshPending !== 1 ? "s" : ""} pendientes)...`,
          );
          result = await fetchFriends(appId, false);
          if (cancelled) return;
        }

        setData(result);
        setLoadedAppId(appId);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Error al cargar amigos"));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadAll();
    return () => {
      cancelled = true;
    };
  }, [appId]);

  const waitingForApp =
    isLoading || isStale || (loadedAppId !== null && loadedAppId !== appId);

  return {
    data: safeData,
    isLoading: waitingForApp,
    message,
    error,
  };
}
