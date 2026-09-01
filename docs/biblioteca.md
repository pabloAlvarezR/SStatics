# Biblioteca

## Ruta

`/library` — protegida por middleware.

**Archivos:** `src/app/library/page.tsx`, `src/components/library/*`, `src/services/chart.service.ts`

## Qué muestra

- Resumen de estadísticas (`StatsOverview`)
- Grid o lista de todos los juegos del usuario con:
  - Horas totales
  - Sparkline de evolución (si ≥2 snapshots)
  - Badge de progreso (`ProgressBadge`)
  - Horas últimas 2 semanas (dato live de Steam en último sync)

## Auto-sync en primera visita

Si el usuario no tiene snapshots (`needsSync`), la biblioteca dispara automáticamente `POST /api/sync` al cargar. Evita pantalla vacía en usuarios nuevos.

## Filtros y ordenación

**Componente:** `LibraryToolbar.tsx`  
**Estado:** `useLibraryPreferences` + `useFilteredGames`

| Filtro | Valor |
|--------|-------|
| Todos | `all` |
| Con horas | `played` |
| Sin jugar | `unplayed` |
| Jugados 7d | `recent7d` |
| Con gráfico | `hasChart` |

| Orden | Valor |
|-------|-------|
| Horas ↓ | `hours-desc` |
| Horas ↑ | `hours-asc` |
| Nombre A-Z | `name` |
| Última sesión | `recent` |
| Horas 2 sem. | `hours7d` |

## Vistas y densidad

- **Grid** con 3 densidades: compacta (S), normal (M), grande (L)
- **Lista** con `LibraryListItem`

Preferencias guardadas en `localStorage` (`useLibraryPreferences`). Los defaults iniciales vienen del perfil del usuario (`defaultView`, `gridDensity`) vía SSR.

## Gráficos en tarjetas

Un juego muestra sparkline solo si tiene ≥ `MIN_SNAPSHOTS_FOR_CHART` (2) snapshots. El progreso se calcula en `src/lib/playtime-progress.ts`.

El toolbar incluye `HoursRangeSelector` (`7d` / `1m` / `6m`). Recorta sparklines y el badge de progreso al periodo elegido. La preferencia se guarda en `localStorage` (`sstatics-hours-range`) y se comparte con el detalle del juego, el feed y el top 5.

Filtro de puntos: `src/lib/hours-range.ts` (arrastra el último snapshot anterior al corte).

## Estado vacío (filtros)

Si ningún juego coincide con los filtros, se muestra mensaje y un easter egg PS1: `Ps1PeekImage` con Silent Bomber. Ver `easter-eggs-ps1.md`.

## Datos

`getLibraryForUser()` en `chart.service.ts` usa queries del repositorio de snapshots para obtener el último snapshot por juego y el historial para sparklines.
