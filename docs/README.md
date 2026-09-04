# Documentación de SStatics

Índice de la documentación funcional del proyecto. Cada archivo describe **qué hace una parte de la app**, **cómo está implementada** y **por qué** se tomaron ciertas decisiones.

> **Regla del proyecto:** al añadir o modificar funcionalidad, actualiza el documento correspondiente (o crea uno nuevo) en la misma PR/commit. Ver `.cursor/rules/documentacion.mdc`.

## Índice

| Documento | Contenido |
|-----------|-----------|
| [mapa-del-codigo.md](./mapa-del-codigo.md) | Dónde está cada cosa: página → service → API, inventario de `lib/` y tests |
| [arquitectura.md](./arquitectura.md) | Stack, estructura de carpetas, patrones generales |
| [autenticacion.md](./autenticacion.md) | Login Steam OpenID, sesiones JWT, middleware |
| [sincronizacion-y-escaneos.md](./sincronizacion-y-escaneos.md) | Sync de biblioteca, escaneos por juego, tiers, cron |
| [biblioteca.md](./biblioteca.md) | Vista de juegos, filtros, preferencias, sparklines |
| [selector-horas.md](./selector-horas.md) | Selector 7d / 1m / 6m en gráficos de horas |
| [juego-detalle-y-amigos.md](./juego-detalle-y-amigos.md) | Página de juego, gráficos, comparación con amigos |
| [amigos.md](./amigos.md) | Lista de amigos Steam, invitaciones, caché |
| [perfil.md](./perfil.md) | Perfil editable y perfil público |
| [feed-y-stats.md](./feed-y-stats.md) | Home autenticado, estadísticas globales |
| [leaderboard.md](./leaderboard.md) | Ranking de amigos (delta 7d); global aplazado |
| [admin-y-tiers.md](./admin-y-tiers.md) | Owner asigna tiers / unlimitedScans desde perfil |
| [replay-y-share.md](./replay-y-share.md) | Replay mensual, share semanal, Open Graph |
| [navegacion-loading.md](./navegacion-loading.md) | Overlay de carga al navegar (disco PS1) |
| [easter-eggs-ps1.md](./easter-eggs-ps1.md) | Homenaje PS1: componentes, triggers, assets |
| [api.md](./api.md) | Referencia de endpoints REST |
| [base-de-datos.md](./base-de-datos.md) | Modelos Prisma, snapshots, dual provider (PG/SQLite) |
| [despliegue.md](./despliegue.md) | Vercel + Neon + Cron (alpha pública) |
| [seguridad.md](./seguridad.md) | Medidas de seguridad y checklist pre-alpha |

## Lectura recomendada según tarea

| Si vas a tocar… | Lee primero |
|-----------------|-------------|
| Orientación general / “¿dónde está X?” | `mapa-del-codigo.md` |
| Login / sesiones | `autenticacion.md` |
| Horas / gráficos / snapshots | `sincronizacion-y-escaneos.md`, `base-de-datos.md`, `selector-horas.md` |
| Biblioteca o filtros | `biblioteca.md` |
| Selector 7d / 1m / 6m en gráficos | `selector-horas.md` |
| Comparación de amigos en un juego | `juego-detalle-y-amigos.md` |
| Amigos Steam / invitaciones | `amigos.md` |
| Perfil editable o público `/u/…` | `perfil.md` |
| Home feed o stats globales | `feed-y-stats.md` |
| Leaderboard de amigos | `leaderboard.md` |
| Roles / escaneos ilimitados (owner) | `admin-y-tiers.md`, `seguridad.md` |
| Replay / share / OG | `replay-y-share.md` |
| Overlay de carga al navegar | `navegacion-loading.md` |
| UI nostálgica / footer / secretos | `easter-eggs-ps1.md` |
| Nuevo endpoint | `api.md`, `arquitectura.md` |
| Schema Prisma / Docker / SQLite local | `base-de-datos.md` |
| Despliegue / producción | `despliegue.md`, `seguridad.md` |

## Convenciones de estos documentos

- Rutas de archivos relativas a la raíz del repo (`src/...`, `prisma/...`).
- Los valores numéricos (TTL, límites, tiers) deben coincidir con `src/lib/constants.ts`.
- Si un comportamiento cambia, actualiza **el documento y las constantes**; no dejes divergencias.
