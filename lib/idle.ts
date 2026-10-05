/**
 * Runs `setup` when the browser is idle (or after `timeout` ms at the latest)
 * and returns a cleanup for useEffect. Scroll animations for sections below
 * the fold are built this way, each in its own short task, so they don't
 * block the first paint and the page stays responsive while it hydrates.
 */
export function whenIdle(setup: () => void | (() => void), timeout = 1200) {
  let cleanup: void | (() => void);
  let cancelled = false;
  const run = () => {
    if (!cancelled) cleanup = setup();
  };
  const ric = typeof window.requestIdleCallback === "function";
  const id = ric ? window.requestIdleCallback(run, { timeout }) : window.setTimeout(run, 50);
  return () => {
    cancelled = true;
    if (ric) window.cancelIdleCallback(id);
    else window.clearTimeout(id);
    cleanup?.();
  };
}
