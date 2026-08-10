# Admin y tiers (owner)

## Qué hace

El **owner** puede asignar a otros usuarios de SStatics un plan `free` / `pro` / `master` y un flag **`unlimitedScans`** (escaneos diarios ilimitados **sin** poderes de administración). No se puede otorgar ni modificar cuentas `owner` por UI.

## Archivos clave

| Ruta | Rol |
|------|-----|
| `prisma/schema.prisma` (`User.unlimitedScans`) | Flag de cuota ilimitada |
| `src/lib/tier.ts` | `hasUnlimitedScans`, `ASSIGNABLE_TIERS` |
| `src/services/scan.service.ts` | Respeta owner **o** `unlimitedScans` |
| `src/services/admin.service.ts` | Autorización y update de tier |
| `src/app/api/admin/users/[steamId]/route.ts` | `GET`/`PATCH` solo owner |
| `src/components/profile/OwnerTierControls.tsx` | Control discreto en perfil ajeno |
| `src/app/u/[steamId]/page.tsx` | Monta el control si el visitante es owner |

## Cómo funciona

1. Owner abre `/u/{steamId}` del amigo (también si el perfil es privado).
2. Ve un botón casi invisible `···` (oculto para el resto).
3. Elige tier y/o «Escaneos ilimitados» → `PATCH /api/admin/users/{steamId}`.
4. El amigo, al escanear, usa la nueva cuota de inmediato.

Límites diarios (`TIER_DAILY_SCANS`): free 3 · pro 6 · master 15 · owner / `unlimitedScans` ilimitado.

## Por qué

- Evita un panel `/admin` aparte: el flujo natural es visitar el perfil del amigo.
- `unlimitedScans` separa «más scans» de «poder de admin».
- `profileUpdateSchema` **no** acepta `tier` ni `unlimitedScans` (solo la API admin).

## Trampas conocidas

- Tras cambiar el tier, el amigo no necesita re-login para la cuota (se lee de BD en cada scan).
- Cuentas en `OWNER_STEAM_IDS` o con `tier=owner` están protegidas contra cambios.
