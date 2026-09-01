# Selector de ventana de horas

## Qué hace

Permite ver la evolución de horas de cada juego en **los últimos 7 días, 1 mes o 6 meses**. El control es un grupo segmentado (`7d` / `1m` / `6m`) en todas las vistas que muestran gráficos de playtime.

## Archivos clave

| Ruta | Rol |
|------|-----|
| `src/lib/constants.ts` | `HOURS_RANGE_DAYS` (7 / 30 / 180) y `DEFAULT_HOURS_RANGE` (`7d`) |
| `src/lib/hours-range.ts` | Recorte de `ChartPoint[]` a la ventana |
| `src/hooks/useHoursRange.ts` | Estado compartido + `localStorage` |
| `src/components/charts/HoursRangeSelector.tsx` | UI segmentada |
| `src/components/charts/PlaytimeChart.tsx` | Gráfico de detalle filtrado |
| `src/components/charts/SparklineChart.tsx` | Sparklines filtradas |
| `src/lib/chart-merge.ts` | `getChartYDomain` para zoom del eje Y |

## Cómo funciona

1. El usuario elige `7d`, `1m` o `6m`. El valor se guarda en `localStorage` (`sstatics-hours-range`) y se replica en la misma pestaña con un evento custom.
2. `filterPointsByHoursRange` corta los snapshots a `hoy − N días` (UTC). Si hay un snapshot anterior, se arrastra su valor al inicio de la ventana.
3. Sparklines (biblioteca, feed, top 5) y `PlaytimeChart` (detalle + series de amigos) usan esa ventana.
4. El badge de progreso de las tarjetas se recalcula sobre los puntos recortados (horas ganadas en el periodo).

## Por qué

Steam solo da horas **acumuladas**. Recortar el eje X sin arrastrar el valor previo dejaría huecos; el eje Y desde 0 h dejaría líneas planas en juegos con mucho lifetime. Por eso se arrastra el último punto anterior y el dominio Y se ajusta al rango visible.

Las horas **totales** de la tarjeta no cambian: siguen siendo lifetime.

## Trampas conocidas

- `1m` son **30 días**, no un mes calendario; `6m` son **180 días**.
- Un solo snapshot histórico no muestra gráfico (sigue aplicando `MIN_SNAPSHOTS_FOR_CHART` = 2 sobre los datos originales).
- El selector vive **fuera** de los `Link` de cada juego para no interceptar la navegación.
