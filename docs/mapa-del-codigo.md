# Mapa del código

Índice de **dónde vive cada responsabilidad**. Empieza aquí si no sabes qué archivo abrir; luego lee el doc de dominio en `docs/`.

## Flujo por capas

```
Página (src/app/*/page.tsx)
  → componente cliente (src/components/<dominio>/)
  → fetch a API (src/app/api/…)  o  datos SSR vía service
  → service (src/services/)
  → repository / Prisma (src/repositories/, src/lib/prisma.ts)
  → Steam Web API (src/services/steam.service.ts + steam-api-guard)
```

**Regla:** queries SQL complejas o agregaciones de snapshots → `src/repositories/`. Orquestación de negocio y llamadas Steam → `src/services/`. Utilidades puras y auth → `src/lib/`.

## Página → UI → service → API

| Ruta UI | Página / UI | Service principal | API relacionada |
|---------|-------------|-------------------|-----------------|
| `/` (guest) | `src/app/page.tsx` | — (login) | `/api/auth/steam`, callback |
| `/` (auth) | `page.tsx` + `home/HomeFeed.tsx` | `feed.service` | `GET /api/feed` |
| `/library` | `library/page.tsx` + `library/*` | `chart.service`, `scan.service`, `stats.service` | `GET /api/games`, `POST /api/sync`, `GET /api/scans` |
| `/game/[appId]` | `game/[appId]/page.tsx` + `game/*` | `chart.service`, `game-friends.service`, `scan.service` | `GET …/history`, `POST …/sync`, `GET …/friends` |
| `/friends` | `friends/page.tsx` + `friends/*` | `friends.service` | `GET /api/friends` |
| `/leaderboard` | `leaderboard/page.tsx` + `LeaderboardClient` | `leaderboard.service` | `GET /api/leaderboard` |
| `/replay` | `replay/page.tsx` + `ReplayClient` | `replay.service` | — (SSR) |
| `/share/week` | `share/week/page.tsx` + `WeekShareClient` | `replay.service` | — (SSR) |
| `/profile` | `profile/page.tsx` + `profile/ProfileClient.tsx` | `stats.service` (+ Prisma en route) | `GET/PATCH /api/profile` |
| `/u/[steamId]` | `u/[steamId]/page.tsx` (+ `OwnerTierControls`) | `stats.service`, `admin.service` | `PATCH /api/admin/users/[steamId]` |

Referencia completa de contratos: [`api.md`](./api.md).

## Servicios (`src/services/`)

| Archivo | Responsabilidad |
|---------|-----------------|
| `steam.service.ts` | Cliente Steam Web API (juegos, amigos, perfiles); `minutesToHours` |
| `sync.service.ts` | Sync de biblioteca / juego único / todos los usuarios (cron) |
| `scan.service.ts` | Cupo diario de escaneos por tier |
| `chart.service.ts` | Biblioteca con sparklines + historial de un juego |
| `stats.service.ts` | Stats del dashboard y perfil público |
| `feed.service.ts` | Feed de juegos recientes (home autenticado) |
| `friends.service.ts` | Lista de amigos Steam + flag “está en SStatics” |
| `game-friends.service.ts` | Comparación de horas con amigos en un juego |
| `leaderboard.service.ts` | Ranking amigos por delta 7d |
| `social.service.ts` | Snippets de actividad de amigos para el feed |
| `replay.service.ts` | Replay mensual + share semanal |
| `admin.service.ts` | Asignación de tiers por owner |
| `steam-friend-game-cache.service.ts` | Caché de bibliotecas de amigos (TTL) |

## Lib denso (`src/lib/`)

| Archivo | Responsabilidad |
|---------|-----------------|
| `constants.ts` | TTL, límites, tiers, tamaños de batch — **fuente de verdad numérica** |
| `tier.ts` | Resolver tier (owner / env) y límites de escaneo |
| `auth.ts` | NextAuth (handlers, `auth`, `signIn`) |
| `auth-callback.ts` | Cookie/path seguro post-login |
| `steam-openid.ts` | OpenID 2.0 Steam (URL + verify) |
| `steam-login-proof.ts` | Prueba firmada entre callback OpenID y NextAuth |
| `steam-api-guard.ts` | Serializa llamadas Steam (~1 req/s) |
| `steam-images.ts` | Candidatos de URL de carátula |
| `prisma.ts` | Cliente Prisma (+ PRAGMAs si SQLite) |
| `validators/api.ts` | Esquemas Zod de entrada/salida API |
| `chart-merge.ts` | Fusionar series para gráficos multi-amigo |
| `hours-range.ts` | Recortar puntos de gráfico a 7d / 1m / 6m |
| `artificial-entry-snapshots.ts` | Detectar/omitir el snapshot artificial «ayer = 0 h» |
| `leaderboard-rank.ts` | Ordenación pura del ranking de amigos |
| `playtime-progress.ts` | Delta / tendencia entre puntos de gráfico |
| `sync-client.ts` | Sync por chunks desde el cliente |
| `map-concurrent.ts` | `map` con concurrencia limitada |
| `query-client.tsx` | Provider React Query |

## Repositorio

| Archivo | Responsabilidad |
|---------|-----------------|
| `repositories/snapshot.repository.ts` | Consultas de `PlaytimeSnapshot` (último por juego, sparklines, deltas, totales) + purga de entradas artificiales y de 0 h |

## Cron: local vs producción

| Entorno | Arranque | Ejecución |
|---------|----------|-----------|
| Dev local | `components/layout/CronInitializer.tsx` montado en `layout.tsx` | `jobs/daily-sync.ts` (node-cron) → `sync.service.syncAllUsers` |
| Vercel | `vercel.json` schedule | `GET /api/cron/sync` (Bearer `CRON_SECRET`) → `syncAllUsers` |

En Vercel **no** corre node-cron dentro del layout.

## Componentes por carpeta

| Carpeta | Dominio |
|---------|---------|
| `components/layout/` | Header, cron initializer |
| `components/library/` | Biblioteca, toolbar, tarjetas |
| `components/game/` | Detalle de juego y comparación amigos |
| `components/friends/` | Lista de amigos |
| `components/home/` | Feed autenticado |
| `components/profile/` | Edición de perfil |
| `components/stats/` | Cards, heatmap, top games |
| `components/charts/` | Sparkline, gráfico de playtime y selector 7d/1m/6m |
| `components/ps1/` | Easter eggs / UI nostálgica |
| `components/ui/` | Spinners, sync button, avatares, covers |

## Tests (`__tests__/`)

Cubren **lógica pura** en `lib/` y helpers exportados (p. ej. `minutesToHours`). Los services que dependen de Prisma/Steam **no** tienen suite de integración todavía.

| Test | Módulo real |
|------|-------------|
| `tier.test.ts` | `lib/tier.ts` + `constants` (límites / unlimitedScans) |
| `leaderboard-rank.test.ts` | `lib/leaderboard-rank.ts` |
| `admin-tier-schema.test.ts` | Zod admin tiers (free/pro/master, rechazo owner) |
| `chart-merge.test.ts` | `lib/chart-merge.ts` |
| `hours-range.test.ts` | `lib/hours-range.ts` |
| `artificial-entry-snapshots.test.ts` | `lib/artificial-entry-snapshots.ts` |
| `playtime-progress.test.ts` | `lib/playtime-progress.ts` |
| `steam-hours.test.ts` | `minutesToHours` en `steam.service.ts` |

## Docs por dominio

Ver índice en [`README.md`](./README.md). Constantes numéricas deben coincidir con `src/lib/constants.ts`.
