# Seguridad (alpha pública)

Medidas implementadas y checklist antes de mostrar SStatics a amigos.

## Autenticación

### Login Steam con prueba HMAC

**Archivo:** `src/lib/steam-login-proof.ts`

Tras verificar OpenID en el callback, se genera un `loginProof` firmado con `AUTH_SECRET` (válido 5 min). El provider de NextAuth **rechaza** logins sin prueba válida.

**Por qué:** sin esto, un atacante podría enviar un `steamId` arbitrario al endpoint de Credentials y suplantar identidades.

### Sesiones JWT

- Firmadas con `AUTH_SECRET` (mín. 32 caracteres)
- `trustHost: true` para Vercel (hosts dinámicos)

### Rutas protegidas

`src/middleware.ts` exige sesión en `/library`, `/game`, `/friends`, `/profile`.

## API

| Medida | Detalle |
|--------|---------|
| Auth en endpoints | Todos los `/api/*` de datos exigen `auth()` excepto auth, invite redirect y cron |
| Validación Zod | Entrada/salida en rutas críticas (`src/lib/validators/api.ts`) |
| Perfil PATCH | Solo campos permitidos en `profileUpdateSchema` — no se puede cambiar `tier` ni `unlimitedScans` vía perfil |
| Admin tiers | `PATCH /api/admin/users/[steamId]` solo si el caller es owner; no permite asignar `owner` |
| Errores genéricos | Mensajes 500 sin detalles internos al cliente |
| Logs | No se loguea `steamId` en rutas de sync en producción |

## Cron

**Ruta:** `GET /api/cron/sync`

- Requiere header `Authorization: Bearer {CRON_SECRET}`
- Vercel lo envía automáticamente cuando `CRON_SECRET` está configurado
- Sin secreto → 401

## Privacidad de datos

| Dato | Regla |
|------|-------|
| Perfil público | Solo si `isProfilePublic=true` |
| Stats en perfil público | Solo si `showStatsOnProfile=true` |
| Historial de amigos en gráfico | Solo si amigo tiene perfil público en SStatics |
| Horas Steam de amigos | Solo biblioteca Steam pública del amigo |

## Headers HTTP

Configurados en `next.config.ts`:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restrictiva
- `X-Powered-By` desactivado

## Secretos y git

- `.env` y `.env.local` en `.gitignore`
- Nunca commitear `STEAM_API_KEY`, `AUTH_SECRET`, `CRON_SECRET`, `DATABASE_URL`

## Dependencias (auditoría npm)

Las vulnerabilidades reportadas por `npm audit` se tratan subiendo paquetes directos y, si el padre no publica parche, con `overrides` en `package.json` (`brace-expansion`, `deepmerge-ts`, `js-yaml`, `jsdom`, `nanoid`, `postcss`, `sharp`).

**No** se migra a Prisma 7/8 todavía: el cliente 8 está en RC y rompería el flujo actual de `schema.prisma` + `sync-prisma-schema.mjs`. Prisma queda en **6.19.3**.

**No** se salta a Next.js 16: los avisos de Next se cubren con **15.5.25** (parches de App Router / Server Actions).

Auth.js: `next-auth@5.0.0-beta.32` (`@auth/core` ≥ 0.41.3).

## Tier owner

En producción, define `OWNER_STEAM_IDS` con tu Steam ID real. Evita depender solo del nombre de persona Steam (puede cambiar).

```
OWNER_STEAM_IDS=76561198012345678
```

El owner puede subir a otros a `free`/`pro`/`master` y marcar `unlimitedScans` desde un control oculto en `/u/{steamId}`. Ver `admin-y-tiers.md`.
## Checklist pre-alpha

- [ ] `AUTH_SECRET` generado aleatoriamente (no el placeholder)
- [ ] `CRON_SECRET` distinto de `AUTH_SECRET`
- [ ] `OWNER_STEAM_IDS` configurado en Vercel
- [ ] `AUTH_URL` = URL real de producción
- [ ] Steam API key con dominio restringido si es posible
- [ ] `.env` local no está en el repo
- [ ] Probar login/logout y que no se accede a `/library` sin sesión
- [ ] Probar que `/api/cron/sync` devuelve 401 sin token

## Riesgos conocidos (alpha)

| Riesgo | Mitigación actual | Futuro |
|--------|-------------------|--------|
| Sin rate limit en API propia | Aceptable para pocos usuarios | Middleware rate limit |
| Steam API key en servidor | Estándar — nunca en cliente | Rotación periódica |
| Neon free duerme | Primera request lenta tras inactividad | Upgrade o keep-alive |
| Dual DB (SQLite/PG) | Prod siempre PostgreSQL; local puede usar SQLite | Ver `base-de-datos.md` |

## Reportar problemas

Si un amigo encuentra un fallo de seguridad, corrígelo antes de ampliar la audiencia.
