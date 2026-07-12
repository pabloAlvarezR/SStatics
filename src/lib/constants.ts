/** Tamaño de lote para escrituras masivas en sync */
export const SYNC_BATCH_SIZE = 100;

/** Cooldown entre sincronizaciones manuales (5 minutos) */
export const SYNC_COOLDOWN_MS = 5 * 60 * 1000;

/** Mínimo de snapshots para mostrar gráfico de evolución */
export const MIN_SNAPSHOTS_FOR_CHART = 2;

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
