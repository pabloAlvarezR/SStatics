# Despliegue en Vercel (alpha pública)

Guía para desplegar SStatics con **Vercel + Neon PostgreSQL + Vercel Cron**. Coste: 0 €/mes en tier gratuito.

## Requisitos previos

- Cuenta [GitHub](https://github.com) con el código del proyecto
- Cuenta [Vercel](https://vercel.com)
- Cuenta [Neon](https://neon.tech) (PostgreSQL gratis)
- [Steam Web API Key](https://steamcommunity.com/dev/apikey)
- Dominio Vercel (`*.vercel.app`) o dominio propio

## Paso 1: Base de datos (Neon)

1. Crea un proyecto en Neon (región cercana a tus usuarios, p. ej. `eu-central-1`)
2. Copia la **connection string** con `?sslmode=require`
3. Guárdala como `DATABASE_URL`

## Paso 2: Repositorio en GitHub

```bash
git init
git add .
git commit -m "Alpha: SStatics listo para Vercel"
git remote add origin https://github.com/TU_USUARIO/sstatics.git
git push -u origin main
```

> Nunca subas `.env` ni `.env.local`. El `.gitignore` ya los excluye.

## Paso 3: Proyecto en Vercel

1. [vercel.com/new](https://vercel.com/new) → Importar repo de GitHub
2. Framework: **Next.js** (detectado automáticamente)
3. **Build Command:** deja el default o usa `npm run vercel-build` (aplica migraciones Prisma)
4. Añade variables de entorno:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Connection string de Neon |
| `STEAM_API_KEY` | Tu clave Steam |
| `AUTH_SECRET` | 32+ caracteres aleatorios |
| `AUTH_URL` | `https://TU_PROYECTO.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Igual que `AUTH_URL` |
| `CRON_SECRET` | Otro secreto aleatorio (distinto de AUTH_SECRET) |
| `OWNER_STEAM_IDS` | Tu Steam ID de 17 dígitos (tier owner) |

5. Deploy

## Paso 4: Migraciones

El script `vercel-build` ejecuta `prisma migrate deploy` antes del build. En el primer deploy, Neon quedará con todas las tablas.

Para aplicar migraciones manualmente:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

## Paso 5: Cron diario

`vercel.json` programa el sync a las **03:00 UTC**:

```json
{
  "crons": [{ "path": "/api/cron/sync", "schedule": "0 3 * * *" }]
}
```

- En **plan Hobby** de Vercel, los crons están disponibles
- Vercel envía `Authorization: Bearer {CRON_SECRET}` automáticamente si `CRON_SECRET` está definido
- En desarrollo local, el cron usa `node-cron` (solo con `npm run dev`)

## Paso 6: Steam OpenID

Tras el primer deploy, verifica que `AUTH_URL` y `NEXT_PUBLIC_APP_URL` coincidan con la URL real. Steam OpenID usa el realm de esa URL.

Si cambias de dominio, actualiza ambas variables y redeploy.

## Paso 7: Comprobar el alpha

- [ ] Login con Steam funciona
- [ ] Sync de biblioteca importa juegos
- [ ] Perfil público `/u/[steamId]` respeta privacidad
- [ ] Escaneos individuales respetan límite diario (3 en tier free)
- [ ] Cron: revisar logs de Vercel al día siguiente

## Desarrollo local con Neon

Puedes usar la misma DB de Neon en dev (rama separada) o crear un segundo proyecto gratis:

```bash
cp .env.local.example .env.local
# Editar DATABASE_URL con Neon dev
npm run dev
npx prisma migrate dev
```

## Limitaciones del tier gratuito (alpha)

| Servicio | Límite relevante |
|----------|------------------|
| Vercel Hobby | 1 cron/día, serverless (sin node-cron en prod) |
| Neon Free | 0.5 GB, compute con sleep tras inactividad |
| Steam API | ~100k calls/día, rate limit por IP |

Para muchos usuarios sincronizando amigos a la vez, el rate limit de Steam puede ralentizar la comparación por juego (8 amigos/petición). Aceptable para alpha con amigos.

## Rollback

Vercel mantiene deployments anteriores. En el dashboard → Deployments → Promote to Production en un deploy previo.

## Ver también

- [seguridad.md](./seguridad.md) — medidas de seguridad para alpha pública
- [autenticacion.md](./autenticacion.md) — flujo Steam OpenID
