# Replay y share

## Qué hace

- **`/replay`**: resumen mensual a partir de snapshots (horas ganadas, top juegos, día más activo, comparación con el mes anterior).
- **`/share/week`**: tarjeta de «mi semana» (horas 7d + top 3) con enlace copiable.
- Imágenes **Open Graph** en perfil público (`/u/[steamId]`), replay y semana para Discord/Twitter.

## Archivos clave

| Ruta | Rol |
|------|-----|
| `src/services/replay.service.ts` | `getMonthlyReplay`, `getWeekShare` |
| `src/app/replay/page.tsx` + `ReplayClient` | UI mes |
| `src/app/share/week/page.tsx` + `WeekShareClient` | UI semana |
| `src/app/u/[steamId]/opengraph-image.tsx` | OG perfil |
| `src/app/replay/opengraph-image.tsx` | OG replay (mes actual) |
| `src/app/share/week/opengraph-image.tsx` | OG semana |
| `src/components/profile/ShareProfileButton.tsx` | Copia URL del perfil |

## Cómo funciona

1. Replay calcula actividad diaria en el rango UTC del mes y deltas por juego (primer vs último snapshot del mes).
2. Share week usa `getUserHoursDelta(7)` y top de biblioteca.
3. Botones «Compartir» copian la URL absoluta al portapapeles.
4. Al pegar el link en Discord, la plataforma pide la `opengraph-image`.

## Por qué

Steam Replay es viral una vez al año; con snapshots diarios se puede ofrecer un rewind mensual y una card semanal sin scrapes externos.

## Privacidad

- Replay y share week requieren sesión (rutas protegidas).
- OG de perfil solo muestra datos si el perfil es público.
- No se exponen datos de amigos en las cards de semana/replay propias.

## Trampas conocidas

- Si no hubo syncs en el mes, el replay puede quedar casi vacío.
- La OG de `/replay` refleja el **mes UTC actual**, no necesariamente el mes del query string.
