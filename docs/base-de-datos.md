# Base de datos

**Esquema:** `prisma/schema.prisma`  
**Motor:** PostgreSQL en producción (Neon/Vercel). SQLite en desarrollo local (`file:./dev.db`).

El script `scripts/sync-prisma-schema.mjs` elige el provider según `DATABASE_URL` antes de `prisma generate`.

## Modelos

### User

Cuenta vinculada a Steam.

| Campo relevante | Uso |
|-----------------|-----|
| `steamId` | ID Steam (único) |
| `tier` | `free` / `pro` / `master` / `owner` — límites de escaneo |
| `unlimitedScans` | Si true, escaneos ilimitados sin ser owner (lo asigna el owner) |
| `inviteCode` | Código de invitación único |
| `isProfilePublic` | Perfil `/u/[steamId]` visible |
| `showStatsOnProfile` | Stats en perfil público |
| `defaultView`, `gridDensity` | Defaults de biblioteca |
| `lastSyncAt` | Última sync completa |

### Game

Catálogo de juegos conocidos por la app.

- PK: `appId` (Steam App ID)
- `name`, `imgIconUrl`, `imgLogoUrl`

### PlaytimeSnapshot

**Corazón del historial.** Un registro por usuario + juego + día UTC.

| Campo | Uso |
|-------|-----|
| `captureDate` | `YYYY-MM-DD` — clave de deduplicación diaria |
| `playtimeMinutes` | Horas totales en ese momento |
| `playtime2weeksMinutes` | Dato live de Steam (últimas 2 sem.) |
| `lastPlayedAt` | Última sesión según Steam |

**Unique:** `userId + appId + captureDate`

Usado para: gráficos, stats, feed, comparación SStatics entre amigos.

### SteamFriendCache

Lista de amigos Steam por usuario.

- **Unique:** `userId + friendSteamId`
- TTL lógico: 1 h (`FRIENDS_CACHE_TTL_MS`)
- Sin datos por juego — solo identidad y avatar

### SteamFriendGameCache

Caché de horas Steam por amigo + juego.

| Campo | Uso |
|-------|-----|
| `appId` | Juego consultado |
| `playtimeMinutes` | Horas si `hasData=true` |
| `hasData` | `false` = no tiene juego o biblioteca privada |
| `fetchedAt` | Para TTL de 12 h |

**Unique:** `userId + friendSteamId + appId`

**Importante:** `appId` no tiene FK a `Game`. Las horas deben corresponder exactamente al juego consultado. Ver bug corregido en `juego-detalle-y-amigos.md`.

**Limpieza:** `npx tsx scripts/clean-friend-game-cache.ts`

### GameScan

Registro de escaneos individuales por día (límite tier).

- Indexado por `userId + scanDate`
- Tier `owner` no registra escaneos

## Repositorio de snapshots

`src/repositories/snapshot.repository.ts` — queries optimizadas:

- Último snapshot por juego (SQL join)
- Sparklines e historial completo
- Historial multi-usuario (comparación amigos en plataforma)
- Deltas por periodo, heatmap, percentiles

## Migraciones

```bash
npx prisma migrate dev    # desarrollo
npx prisma migrate deploy # producción
```

Historial en `prisma/migrations/`.

## Seed

`prisma/seed.ts` — datos de demo si aplica. Ejecutar con `npx prisma db seed`.

El comando de seed está en `prisma.config.ts` (Prisma 6 ya no usa `package.json#prisma`). Ese archivo carga `.env` y `.env.local` porque, con config file, el CLI **no** inyecta variables de entorno solo.
