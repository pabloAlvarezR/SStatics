# Arquitectura

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 15.5 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Estado cliente | TanStack React Query |
| Gráficos | Recharts 3 |
| Auth | NextAuth v5 (`5.0.0-beta.32`, JWT) |
| Base de datos | Prisma 6 — **PostgreSQL en prod** (Neon); local Postgres (Docker) o SQLite (`file:`) |
| Validación API | Zod (`src/lib/validators/api.ts`) |
| Tests | Vitest 4 (lógica pura en `lib/`; ver `mapa-del-codigo.md`) |

## Estructura de carpetas

```
src/
├── app/              # Páginas y API routes (App Router)
├── components/       # UI por dominio (layout, library, game, ps1, stats…)
├── hooks/            # Hooks React reutilizables
├── jobs/             # Cron local (sync diario)
├── lib/              # Auth, Prisma, constantes, utilidades
├── repositories/     # Queries SQL optimizadas (snapshots)
├── services/         # Lógica de negocio
└── styles/           # globals.css (tema Steam + PS1)
docs/                 # Esta documentación
prisma/               # Esquema, migraciones, seed
prisma.config.ts      # Seed y rutas Prisma (carga .env)
public/branding/      # Logos y assets PS1
scripts/              # Utilidades de mantenimiento (incl. sync-prisma-schema)
```

Mapa página → service → API: [`mapa-del-codigo.md`](./mapa-del-codigo.md).

## Patrones de diseño

### SSR + hidratación con React Query

Las páginas server (`page.tsx`) obtienen datos iniciales y los pasan como `initialData` a componentes cliente. React Query mantiene caché y revalidación sin perder el primer render rápido.

### Servicios vs repositorios

- **Services** (`src/services/`): orquestan lógica de negocio, llamadas a Steam, reglas de tier.
- **Repositories** (`src/repositories/`): queries Prisma/SQL complejas, especialmente sobre `PlaytimeSnapshot`.

### Validación en frontera API

Cada ruta en `src/app/api/` parsea entrada/salida con esquemas Zod. Los tipos compartidos viven en `src/lib/validators/api.ts`.

### Rate limiting Steam

`src/lib/steam-api-guard.ts` serializa llamadas (~1 req/s) para evitar 429 de la API de Steam.

## Layout global

**Archivo:** `src/app/layout.tsx`

Monta en todas las páginas:

- `QueryProvider` — React Query
- `CronInitializer` (`components/layout/`) — arranca cron de sync diario **solo en dev local**
- `SteamHeader` — navegación
- `Ps1Footer` + `Ps1EasterEggs` — homenaje PS1 (ver `easter-eggs-ps1.md`)
- Clase `ps1-scanlines` en `<body>`

## Rutas protegidas

**Archivo:** `src/middleware.ts`

Prefijos que requieren sesión: `/library`, `/game`, `/friends`, `/profile`. Sin JWT válido → redirect a `/`.

El middleware usa `getToken` (`next-auth/jwt`), no importa `@/lib/auth`, para mantener el bundle Edge bajo el límite de 1 MB en Vercel Hobby.

## Proveedor de base de datos

La lógica de servicios **no** depende del motor. `scripts/sync-prisma-schema.mjs` fija el `provider` de Prisma según `DATABASE_URL` antes de `generate` / migrate:

| Entorno | `DATABASE_URL` | Uso típico |
|---------|----------------|------------|
| Producción | `postgresql://…` (Neon) | Vercel — ver `despliegue.md` |
| Local (recomendado) | Postgres vía `npm run db:setup` | Misma familia que prod |
| Local (rápido) | `file:./dev.db` | SQLite sin Docker |

Detalle de modelos y trampas: [`base-de-datos.md`](./base-de-datos.md).
