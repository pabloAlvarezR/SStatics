# Easter eggs PS1

Homenaje nostálgico a la era PlayStation 1 integrado en toda la web. Diseñado para no bloquear la UX: detalles visibles sutiles y secretos opcionales.

## Componentes

| Componente | Archivo | Rol |
|------------|---------|-----|
| `Ps1EasterEggs` | `src/components/ps1/Ps1EasterEggs.tsx` | Orquestador global de triggers |
| `Ps1BootOverlay` | `src/components/ps1/Ps1BootOverlay.tsx` | Animación arranque PS1 (~4.2 s) |
| `Ps1Footer` | `src/components/ps1/Ps1Footer.tsx` | Mando en footer + leyenda parodia |
| `Ps1PeekImage` | `src/components/ps1/Ps1PeekImage.tsx` | Imagen que asoma y se revela al hover/tap |
| `Ps1FaceButtons` | `src/components/ps1/Ps1FaceButtons.tsx` | Símbolos △ ○ ✕ □ |

**Estilos:** `src/styles/globals.css` — clase `ps1-scanlines`, animaciones `ps1-boot-*`, `ps1-popup-in`.

**Montaje global:** `src/app/layout.tsx` monta `Ps1Footer`, `Ps1EasterEggs` y `ps1-scanlines` en `<body>`.

## Assets

Todos en `public/branding/`:

| Archivo | Uso |
|---------|-----|
| `mando_ps1_orig.png` | Footer — peek del mando |
| `Crash_bandicoot.png` | Popup Crash |
| `regina_dino_crisis.png` | Popup Regina + amigos sin filtros |
| `silent_bomber.png` | Popup Silent Bomber + biblioteca sin filtros |
| `medievil.png` | Página 404 |
| `logo-grande.png`, `logo-pequeno.png` | Branding SStatics (no easter egg) |

## Detalles visibles

### Footer (`Ps1Footer`)

- Asoma la **parte superior** del mando PS1
- Al pasar el cursor (o tocar en móvil) se revela el mando completo
- Texto parodia: *"Licensed by Sony Computer Entertainment"* con disclaimer de no afiliación
- Símbolos △ ○ ✕ □ con leyenda *Start / Select / Cancel / Confirm*

### Header (`SteamHeader`)

- `Ps1FaceButtons` junto a «Steam Analytics» — opacity baja, más visible al hover del logo

### Scanlines

- Overlay CRT muy sutil en todo el sitio (`body.ps1-scanlines`)

### Landing

- Tarjeta «Modo nostálgico» — insinúa que hay secretos por descubrir

## Easter eggs por contexto

| Ubicación | Trigger | Imagen |
|-----------|---------|--------|
| **404** (`not-found.tsx`) | Hover/tap en peek | MediEvil + cita Sir Daniel |
| **Biblioteca sin resultados** | Hover/tap en peek | Silent Bomber |
| **Amigos sin resultados** | Hover/tap en peek | Regina (Dino Crisis) |

## Secretos globales (`Ps1EasterEggs`)

| Secreto | Cómo activarlo | Resultado |
|---------|----------------|-----------|
| **Boot PS1** | Código Konami: ↑↑↓↓←→←→BA | Overlay «Sony Computer Entertainment» + logo PS |
| **Crash Bandicoot** | Escribir `wark` (fuera de inputs) | Popup «¡WOAH!» 2.8 s |
| **Crash Bandicoot** | 5 clics rápidos en logo (`data-ps1-logo`) | Mismo popup |
| **Dino Crisis** | Escribir `regina` | Popup «Regina, reporting for duty.» |
| **Silent Bomber** | Clic en pixel esquina inferior izquierda (opacity ~7%) | Popup «Silent Bomber · ¡Boom!» |

### Elementos con `data-ps1-logo` (5 clics → Crash)

- Logo en `SteamHeader`
- Logo en landing (`page.tsx`)
- Logo en `not-found.tsx`

## Comportamiento móvil

`Ps1PeekImage` y `Ps1Footer` detectan `(hover: hover)`:

- **Desktop:** hover expande la imagen
- **Móvil:** tap expande; segundo tap fuera cierra (footer)

Los popups y el boot funcionan igual en ambos.

## Añadir un nuevo easter egg

1. Añadir asset en `public/branding/` si hace falta
2. Crear o reutilizar componente en `src/components/ps1/`
3. Montar en layout, página o `Ps1EasterEggs` según alcance
4. Añadir estilos en `globals.css` si hay animación nueva
5. **Actualizar este documento** con trigger, ubicación e imagen

## Nota legal

El footer incluye disclaimer explícito: SStatics no está afiliado a Sony ni PlayStation. Los textos e imágenes son homenaje paródico/nostálgico.
