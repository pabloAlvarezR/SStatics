# Sincronización y escaneos

## Dos modos distintos

| Modo | Endpoint | Servicio | ¿Consume escaneos? |
|------|----------|----------|---------------------|
| **Sync biblioteca completa** | `POST /api/sync` | `syncUserLibrary()` | No |
| **Escaneo de un juego** | `POST /api/games/[appId]/sync` | `syncSingleGame()` | Sí (excepto tier `owner`) |

**Archivos:** `src/services/sync.service.ts`, `src/services/scan.service.ts`, `src/lib/constants.ts`, `src/lib/tier.ts`

## Sync por chunks (serverless)

La biblioteca completa se sincroniza en varias peticiones para evitar timeouts en Vercel:

- `SYNC_CHUNK_SIZE` = 60 juegos por petición
- `SYNC_PARALLEL_UPSERTS` = 8 escrituras en paralelo por chunk
- **Caché temporal** (`SteamLibrarySyncCache`): en el chunk 0 se obtiene la lista de Steam una sola vez; los chunks siguientes reutilizan esa lista (TTL 30 min)
- Cliente: `runChunkedLibrarySync()` en `src/lib/sync-client.ts` — barra de progreso y recarga incremental de la biblioteca tras cada chunk

**Archivos:** `src/app/api/sync/route.ts`, `src/services/sync.service.ts`, `src/components/library/LibraryGrid.tsx`

## Snapshots diarios

Steam solo expone horas totales actuales (`playtime_forever`). SStatics construye historial guardando **un snapshot por juego por día UTC**.

- Clave única: `userId + appId + captureDate` (`captureDate` = `YYYY-MM-DD`)
- Re-sync el mismo día **actualiza** el snapshot, no duplica filas
- **Juego nuevo detectado:** solo se guarda el snapshot del día actual con las horas reales de Steam (no se inventa un día previo a 0 h)
- **Limpieza:** al sincronizar (biblioteca o escaneo), se eliminan snapshots artificiales antiguos (`ayer = 0 h` + día siguiente ya existente). Las lecturas de historial/sparklines también omiten ese punto, así el gráfico ya no lo muestra aunque aún no hayas sincronizado.
- Escritura en chunks de 60 con upserts paralelos (`SYNC_CHUNK_SIZE`, `SYNC_PARALLEL_UPSERTS`)
- Retención en BD: 10 años (`STORAGE_RETENTION_YEARS`), sin purga automática

Ver modelo `PlaytimeSnapshot` en `base-de-datos.md`.

## Cooldown de sync completa

- `SYNC_COOLDOWN_MS` = 5 minutos entre syncs manuales
- Tier `owner`: sin cooldown

## Escaneos individuales y tiers

Límite diario por tier (`TIER_DAILY_SCANS` en `constants.ts`):

| Tier | Escaneos/día |
|------|--------------|
| `free` | 3 |
| `pro` | 6 |
| `master` | 15 |
| `owner` | Ilimitado (no registra en `GameScan`) |

La asignación de tier ocurre en login (`resolveUserTier()` en `src/lib/tier.ts`). El tier `owner` se asigna a cuentas específicas (p. ej. `batondejesus`).

`GET /api/scans` devuelve uso diario: `remaining`, `used`, `limit`, `unlimited`.

## Sync automático diario

**Producción (Vercel):** `GET /api/cron/sync` — programado en `vercel.json` a las 03:00 UTC. Protegido con `CRON_SECRET`.

**Desarrollo local:** `node-cron` en `src/jobs/daily-sync.ts` (solo si `NODE_ENV=development` y no `VERCEL`).

**Archivos:** `src/app/api/cron/sync/route.ts`, `src/jobs/daily-sync.ts`, `src/components/layout/CronInitializer.tsx`, `vercel.json`

- Llama `syncAllUsers({ force: true })` — ignora cooldown
- No corre en `NODE_ENV === "test"`

**Limitación Vercel:** el cron vive en serverless; no uses `node-cron` en producción.

## Límites de visualización (futuro)

`TIER_HISTORY_YEARS` define cuántos años de historial **mostrar** por tier (3/6/10). Aún no aplicado en UI — actualmente se muestran hasta 10 años (`VISIBLE_HISTORY_YEARS`).

## UI de sync

- `SyncButton` en header — sync biblioteca completa
- Botón «Escanear este juego» en detalle de juego
- Auto-sync en biblioteca si el usuario no tiene snapshots (`needsSync`)

## Errores habituales

| Error | Causa | HTTP |
|-------|-------|------|
| `PRIVATE_LIBRARY` | Biblioteca Steam privada | 403 |
| Cooldown activo | Sync reciente | 429 |
| Límite escaneos | Cuota diaria agotada | 429 |
| `SYNC_SESSION_EXPIRED` | Caché de sync expirada entre chunks | 409 |
| `GAME_NOT_FOUND` | Juego no en biblioteca del usuario | 404 |

## Bug corregido: primer día a 0 h

**Antes:** al detectar un juego nuevo se insertaba un snapshot de ayer con 0 h y otro de hoy con las horas reales, para forzar una «curva de entrada». Eso hacía que el gráfico bajara a 0 y subiera al día siguiente sin reflejar la realidad de Steam.

**Ahora:** solo se guarda el día actual con `playtime_forever`. La sync (o un escaneo) purga esos puntos de la BD. Las queries de historial usan `omitArtificialLeadingEntry` para no mostrar el 0 h artificial en gráficos aunque la purga no se haya ejecutado aún.
