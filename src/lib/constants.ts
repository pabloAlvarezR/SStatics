/** Tamaño de lote para escrituras masivas en sync */
export const SYNC_BATCH_SIZE = 100;

/** Juegos por petición de sync en serverless (evita timeout y transacciones largas) */
export const SYNC_CHUNK_SIZE = 60;

/** Umbral para avisar de biblioteca grande en la UI */
export const LARGE_LIBRARY_THRESHOLD = 100;

/** TTL de la caché temporal de juegos Steam entre chunks (30 min) */
export const SYNC_CACHE_TTL_MS = 30 * 60 * 1000;

/** Upserts en paralelo por chunk */
export const SYNC_PARALLEL_UPSERTS = 8;

/** Cooldown entre sincronizaciones manuales (5 minutos) */
export const SYNC_COOLDOWN_MS = 5 * 60 * 1000;

/** Mínimo de snapshots para mostrar gráfico de evolución */
export const MIN_SNAPSHOTS_FOR_CHART = 2;

/** Ventanas del selector de horas en gráficos y sparklines */
export const HOURS_RANGE_DAYS = {
  "7d": 7,
  "1m": 30,
  "6m": 180,
} as const;

export type HoursRangeId = keyof typeof HOURS_RANGE_DAYS;

export const DEFAULT_HOURS_RANGE: HoursRangeId = "7d";

/** Máximo de amigos superpuestos en el gráfico de un juego */
export const MAX_FRIENDS_CHART_COMPARE = 5;

/** TTL cache de amigos Steam (1 hora) */
export const FRIENDS_CACHE_TTL_MS = 60 * 60 * 1000;

/** TTL cache de horas Steam por amigo+juego (12 horas) */
export const STEAM_FRIEND_GAME_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

/** Intervalo mínimo entre llamadas a la API de Steam (~1 req/s) */
export const STEAM_API_MIN_INTERVAL_MS = 1100;

/** Máximo de refrescos Steam por petición (evita bloquear la página) */
export const STEAM_FRIEND_GAME_REFRESH_MAX = 8;

/** Mínimo de usuarios en plataforma para mostrar percentiles */
export const MIN_USERS_FOR_PERCENTILES = 5;

/** Retención máxima en almacenamiento (10 años) — sin purga automática por ahora */
export const STORAGE_RETENTION_YEARS = 10;

/** Límites de escaneos individuales por día según tier (owner = ilimitado) */
export const TIER_DAILY_SCANS = {
  free: 3,
  pro: 6,
  master: 15,
  owner: Number.POSITIVE_INFINITY,
} as const;

export type UserTier = keyof typeof TIER_DAILY_SCANS;

/** Límites de visualización por tier (futuro — no aplicados aún) */
export const TIER_HISTORY_YEARS = {
  free: 3,
  pro: 6,
  master: 10,
} as const;

/** Años de historial visibles actualmente (sin restricción de tier) */
export const VISIBLE_HISTORY_YEARS = STORAGE_RETENTION_YEARS;

/** Delay antes de mostrar el overlay de navegación (evita flash si el prefetch es instantáneo) */
export const NAV_LOADING_SHOW_DELAY_MS = 100;

/** Tiempo mínimo visible del overlay una vez mostrado */
export const NAV_LOADING_MIN_VISIBLE_MS = 280;

/** Tope de seguridad: oculta el overlay si la navegación no termina */
export const NAV_LOADING_MAX_VISIBLE_MS = 8000;
