'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function Bar() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [width,   setWidth]   = useState(0);
  const [visible, setVisible] = useState(false);

  // Refs mirror the state values so closures always read the current value
  const visibleRef = useRef(false);
  const widthRef   = useRef(0);
  const ticker     = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const ready      = useRef(false);

  // Helpers that update both ref and state together
  function syncVisible(v: boolean) { visibleRef.current = v; setVisible(v); }
  function syncWidth(w: number)    { widthRef.current   = w; setWidth(w);   }

  function start() {
    if (visibleRef.current) return;                          // already showing
    if (ticker.current)    clearInterval(ticker.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);

    syncVisible(true);
    syncWidth(15);                                           // appear immediately at 15%

    // Advance toward 85% — all logic lives outside the state updater (no side effects)
    ticker.current = setInterval(() => {
      const next = widthRef.current >= 85
        ? 85
        : widthRef.current + (85 - widthRef.current) * 0.08 + 0.5;
      syncWidth(next);
      if (next >= 85) { clearInterval(ticker.current!); ticker.current = null; }
    }, 100);
  }

  function complete() {
    if (!visibleRef.current) return;                         // nothing to complete
    if (ticker.current) { clearInterval(ticker.current); ticker.current = null; }
    syncWidth(100);                                          // jump to 100% instantly
    hideTimer.current = setTimeout(() => {
      syncVisible(false);
      syncWidth(0);
    }, 420);
  }

  useEffect(() => {
    // Link clicks — direct call, zero delay
    const onLinkClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest('a');
      if (!a) return;
      const href = a.getAttribute('href') ?? '';
      if (!href.startsWith('/')) return;
      const dest = href.split('?')[0].split('#')[0];
      if (dest !== window.location.pathname) start();
    };
    document.addEventListener('click', onLinkClick);

    // router.push / router.replace — deferred to escape React's useInsertionEffect phase
    const origPush = history.pushState.bind(history);
    history.pushState = function (state, title, url) {
      if (ready.current) {
        try {
          const dest = new URL((url ?? '').toString(), window.location.href).pathname;
          if (dest !== window.location.pathname) setTimeout(start, 0);
        } catch { /* malformed URL */ }
      }
      return origPush(state, title, url);
    };

    // Browser back / forward
    const onPop = () => { if (ready.current) start(); };
    window.addEventListener('popstate', onPop);

    // 100 ms lets Next.js finish its own hydration pushState calls
    const t = setTimeout(() => { ready.current = true; }, 100);

    return () => {
      document.removeEventListener('click', onLinkClick);
      history.pushState = origPush;
      window.removeEventListener('popstate', onPop);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pathname changed = new page rendered = finish the bar
  useEffect(() => {
    complete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 99999 }}>
      <div
        style={{
          height: '3px',
          width: `${width}%`,
          transition:
            width === 100
              ? 'width 220ms cubic-bezier(0.4,0,0.2,1)'
              : 'width 180ms ease',
          background:
            'linear-gradient(90deg,#b08848 0%,#c9a96e 35%,#ecdfa0 55%,#c9a96e 75%,#b08848 100%)',
          backgroundSize: '300% 100%',
          animation: visible && width < 100 ? 'nav-progress-shimmer 1.8s linear infinite' : 'none',
        }}
      />
    </div>
  );
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
