# Overlay de carga al navegar

Overlay a pantalla completa que aparece al pulsar un enlace interno (perfil, amigos, un juego, etc.) mientras Next.js carga el RSC del destino. Oscurece la UI y muestra un disco estilo CD PS1 + HUD Steam para que el clic no parezca “muerto” y se evite picarlo varias veces.

## Archivos clave

| Ruta | Rol |
|------|-----|
| `src/components/layout/NavigationLoading.tsx` | Cliente global: detecta clics / atrás / `startNavigation`, muestra el overlay |
| `src/components/ps1/Ps1LoadDisc.tsx` | Disco iridiscente + botones △○✕□ |
| `src/lib/navigation-loading.ts` | `shouldTrackHref`, `startNavigation`, suscripción |
| `src/lib/constants.ts` | `NAV_LOADING_SHOW_DELAY_MS` (100), `NAV_LOADING_MIN_VISIBLE_MS` (280), `NAV_LOADING_MAX_VISIBLE_MS` (8000) |
| `src/styles/globals.css` | Animaciones `ps1-load-*` y overlay `ps1-nav-overlay` |
| `src/app/layout.tsx` | Monta el loader en `Suspense` (por `useSearchParams`) |
| `src/components/replay/ReplayClient.tsx` | Llama `startNavigation(href)` antes de `router.push` al cambiar de mes |

## Cómo funciona

1. El usuario pulsa un `<a>` interno (header, cards, CTAs). Un listener en fase *capture* llama a `shouldTrackHref`.
2. Si la navegación tarda más de **100 ms**, se pinta el overlay (`z-[150]`, por encima del header `z-50`, por debajo del boot Konami `z-[200]`). Las scanlines CRT siguen encima.
3. `usePathname` + `useSearchParams` reflejan el árbol **renderizado**. Cuando cambia la clave path+search, el overlay se oculta (mínimo **280 ms** si llegó a verse).
4. Tope de **8 s** por si la navegación se cancela.
5. Atrás/adelante del navegador: evento `popstate`. Replay: `startNavigation(href)` porque usa `router.push`, no un `<a>`.

No se dispara en: la URL actual, solo hash, `/api/*` (login Steam), enlaces externos, `target=_blank`, download, clic con modificadores o botón medio.

Los `loading.tsx` de biblioteca / amigos / perfil / juego **siguen**: el overlay cubre el hueco hasta que la ruta pinta; después puede verse el skeleton de esa página.

## Por qué

Next.js App Router no tiene barra tipo NProgress. Los skeletons de `loading.tsx` aparecen dentro de `<main>`, no encima del header, así que el clic sigue sintiéndose inerte. Un overlay global al clic cubre ese hueco sin reescribir los 16 `next/link` ni añadir dependencias.

`useSearchParams` en el layout obliga a un `<Suspense fallback={null}>` para no forzar CSR de toda la app.

No se parchea `history.pushState` (frágil entre versiones de Next).

## Trampas conocidas

- Navegaciones prefetch instantáneas (<100 ms) no muestran el disco a propósito (evita un flash).
- `router.push` / `router.replace` fuera de Replay **no** encienden el overlay salvo que llamen a `startNavigation(href)`.
- `prefers-reduced-motion`: el disco no gira; solo pulso de opacidad.
- El overlay bloquea clics a propósito (rage-click). No atrapa el foco.
- Visual del disco: ver también `easter-eggs-ps1.md`. No es un secreto; es UX de navegación.
- En `popstate`, si React ya pintó la URL nueva no se arranca el overlay (evita quedarse 8 s colgado).
