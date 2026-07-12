# Sincronización y escaneos

## Dos modos distintos

| Modo | Endpoint | Servicio | ¿Consume escaneos? |
|------|----------|----------|---------------------|
| **Sync biblioteca completa** | `POST /api/sync` | `syncUserLibrary()` | No |
| **Escaneo de un juego** | `POST /api/games/[appId]/sync` | `syncSingleGame()` | Sí (excepto tier `owner`) |

**Archivos:** `src/services/sync.service.ts`, `src/services/scan.service.ts`, `src/lib/constants.ts`, `src/lib/tier.ts`

## Snapshots diarios

Steam solo expone horas totales actuales (`playtime_forever`). SStatics construye historial guardando **un snapshot por juego por día UTC**.

- Clave única: `userId + appId + captureDate` (`captureDate` = `YYYY-MM-DD`)
- Re-sync el mismo día **actualiza** el snapshot, no duplica filas
- **Juego nuevo detectado:** crea snapshot de ayer con 0 h y hoy con horas reales → el gráfico muestra la curva de entrada
- Escritura en lotes de 100 (`SYNC_BATCH_SIZE`)
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

**Archivos:** `src/app/api/cron/sync/route.ts`, `src/jobs/daily-sync.ts`, `src/components/CronInitializer.tsx`, `vercel.json`

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
| `GAME_NOT_FOUND` | Juego no en biblioteca del usuario | 404 |
