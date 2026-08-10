# Feed y estadísticas

## Feed (home autenticado)

**Ruta:** `/` con sesión activa.

**Archivos:** `src/app/page.tsx`, `src/components/home/HomeFeed.tsx`, `src/services/feed.service.ts`

### Contenido

- Saludo según hora del día + nombre del usuario
- Fecha actual y hora de última sync
- CTAs «Compartir mi semana» y «Replay del mes»
- Top **8 juegos** con `lastPlayedAt` más reciente
- Por juego: cover, horas, sparkline, progreso, horas 2 semanas
- Bloque «Amigos esta semana» (delta 7d de amigos con perfil público)
- Enlaces rápidos a biblioteca, amigos, leaderboard y replay

### Datos

`getRecentGamesFeed(userId)` — ordena por `lastPlayedAt` descendente.

React Query: `queryKey: ["feed"]`, `staleTime: 60s`, `initialData` del SSR.

## Estadísticas globales

**Archivo:** `src/services/stats.service.ts`  
**Componente:** `src/components/stats/StatsOverview.tsx`

### Métricas

| Métrica | Origen |
|---------|--------|
| Horas totales, juegos, con/sin horas | Agregación snapshots |
| Deltas 48h, 7d, 14d, 30d | Comparación snapshots por periodo |
| Horas 2 semanas Steam | Último sync (`playtime2weeksMinutes`) |
| Racha / heatmap 30 días | `ActivityHeatmap` |
| Crecimiento semanal % | Cálculo sobre snapshots |
| Top 5 juegos | Con sparklines |
| Percentiles vs plataforma | Si ≥ `MIN_USERS_FOR_PERCENTILES` (5) usuarios |
| Edad cuenta, días desde sync | Metadatos `User` |

### Subcomponentes

- `StatCard` — tarjeta métrica individual
- `PercentileBadge` — posición relativa en plataforma
- `ActivityHeatmap` — actividad diaria
- `TopGamesRow` — top juegos con mini gráficos
- `ProgressBadge` — cambio reciente de horas

## Dónde aparecen las stats

| Ubicación | Modo |
|-----------|------|
| `/library` | Completo (`StatsOverview`) |
| `/profile` | Compacto |
| `/u/[steamId]` | Completo si `showStatsOnProfile` |

## Landing (sin sesión)

`src/app/page.tsx` — página de marketing con login Steam, features y manejo de errores/invitaciones. Incluye tarjeta «Modo nostálgico» que insinúa easter eggs PS1.
