# Autenticación

## Resumen

Los usuarios inician sesión con **Steam OpenID 2.0**. Tras verificar la identidad, NextAuth crea una **sesión JWT** con el `steamId` y el `id` interno (cuid).

## Archivos clave

| Archivo | Rol |
|---------|-----|
| `src/lib/steam-openid.ts` | Generación y verificación OpenID |
| `src/lib/auth.ts` | Configuración NextAuth, provider `steam` |
| `src/app/api/auth/steam/route.ts` | Redirect a Steam |
| `src/app/api/auth/steam/callback/route.ts` | Callback post-login |
| `src/app/api/auth/[...nextauth]/route.ts` | Handlers NextAuth |
| `src/middleware.ts` | Protección de rutas |

## Flujo paso a paso

1. Usuario pulsa «Iniciar sesión con Steam» → `GET /api/auth/steam`
2. `getSteamLoginUrl()` genera URL OpenID (realm = `AUTH_URL` o `NEXT_PUBLIC_APP_URL`)
3. Steam autentica y devuelve a `/api/auth/steam/callback`
4. `verifySteamLogin()` valida la assertion y extrae el Steam ID
5. `signIn("steam", { steamId })` → el provider `authorize()`:
   - Obtiene perfil con `getPlayerSummary()` (Steam Web API)
   - Hace `upsert` en tabla `User` (nombre, avatar, tier)
   - Devuelve usuario para el JWT
6. Redirect a `/library`

## Por qué OpenID + Credentials

Steam no ofrece un provider OAuth estándar en NextAuth. Se verifica identidad vía OpenID y luego se emite sesión con provider `Credentials` personalizado.

Tras verificar OpenID, el callback genera un `loginProof` HMAC (`src/lib/steam-login-proof.ts`, válido 5 min) que `authorize()` exige — impide login con un `steamId` arbitrario.

## Sesión JWT

`session.strategy: "jwt"` — la sesión incluye:

- `user.id` — cuid de Prisma
- `user.steamId` — ID Steam de 17 dígitos
- `user.name`, `user.image` — datos de perfil

## Errores de login

Los fallos redirigen a `/` con query `?error=`:

| Código | Significado |
|--------|-------------|
| `steam_login_failed` | No se pudo iniciar OpenID |
| `steam_verification_failed` | Assertion inválida |
| `steam_callback_failed` | Error en callback |

Mapeados en `src/app/page.tsx` (`ERROR_MESSAGES`).

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `STEAM_API_KEY` | Perfil y biblioteca Steam |
| `AUTH_SECRET` | Firmar JWT (mín. 32 caracteres) |
| `AUTH_URL` / `NEXT_PUBLIC_APP_URL` | Realm OpenID y redirects |

## Requisito de privacidad Steam

Para sincronizar biblioteca, el perfil debe tener **detalles de juegos públicos**. Si no, `GetOwnedGames` devuelve vacío y el sync falla con `PRIVATE_LIBRARY`.
