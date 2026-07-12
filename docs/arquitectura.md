# Arquitectura

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Estado cliente | TanStack React Query |
| Gráficos | Recharts |
| Auth | NextAuth v5 (JWT) |
| Base de datos | Prisma + SQLite (WAL) |
| Validación API | Zod (`src/lib/validators/api.ts`) |
| Tests | Vitest |

## Estructura de carpetas

```
src/
├── app/              # Páginas y API routes (App Router)
├── components/       # UI por dominio (library, game, ps1, stats…)
├── hooks/            # Hooks React reutilizables
├── jobs/             # Cron (sync diario)
├── lib/              # Auth, Prisma, constantes, utilidades
├── repositories/     # Queries SQL optimizadas (snapshots)
├── services/         # Lógica de negocio
└── styles/           # globals.css (tema Steam + PS1)
docs/                 # Esta documentación
prisma/               # Esquema, migraciones, seed
public/branding/      # Logos y assets PS1
scripts/              # Utilidades de mantenimiento
```

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
- `CronInitializer` — arranca cron de sync diario
- `SteamHeader` — navegación
- `Ps1Footer` + `Ps1EasterEggs` — homenaje PS1 (ver `easter-eggs-ps1.md`)
- Clase `ps1-scanlines` en `<body>`

## Rutas protegidas

**Archivo:** `src/middleware.ts`

Prefijos que requieren sesión: `/library`, `/game`, `/friends`, `/profile`. Sin auth → redirect a `/`.

## Por qué SQLite

Adecuado para desarrollo y despliegues single-instance. La lógica de servicios no depende del motor: cambiar `DATABASE_URL` a PostgreSQL no requiere reescribir servicios. Ver estimaciones de tamaño en `README.md`.
