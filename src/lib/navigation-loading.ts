export type NavigationLocation = {
  origin: string;
  pathname: string;
  search: string;
  hash: string;
};

type StartHandler = () => void;

const startListeners = new Set<StartHandler>();

function normalizeSearch(search: string): string {
  if (!search || search === "?") return "";
  return search.startsWith("?") ? search : `?${search}`;
}

export function navigationLocationKey(pathname: string, search: string): string {
  return `${pathname}${normalizeSearch(search)}`;
}

/**
 * ¿Este href debe disparar el overlay de navegación interna?
 * Puro: sin DOM. Ignora externo, `/api/*`, hash-only y la URL actual.
 */
export function shouldTrackHref(href: string, current: NavigationLocation): boolean {
  if (!href || href.startsWith("#")) return false;

  let url: URL;
  try {
    url = new URL(href, current.origin);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.origin !== current.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;

  const currentKey = navigationLocationKey(current.pathname, current.search);
  const nextKey = navigationLocationKey(url.pathname, url.search);
  return currentKey !== nextKey;
}

/** Arranca el overlay (p. ej. `router.push` en Replay). No-op si el destino es la URL actual. */
export function startNavigation(href?: string): void {
  if (href && typeof window !== "undefined") {
    const current: NavigationLocation = {
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
    };
    if (!shouldTrackHref(href, current)) return;
  }

  for (const listener of startListeners) {
    listener();
  }
}

export function subscribeNavigationStart(handler: StartHandler): () => void {
  startListeners.add(handler);
  return () => {
    startListeners.delete(handler);
  };
}
