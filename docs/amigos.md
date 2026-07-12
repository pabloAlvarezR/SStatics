# Amigos

## Ruta

`/friends` — protegida por middleware.

**Archivos:** `src/app/friends/page.tsx`, `src/components/friends/*`, `src/services/friends.service.ts`

## Qué muestra

Lista de amigos de Steam enriquecida con:

- Si están registrados en SStatics (`isOnPlatform`)
- Horas y juegos totales (si perfil público en plataforma)
- Botón de invitación para quien no está en la plataforma

## Caché de lista de amigos

Tabla `SteamFriendCache` — TTL lógico de 1 hora (`FRIENDS_CACHE_TTL_MS`).

| Método | Endpoint | Comportamiento |
|--------|----------|----------------|
| GET | `/api/friends` | Lee caché; refresca si expirada |
| POST | `/api/friends` | Fuerza resync desde Steam (`forceSync: true`) |

## Filtros en UI

- **Todos** — lista completa
- **En SStatics** — solo amigos con cuenta en plataforma
- **Pendientes** — amigos sin cuenta
- Búsqueda por nombre

## Invitaciones

Cada usuario tiene `inviteCode` único. El enlace de invitación es:

```
/api/invite/{inviteCode}
```

Redirige a `/?invite={code}` con banner en landing. El invitado inicia sesión con Steam para unirse.

## Lista privada

Si la lista de amigos de Steam es privada, `GetFriendList` devuelve vacío. La UI muestra `isPrivate: true` con instrucciones para cambiar privacidad en Steam.

## Estado vacío (filtros)

Si ningún amigo coincide con filtros, se muestra `Ps1PeekImage` con Regina (Dino Crisis). Ver `easter-eggs-ps1.md`.

## Relación con comparación por juego

La lista de amigos (`SteamFriendCache`) es la fuente compartida para `getFriendsGameComparison()` en detalle de juego. Las horas por juego se resuelven aparte en `SteamFriendGameCache` y snapshots. Ver `juego-detalle-y-amigos.md`.
