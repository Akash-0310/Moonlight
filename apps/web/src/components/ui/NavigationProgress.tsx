'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function Bar() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [width,   setWidth]   = useState(0);
  const [visible, setVisible] = useState(false);

  const ticker    = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const minTimer  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const active    = useRef(false);
  const minDone   = useRef(false);
  const navDone   = useRef(false);
  // Guard: ignore pushState calls from Next.js during initial hydration
  const ready     = useRef(false);

  function start() {
    if (active.current) return;
    active.current  = true;
    minDone.current = false;
    navDone.current = false;

    if (ticker.current)    clearInterval(ticker.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (minTimer.current)  clearTimeout(minTimer.current);

    setVisible(true);
    setWidth(10);

    ticker.current = setInterval(() => {
      setWidth(w => {
        if (w >= 80) { clearInterval(ticker.current!); return 80; }
        return w + (80 - w) * 0.07 + 0.6;
      });
    }, 110);

    minTimer.current = setTimeout(() => {
      minDone.current = true;
      if (navDone.current) complete();
    }, 300);
  }

  function complete() {
    if (ticker.current) clearInterval(ticker.current);
    setWidth(100);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
      active.current = false;
    }, 360);
  }

  function finish() {
    if (!active.current) return;
    navDone.current = true;
    if (minDone.current) complete();
  }

  useEffect(() => {
    const origPush = history.pushState.bind(history);

    history.pushState = function (state, title, url) {
      // Only fire after Next.js hydration is settled
      if (ready.current) {
        try {
          const next = new URL(
            (url ?? '').toString(),
            window.location.href,
          ).pathname;
          // Defer via setTimeout(0) so React state updates happen outside
          // the useInsertionEffect phase Next.js uses for pushState calls.
          if (next !== window.location.pathname) setTimeout(start, 0);
        } catch {
          // Malformed URL — ignore
        }
      }
      return origPush(state, title, url);
    };

    const onPop = () => { if (ready.current) setTimeout(start, 0); };
    window.addEventListener('popstate', onPop);

    // Allow time for Next.js to finish its own hydration pushState calls
    const readyTimer = setTimeout(() => { ready.current = true; }, 500);

    return () => {
      history.pushState = origPush;
      window.removeEventListener('popstate', onPop);
      clearTimeout(readyTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // New pathname = page rendered = finish progress
  useEffect(() => {
    finish();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 pointer-events-none"
      style={{ zIndex: 99999 }}
    >
      <div
        style={{
          height: '3px',
          width: `${width}%`,
          transition:
            width === 100
              ? 'width 340ms cubic-bezier(0.4,0,0.2,1)'
              : 'width 200ms ease',
          background:
            'linear-gradient(90deg,#b08848 0%,#c9a96e 35%,#ecdfa0 55%,#c9a96e 75%,#b08848 100%)',
          backgroundSize: '300% 100%',
          animation:
            visible && width < 100
              ? 'nav-progress-shimmer 1.8s linear infinite'
              : 'none',
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
