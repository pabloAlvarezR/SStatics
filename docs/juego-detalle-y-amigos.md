# Detalle de juego y comparación con amigos

## Ruta

`/game/[appId]` — protegida por middleware.

**Archivos principales:**

- `src/app/game/[appId]/page.tsx` — SSR
- `src/components/game/GameDetailClient.tsx` — orquestación cliente
- `src/components/game/FriendsGameComparison.tsx` — UI amigos
- `src/hooks/useCompleteFriendsComparison.ts` — carga completa de amigos
- `src/services/game-friends.service.ts` — lógica servidor
- `src/services/steam-friend-game-cache.service.ts` — caché Steam

## Página de detalle

### Datos propios del usuario

- Cover (`GameCoverImage`), horas totales, última sesión, puntos de datos
- Progreso (`ProgressBadge`) si ≥ `MIN_SNAPSHOTS_FOR_CHART` (2) snapshots
- Gráfico `PlaytimeChart` (Recharts) con historial de snapshots
- Selector de ventana `HoursRangeSelector` (`7d` / `1m` / `6m` = 7 / 30 / 180 días) sobre el gráfico; también filtra series de amigos
- Botón «Escanear este juego» (consume cuota diaria; ver `sincronizacion-y-escaneos.md`)

React Query: `queryKey: ["game", appId]` con `initialData` del SSR.

El eje Y del gráfico se ajusta a los valores visibles de la ventana (no siempre desde 0 h) para que cambios pequeños se vean.

### Remount al cambiar de juego

`GameDetailClient` recibe `key={appId}` en `page.tsx` para forzar remount al navegar entre juegos. Evita mostrar datos del juego anterior.

## Comparación con amigos

La UI muestra un **ranking compacto** de amigos con horas en el juego (ordenado por total), además de la lista de comparación/gráfico.

### Fuentes de horas

| Fuente | Condición | Gráfico comparativo |
|--------|-----------|---------------------|
| `sstatics` | Amigo registrado en plataforma con snapshots de ese `appId` | Sí, si perfil público y ≥2 puntos |
| `steam` | Amigo sin datos SStatics pero biblioteca Steam pública | Solo horas totales |
| Sin datos | Privado o no posee el juego | — |

### Flujo servidor (`getFriendsGameComparison`)

1. Lee lista de amigos de `SteamFriendCache`
2. Detecta cuáles están en plataforma (`User` por `steamId`)
3. Para amigos en plataforma: busca snapshots en `PlaytimeSnapshot` filtrados por **`appId`**
4. Para amigos sin snapshots SStatics: consulta `SteamFriendGameCache` (TTL 12 h)
5. Si no es `cacheOnly`: refresca hasta **8 amigos por petición** vía API Steam (`STEAM_FRIEND_GAME_REFRESH_MAX`)
6. Devuelve `steamRefreshPending` = amigos aún pendientes

**API:** `GET /api/games/[appId]/friends`  
Query `?cacheOnly=1` — solo lee caché, no llama a Steam.

### Flujo cliente (`useCompleteFriendsComparison`)

Diseñado para **no mostrar listas parciales** mientras Steam refresca en lotes:

1. Primera llamada con `cacheOnly=1`
2. Bucle mientras `steamRefreshPending > 0` (máx. 50 rondas)
3. Mensaje de progreso: «X amigos pendientes...»
4. Solo expone `data` si `data.appId === appId` actual

### Gráfico comparativo

El usuario puede seleccionar hasta `MAX_FRIENDS_CHART_COMPARE` (5) amigos. Las series se fusionan en `src/lib/chart-merge.ts` y se pasan a `PlaytimeChart`.

Al cambiar de `appId`, se resetean los amigos seleccionados en el gráfico.

## Bug corregido: horas de otro juego

**Síntoma:** al entrar en un juego que los amigos no tienen, aparecían horas incorrectas (de otro juego).

**Causas:**

1. **`getOwnedGamePlaytime`** tenía fallback `games[0]` si no encontraba el `appId` en la respuesta de Steam. Guardaba horas del juego equivocado en `SteamFriendGameCache` con el `appId` correcto.
2. **Estado cliente obsoleto** al navegar entre juegos sin remount.

**Fixes aplicados:**

- Eliminado fallback `games[0]`; comparación estricta `Number(g.appid) === appId`
- Guard en hook: no exponer datos si `data.appId !== appId`
- `key={appId}` en `GameDetailClient`
- Reset de amigos seleccionados al cambiar juego

**Limpieza BD:** script `scripts/clean-friend-game-cache.ts` — borra `SteamFriendGameCache` para forzar re-fetch limpio.

## Regla importante

Nunca asignar horas de Steam a un `appId` sin verificar que `game.appid === appId`. Si Steam no devuelve el juego, guardar `hasData: false`, no inventar datos.
