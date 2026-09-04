"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Ps1LoadDisc } from "@/components/ps1/Ps1LoadDisc";
import {
  NAV_LOADING_MAX_VISIBLE_MS,
  NAV_LOADING_MIN_VISIBLE_MS,
  NAV_LOADING_SHOW_DELAY_MS,
} from "@/lib/constants";
import {
  navigationLocationKey,
  shouldTrackHref,
  subscribeNavigationStart,
} from "@/lib/navigation-loading";

export { startNavigation } from "@/lib/navigation-loading";

function clearTimer(ref: { current: number | null }) {
  if (ref.current != null) {
    window.clearTimeout(ref.current);
    ref.current = null;
  }
}

export function NavigationLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const renderedKey = navigationLocationKey(pathname, searchParams.toString());

  const [visible, setVisible] = useState(false);

  const renderedKeyRef = useRef(renderedKey);
  renderedKeyRef.current = renderedKey;

  const pendingRef = useRef(false);
  const startKeyRef = useRef<string | null>(null);
  const visibleRef = useRef(false);
  const shownAtRef = useRef<number | null>(null);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const maxTimerRef = useRef<number | null>(null);

  const finish = useCallback(() => {
    clearTimer(showTimerRef);
    clearTimer(maxTimerRef);

    pendingRef.current = false;
    startKeyRef.current = null;

    if (!visibleRef.current) {
      shownAtRef.current = null;
      return;
    }

    const shownAt = shownAtRef.current ?? Date.now();
    const remaining = NAV_LOADING_MIN_VISIBLE_MS - (Date.now() - shownAt);

    const hide = () => {
      hideTimerRef.current = null;
      visibleRef.current = false;
      shownAtRef.current = null;
      setVisible(false);
    };

    if (remaining <= 0) {
      hide();
      return;
    }

    clearTimer(hideTimerRef);
    hideTimerRef.current = window.setTimeout(hide, remaining);
  }, []);

  const begin = useCallback(() => {
    clearTimer(hideTimerRef);

    pendingRef.current = true;
    startKeyRef.current = renderedKeyRef.current;

    clearTimer(maxTimerRef);
    maxTimerRef.current = window.setTimeout(() => {
      maxTimerRef.current = null;
      finish();
    }, NAV_LOADING_MAX_VISIBLE_MS);

    if (visibleRef.current) return;

    clearTimer(showTimerRef);
    showTimerRef.current = window.setTimeout(() => {
      showTimerRef.current = null;
      if (!pendingRef.current) return;
      visibleRef.current = true;
      shownAtRef.current = Date.now();
      setVisible(true);
    }, NAV_LOADING_SHOW_DELAY_MS);
  }, [finish]);

  useEffect(() => {
    if (!pendingRef.current) return;
    if (startKeyRef.current === renderedKey) return;
    finish();
  }, [renderedKey, finish]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor) return;
      if (anchor.hasAttribute("download")) return;

      const linkTarget = anchor.getAttribute("target");
      if (linkTarget && linkTarget !== "_self") return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const current = {
        origin: window.location.origin,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      };
      if (!shouldTrackHref(href, current)) return;

      begin();
    };

    const onPopState = () => {
      const windowKey = navigationLocationKey(window.location.pathname, window.location.search);
      if (windowKey === renderedKeyRef.current) return;
      begin();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    const unsubscribe = subscribeNavigationStart(begin);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      unsubscribe();
    };
  }, [begin]);

  useEffect(() => {
    return () => {
      clearTimer(showTimerRef);
      clearTimer(hideTimerRef);
      clearTimer(maxTimerRef);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.setAttribute("aria-busy", "true");

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.removeAttribute("aria-busy");
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="ps1-nav-overlay fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-[3px]"
      role="status"
      aria-live="polite"
      aria-label="Cargando"
    >
      <div className="ps1-load-stage">
        <Ps1LoadDisc />
        <p className="ps1-load-caption">
          NOW LOADING<span className="ps1-load-cursor">_</span>
        </p>
      </div>
    </div>
  );
}
