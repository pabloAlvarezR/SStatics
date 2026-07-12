# Perfil

## Rutas

| Ruta | Acceso | Archivo |
|------|--------|---------|
| `/profile` | Usuario autenticado | `src/app/profile/page.tsx` |
| `/u/[steamId]` | Público (si `isProfilePublic`) | `src/app/u/[steamId]/page.tsx` |

**Componente principal:** `src/components/profile/ProfileClient.tsx`  
**API:** `GET/PATCH /api/profile`

## Campos editables (PATCH)

| Campo | Descripción |
|-------|-------------|
| `bio` | Texto libre (máx. 300 caracteres) |
| `isProfilePublic` | Si el perfil `/u/[steamId]` es visible |
| `showStatsOnProfile` | Si las stats aparecen en perfil público |
| `defaultView` | Vista por defecto biblioteca: `grid` / `list` |
| `gridDensity` | Densidad grid: `compact` / `normal` / `large` |
| `accentColor` | Color de acento (paleta predefinida en UI) |

## UX del formulario

- Estado «dirty» — detecta cambios sin guardar
- `useUnsavedChangesWarning` — aviso `beforeunload` al salir con cambios
- Barra sticky guardar/descartar en móvil y desktop

## Perfil público

`/u/[steamId]` muestra:

- Avatar, nombre, bio
- Stats (`StatsOverview`) solo si `showStatsOnProfile=true`
- 404 si `isProfilePublic=false`

## Tier y escaneos

El perfil muestra badge de tier (`free`, `pro`, `master`, `owner`). El tier afecta límites de escaneo diario. Ver `sincronizacion-y-escaneos.md`.

## Invitación

Enlace copiable `/api/invite/{inviteCode}` para invitar amigos a la plataforma.
