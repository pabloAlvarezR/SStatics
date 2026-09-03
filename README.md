# SStatics

Estadísticas de Steam con gráficos de evolución de horas jugadas y estética clásica de Steam.

Proyecto personal de [Pablo Álvarez](https://github.com/pabloAlvarezR). Lo publico para el portfolio y para quien quiera **leer el código o hacer un fork**. La instancia en producción es mía: no es un servicio abierto a inscripciones ni un producto que yo mantenga para terceros.

Si te sirve de referencia o quieres trastear en tu máquina, adelante. Conserva el aviso de copyright ([MIT](#licencia)); con eso basta.

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
- Para Postgres local: [Docker Desktop](https://www.docker.com/products/docker-desktop/) (opcional; también puedes usar SQLite o Neon)

## Instalación

```bash
# Clonar e instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tu STEAM_API_KEY y AUTH_SECRET

# Base de datos local (elige una):
npm run db:setup          # Postgres en Docker + db push
# o DATABASE_URL="file:./dev.db" y luego: npm run db:push

# Iniciar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Orientación rápida

1. [`docs/mapa-del-codigo.md`](./docs/mapa-del-codigo.md) — dónde está cada página, service y utilidad
2. El doc de dominio en [`docs/`](./docs/README.md) (sync, biblioteca, auth…)
3. Límites y TTL en [`src/lib/constants.ts`](./src/lib/constants.ts)
4. Si cambias comportamiento, actualiza el `.md` correspondiente en la misma tarea

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Postgres (`postgresql://…`) o SQLite local (`file:./dev.db`). Prod: Neon |
| `STEAM_API_KEY` | Clave de Steam Web API |
| `AUTH_SECRET` | Secreto para sesiones (min. 32 caracteres) |
| `AUTH_URL` | URL base (`http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app |
| `CRON_SECRET` | Bearer para `/api/cron/sync` (producción) |
| `OWNER_STEAM_IDS` | Steam IDs con tier owner, separados por coma (recomendado en prod) |

Plantilla comentada: [`.env.local.example`](./.env.local.example).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Sync schema + generate + servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run vercel-build` | Migrate deploy + build (Vercel) |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm test` | Tests con Vitest (lógica pura en `lib/`) |
| `npm run db:up` | Levanta Postgres (Docker) |
| `npm run db:setup` | Docker + sync schema + `db push` |
| `npm run db:push` | Aplica schema sin migración interactiva |
| `npm run db:migrate` | Migraciones Prisma (`migrate dev`) |
| `npm run db:studio` | Prisma Studio |

## Cómo funciona el historial

Steam solo expone las horas totales actuales (`playtime_forever`). SStatics guarda un **snapshot diario** por juego al sincronizar.

- Se importan **todos** los juegos de tu biblioteca, incluidos los de 0 h.
- **Juego nuevo detectado:** el primer snapshot usa las horas reales de Steam ese día (sin un día previo artificial a 0 h).
- Re-sincronizar el mismo día **actualiza** el snapshot de hoy, no duplica filas.
- Los datos se conservan hasta **10 años** sin purga automática.
- En el futuro, los tiers free/pro/master limitarán cuánto historial se **muestra** (3/6/10 años), no cuánto se guarda.

Detalle de modelos e índices: [`docs/base-de-datos.md`](./docs/base-de-datos.md).

## Rendimiento y escalabilidad

| Optimización | Detalle |
|---|---|
| **Deduplicación diaria** | 1 fila por juego por día (`userId + appId + captureDate`) |
| **Índices compuestos** | Consultas de biblioteca indexadas por `userId`, `playtimeMinutes`, `captureDate` |
| **Queries eficientes** | Biblioteca: último snapshot por juego; sparklines: historial completo por juego |
| **Sin purga automática** | Retención de 10 años en almacenamiento; límites de visualización por tier (futuro) |
| **Escritura por lotes** | Sync procesa juegos en batches (`SYNC_BATCH_SIZE` en constants) |

**Estimación de tamaño:** 500 juegos × 365 días × 1.000 usuarios ≈ 182 M filas (~15-20 GB). Producción usa PostgreSQL (Neon); la lógica de servicios no cambia al cambiar de motor.

Tras actualizar en un entorno con migraciones:

```bash
npx prisma migrate deploy
```

## Estructura

```
src/
├── app/              # Páginas y API routes (Next.js App Router)
├── components/       # UI por dominio (layout, library, game, …)
├── hooks/            # Hooks React
├── lib/              # Auth, Prisma, constantes, validadores
├── repositories/     # Queries SQL optimizadas
├── services/         # Lógica de negocio (Steam, sync, charts)
└── jobs/             # Cron de sync diario (dev local)
docs/                 # Documentación funcional (ver docs/README.md)
prisma/               # Esquema, migraciones y seed
__tests__/            # Tests Vitest (lógica pura)
```

## Documentación

- Mapa de código: [`docs/mapa-del-codigo.md`](./docs/mapa-del-codigo.md)
- Índice funcional: [`docs/`](./docs/README.md)

**Al cambiar funcionalidad, actualiza el doc correspondiente.**

### Tests

`npm test` cubre helpers puros (`chart-merge`, `playtime-progress`, `tier`, `minutesToHours`). Los services que hablan con Prisma o Steam aún no tienen suite de integración.

## Despliegue (alpha)

Guía paso a paso: [`docs/despliegue.md`](./docs/despliegue.md) (Vercel + Neon PostgreSQL + Cron). Checklist de seguridad: [`docs/seguridad.md`](./docs/seguridad.md).

## Privacidad Steam

Si tu biblioteca es privada, `GetOwnedGames` devuelve vacío. Ve a Steam → Perfil → Editar perfil → Privacidad → **Detalles de juegos: Público**.

## Licencia y contribuciones

[MIT](./LICENSE) — © 2026 Pablo Álvarez.

Puedes mirar, clonar, forkar y reutilizar el código. Si publicas un derivado, deja el aviso de copyright.

No busco un flujo de issues ni pull requests: es un proyecto de una persona, no una comunidad. Un fork es la forma limpia de experimentar por tu cuenta.

Steam, el logo de Steam y las carátulas de juegos son de Valve / sus respectivos autores; SStatics no está afiliado a Valve.
