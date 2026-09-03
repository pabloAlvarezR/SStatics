# API REST

Referencia de endpoints bajo `src/app/api/`. Todas las rutas autenticadas requieren sesión JWT (cookie NextAuth).

Los contratos de respuesta están definidos en `src/lib/validators/api.ts` (Zod).

## Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/auth/steam` | Redirect a Steam OpenID |
| GET | `/api/auth/steam/callback` | Callback OpenID → sesión |
| GET/POST | `/api/auth/[...nextauth]` | Handlers NextAuth |

## Sincronización

| Método | Ruta | Descripción | Errores |
|--------|------|-------------|---------|
| POST | `/api/sync` | Sync biblioteca completa (solo juegos con horas) | 403 privada, 422 sin horas, 429 cooldown, 502 Steam |
| GET | `/api/scans` | Uso diario de escaneos | — |
| POST | `/api/games/[appId]/sync` | Escaneo de un juego | 429 límite, 404 no encontrado |

## Juegos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/games` | Biblioteca del usuario |
| GET | `/api/games/[appId]/history` | Historial y progreso de un juego |
| GET | `/api/games/[appId]/friends` | Comparación con amigos. `?cacheOnly=1` solo caché |

## Social y perfil

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/friends` | Lista de amigos (caché 1 h) |
| POST | `/api/friends` | Fuerza resync de amigos desde Steam |
| GET | `/api/profile` | Perfil del usuario autenticado |
| PATCH | `/api/profile` | Actualiza preferencias de perfil |
| GET | `/api/leaderboard` | Ranking amigos (delta 7d) |
| GET | `/api/admin/users/[steamId]` | Tier/unlimitedScans (solo owner) |
| PATCH | `/api/admin/users/[steamId]` | Asigna free/pro/master y/o unlimitedScans (solo owner) |

## Stats y feed

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/stats` | Estadísticas globales |
| GET | `/api/feed` | Últimos 8 juegos jugados |

## Invitaciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/invite/[code]` | Redirect a `/?invite={code}` |
| GET | `/api/cron/sync` | Sync diario (solo `Authorization: Bearer CRON_SECRET`) |

## Convenciones

- `appId` en rutas es numérico (Steam App ID)
- Respuestas JSON; errores con `{ error: string }` y código HTTP apropiado
- Las rutas de juego validan que el usuario tenga el juego en su biblioteca cuando aplica
