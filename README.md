# SStatics

Estadísticas de Steam con gráficos de evolución de horas jugadas. Visualiza tu biblioteca con estética clásica de Steam.

## Características

- Login con Steam (OpenID 2.0)
- Dashboard de estadísticas globales (horas, percentiles, rachas, heatmap)
- Biblioteca con vistas cuadrícula/lista, filtros y densidad configurable
- Gráficos de evolución por puntos (sparklines + detalle)
- Sección de amigos Steam con detección de usuarios en plataforma
- Perfil personalizable y perfil público
- Snapshots de sincronización para historial real
- Sync automático diario (03:00)
- Diseño responsive con estética Steam clásica

## Requisitos

- Node.js 20+
- npm 10+
- Steam Web API Key ([obtener aquí](https://steamcommunity.com/dev/apikey))
- Perfil de Steam con **detalles de juegos públicos**

## Instalación

```bash
# Clonar e instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tu STEAM_API_KEY y AUTH_SECRET

# Crear base de datos y tablas
npx prisma migrate dev

# Iniciar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL (`postgresql://...?sslmode=require`) — Neon/Supabase en prod |
| `STEAM_API_KEY` | Clave de Steam Web API |
| `AUTH_SECRET` | Secreto para sesiones (min. 32 caracteres) |
| `AUTH_URL` | URL base (`http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm test` | Tests con Vitest |
| `npm run db:migrate` | Migraciones Prisma |
| `npm run db:studio` | Prisma Studio |

## Cómo funciona el historial

Steam solo expone las horas totales actuales (`playtime_forever`). SStatics guarda un **snapshot diario** por juego al sincronizar.

- Se importan **todos** los juegos de tu biblioteca, incluidos los de 0 h.
- **Juego nuevo detectado:** se registra ayer con 0 h y hoy con las horas detectadas (gráfico de entrada visible).
- Re-sincronizar el mismo día **actualiza** el snapshot de hoy, no duplica filas.
- Los datos se conservan hasta **10 años** sin purga automática.
- En el futuro, los tiers free/pro/master limitarán cuánto historial se **muestra** (3/6/10 años), no cuánto se guarda.

## Rendimiento y escalabilidad

| Optimización | Detalle |
|---|---|
| **Deduplicación diaria** | 1 fila por juego por día (`userId + appId + captureDate`) |
| **Índices compuestos** | Consultas de biblioteca indexadas por `userId`, `playtimeMinutes`, `captureDate` |
| **Queries eficientes** | Biblioteca: último snapshot por juego; sparklines: historial completo por juego |
| **SQLite WAL** | Modo WAL + caché 64 MB para lecturas concurrentes rápidas |
| **Sin purga automática** | Retención de 10 años en almacenamiento; límites de visualización por tier (futuro) |
| **Escritura por lotes** | Sync procesa juegos en batches de 100 |

**Estimación de tamaño:** 500 juegos × 365 días × 1.000 usuarios ≈ 182 M filas (~15-20 GB). Para más escala, cambia `DATABASE_URL` a PostgreSQL sin modificar la lógica de servicios.

Tras actualizar, ejecuta la migración (con el servidor parado):

```bash
npx prisma migrate deploy
```

## Estructura

```
src/
├── app/              # Páginas y API routes (Next.js App Router)
├── components/       # UI (header, tarjetas, gráficos)
├── lib/              # Auth, Prisma, constantes, validadores
├── repositories/     # Queries SQL optimizadas
├── services/         # Lógica de negocio (Steam, sync, charts)
└── jobs/             # Cron de sync diario
docs/                 # Documentación funcional (ver docs/README.md)
prisma/               # Esquema, migraciones y seed
```

## Documentación

La documentación funcional vive en [`docs/`](./docs/README.md): arquitectura, auth, sync, biblioteca, amigos, easter eggs PS1, API, base de datos, **despliegue** y **seguridad**. **Al cambiar funcionalidad, actualiza el doc correspondiente.**

## Despliegue (alpha)

Guía paso a paso: [`docs/despliegue.md`](./docs/despliegue.md) (Vercel + Neon PostgreSQL + Cron). Checklist de seguridad: [`docs/seguridad.md`](./docs/seguridad.md).

## Privacidad Steam

Si tu biblioteca es privada, `GetOwnedGames` devuelve vacío. Ve a Steam → Perfil → Editar perfil → Privacidad → **Detalles de juegos: Público**.

## Licencia

Privado — SStatics
