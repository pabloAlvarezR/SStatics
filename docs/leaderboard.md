# Leaderboard de amigos

## Qué hace

`/leaderboard` muestra un ranking de **horas ganadas en 7 días** entre el usuario y sus amigos de Steam que también están en SStatics. Incluye al usuario actual. Lifetime aparece como dato secundario.

El ranking **global** (toda la plataforma) está aplazado hasta tener más usuarios. Ranking de todo Steam no está en alcance.

## Archivos clave

| Ruta | Rol |
|------|-----|
| `src/app/leaderboard/page.tsx` | Página SSR |
| `src/components/leaderboard/LeaderboardClient.tsx` | Lista + refresh React Query |
| `src/services/leaderboard.service.ts` | Intersección amigos ∩ SStatics + deltas |
| `src/lib/leaderboard-rank.ts` | Ordenación pura |
| `src/app/api/leaderboard/route.ts` | `GET` autenticado |

## Cómo funciona

1. Se sincroniza/usa la caché de amigos Steam.
2. Se filtran amigos con cuenta SStatics.
3. Para cada uno (y tú): `getUserHoursDelta(..., 7)` + horas totales del último snapshot.
4. Se ordena por delta 7d → total → nombre.

Vacío (solo tú): CTA a `/friends` e `inviteCode`.

## Por qué

Los deltas semanales usan el moat de snapshots y evitan vanity de lifetime. Global SStatics se pospone para no mostrar un board de 2–3 personas.

## Trampas conocidas

- Amigos con perfil privado siguen en el board (vienen de la lista Steam), pero el enlace a `/u/...` solo si `isProfilePublic`.
- El board depende de que existan snapshots recientes para que el delta 7d sea significativo.
